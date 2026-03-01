import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const { sessionId } = await req.json();

    // Idempotency — return existing order if already created
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('stripe_session_id', sessionId)
      .maybeSingle();

    if (existingOrder) {
      return new Response(
        JSON.stringify({ order: existingOrder }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return new Response(
        JSON.stringify({ error: 'Payment not completed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { fan_id, event_id, items: itemsJson } = session.metadata!;
    const cartItems: { id: string; size: string; quantity: number }[] = JSON.parse(itemsJson);

    // Re-fetch prices from DB for the order snapshot
    const itemIds = cartItems.map((i) => i.id);
    const { data: dbItems } = await supabase
      .from('merch_items')
      .select('id, name, price')
      .in('id', itemIds);

    // Create order
    const qrCode = `MERCH-PUP-${sessionId.slice(4, 20).toUpperCase()}`;
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        fan_id,
        event_id: event_id || null,
        stripe_session_id: sessionId,
        status: 'paid',
        total: (session.amount_total ?? 0) / 100,
        qr_code: qrCode,
      })
      .select()
      .single();

    if (orderError) throw new Error(orderError.message);

    // Create order items
    const orderItems = cartItems.map((cartItem) => {
      const dbItem = dbItems?.find((d) => d.id === cartItem.id);
      return {
        order_id: order.id,
        merch_item_id: cartItem.id,
        name: dbItem?.name ?? 'Unknown item',
        price: Number(dbItem?.price ?? 0),
        size: cartItem.size,
        quantity: cartItem.quantity,
      };
    });

    await supabase.from('order_items').insert(orderItems);

    // Return the full order
    const { data: fullOrder } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', order.id)
      .single();

    // ── SMS confirmation (fire-and-forget) ──
    // Runs after order is committed so a Twilio error never blocks the response
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

    return new Response(
      JSON.stringify({ order: fullOrder }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
