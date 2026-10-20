import Stripe from 'npm:stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Short pickup code staff can read aloud, e.g. MP-7K3QX9.
// No 0/O or 1/I, so it can't be misread. 32 symbols → ~1 billion combinations.
function generatePickupCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return 'MP-' + Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

async function sendOrderSms(params: {
  phone: string;
  qrCode: string;
  pickupWindow: string | null;
  venueName: string | null;
  artistName: string | null;
}) {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

  if (!accountSid || !authToken || !fromNumber) return; // SMS not configured — skip silently

  const lines = ['🐾 Merch PUP — Order confirmed!'];
  if (params.artistName) lines.push(`Show: ${params.artistName}`);
  if (params.pickupWindow && params.venueName) {
    lines.push(`Pickup: ${params.pickupWindow} at ${params.venueName}`);
  } else if (params.pickupWindow) {
    lines.push(`Pickup window: ${params.pickupWindow}`);
  }
  lines.push(`Your code: ${params.qrCode}`);
  lines.push('Show this at the merch table. See you at the show!');

  const body = new URLSearchParams({
    To: params.phone,
    From: fromNumber,
    Body: lines.join('\n'),
  });

  await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    }
  );
}

const SOLD_OUT_MESSAGE =
  "Sorry — something in your order sold out while you were paying, so we couldn't " +
  "complete it. You've been fully refunded (it can take 5–10 days to show up). " +
  'Your cart is still saved if you want to adjust your order.';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Refund a sold-out order. The idempotency key makes repeat calls (e.g. the
// fan reloading the page) return the same refund instead of a new one.
async function refundSession(session: Stripe.Checkout.Session) {
  const paymentIntent =
    typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
  if (!paymentIntent) throw new Error('No payment to refund');
  await stripe.refunds.create(
    {
      payment_intent: paymentIntent,
      reverse_transfer: true,       // pull the money back from the promoter's account
      refund_application_fee: true, // and return Merch PUP's 5% fee
    },
    { idempotencyKey: `soldout-refund-${session.id}` },
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const fetchOrder = async (column: 'id' | 'stripe_session_id', value: string) => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq(column, value)
      .maybeSingle();
    return data;
  };

  try {
    const { sessionId } = await req.json();

    // Idempotency — this runs every time the confirmation page loads
    let order = await fetchOrder('stripe_session_id', sessionId);

    // Already finished → just return it
    if (order && (order.status === 'paid' || order.status === 'picked_up')) {
      return json({ order });
    }

    // Verify with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return json({ error: 'Payment not completed' }, 400);
    }

    // Previously sold out → make sure the refund went through, then report it
    if (order?.status === 'refunded') {
      await refundSession(session);
      return json({ error: SOLD_OUT_MESSAGE, soldOut: true }, 409);
    }

    const { fan_id, event_id, items: itemsJson } = session.metadata!;
    const cartItems: { id: string; size: string; quantity: number }[] = JSON.parse(itemsJson);

    // Create the order as 'pending' with a short pickup code. Codes are random,
    // so on the rare chance one is already taken, try a fresh one.
    let qrCode = order?.qr_code ?? '';
    for (let attempt = 0; attempt < 5 && !order; attempt++) {
      qrCode = generatePickupCode();
      const { data, error: orderError } = await supabase
        .from('orders')
        .insert({
          fan_id,
          event_id: event_id || null,
          stripe_session_id: sessionId,
          status: 'pending',
          total: (session.amount_total ?? 0) / 100, // what the fan paid, incl. service fee
          service_fee: Number(session.metadata?.service_fee_cents ?? 0) / 100,
          qr_code: qrCode,
        })
        .select()
        .single();

      if (!orderError) {
        order = data;
      } else if (orderError.code === '23505' && orderError.message.includes('stripe_session_id')) {
        // Another request for this same checkout got here first — use its order
        order = await fetchOrder('stripe_session_id', sessionId);
        qrCode = order?.qr_code ?? qrCode;
      } else if (!(orderError.code === '23505' && orderError.message.includes('qr_code'))) {
        throw new Error(orderError.message);
      }
    }
    if (!order) throw new Error('Could not create your order. Please try again.');

    // Take the stock, write the order items and mark it paid — all in one
    // database transaction (see migration 003_inventory_tracking.sql)
    const { data: finalStatus, error: finalizeError } = await supabase.rpc('finalize_order', {
      p_order_id: order.id,
      p_items: cartItems,
    });
    if (finalizeError) throw new Error(finalizeError.message);

    if (finalStatus === 'refunded') {
      await refundSession(session);
      return json({ error: SOLD_OUT_MESSAGE, soldOut: true }, 409);
    }

    const fullOrder = await fetchOrder('id', order.id);

    // ── SMS confirmation (fire-and-forget) ──
    // Only when THIS request finalized the order, so a reload or a duplicate
    // request doesn't re-text. Runs after the order is committed so a Twilio
    // error never blocks the response.
    if (finalStatus === 'finalized') {
      Promise.resolve().then(async () => {
        try {
          // Fan's phone number
          const { data: profile } = await supabase
            .from('profiles')
            .select('phone')
            .eq('id', fan_id)
            .single();

          if (!profile?.phone) return;

          // Event details for the SMS body
          let pickupWindow: string | null = null;
          let venueName: string | null = null;
          let artistName: string | null = null;

          if (event_id) {
            const { data: eventData } = await supabase
              .from('events')
              .select('artist, venue_name, pickup_window')
              .eq('id', event_id)
              .single();

            if (eventData) {
              pickupWindow = eventData.pickup_window;
              venueName = eventData.venue_name;
              artistName = eventData.artist;
            }
          }

          await sendOrderSms({
            phone: profile.phone,
            qrCode,
            pickupWindow,
            venueName,
            artistName,
          });
        } catch (_) {
          // SMS failure is non-fatal — order is already created
        }
      });
    }

    return json({ order: fullOrder });
  } catch (err) {
    return json({ error: (err as Error).message }, 400);
  }
});
