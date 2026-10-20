import Stripe from 'npm:stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

// Fan-paid service fee: 5% of the merch subtotal + $0.50.
// It's added on top of the merch price, so the artist keeps 100% of their
// prices. Stripe's card processing fee comes out of this (Merch PUP's share).
// Keep in sync with SERVICE_FEE_* in src/lib/fees.js (the cart display).
const SERVICE_FEE_PERCENT = 0.05;
const SERVICE_FEE_FLAT_CENTS = 50;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { items, eventId, fanId, successUrl, cancelUrl } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Fetch real prices from DB — never trust client-provided prices
    const itemIds = items.map((i: { id: string }) => i.id);
    const { data: dbItems, error } = await supabase
      .from('merch_items')
      .select('id, name, price, quantity_available, size_stock')
      .in('id', itemIds);

    if (error || !dbItems) throw new Error('Failed to fetch item prices');

    // Stock check before taking payment. (The final check happens again after
    // payment, in one database transaction, in case someone else buys the
    // last one in the meantime.)
    const wantedTotal = new Map<string, number>();
    const wantedBySize = new Map<string, number>();
    for (const cartItem of items as { id: string; size: string; quantity: number }[]) {
      wantedTotal.set(cartItem.id, (wantedTotal.get(cartItem.id) ?? 0) + cartItem.quantity);
      const key = `${cartItem.id}|${cartItem.size ?? ''}`;
      wantedBySize.set(key, (wantedBySize.get(key) ?? 0) + cartItem.quantity);
    }
    const stockProblem = (name: string, left: number) =>
      left <= 0 ? `${name} is sold out.` : `Only ${left} left of ${name}.`;

    for (const [key, wanted] of wantedBySize) {
      const [id, size] = key.split('|');
      const dbItem = dbItems.find((d) => d.id === id);
      if (!dbItem) continue; // reported as "Item not found" below
      const sizeStock = (dbItem.size_stock ?? {}) as Record<string, number>;
      const label = size && size !== 'One Size' ? `${dbItem.name} (${size})` : dbItem.name;
      if (size in sizeStock && sizeStock[size] < wanted) {
        return new Response(
          JSON.stringify({ error: `${stockProblem(label, sizeStock[size])} Update your cart and try again.` }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    for (const [id, wanted] of wantedTotal) {
      const dbItem = dbItems.find((d) => d.id === id);
      if (dbItem && (dbItem.quantity_available ?? 0) < wanted) {
        return new Response(
          JSON.stringify({ error: `${stockProblem(dbItem.name, dbItem.quantity_available ?? 0)} Update your cart and try again.` }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const lineItems = items.map((cartItem: { id: string; size: string; quantity: number }) => {
      const dbItem = dbItems.find((d) => d.id === cartItem.id);
      if (!dbItem) throw new Error(`Item not found: ${cartItem.id}`);
      const displayName =
        cartItem.size && cartItem.size !== 'One Size'
          ? `${dbItem.name} (${cartItem.size})`
          : dbItem.name;
      return {
        price_data: {
          currency: 'usd',
          product_data: { name: displayName },
          unit_amount: Math.round(Number(dbItem.price) * 100),
        },
        quantity: cartItem.quantity,
      };
    });

    // Resolve the promoter's connected Stripe account via the event's owner
    let stripeAccountId: string | null = null;
    if (eventId) {
      const { data: event } = await supabase
        .from('events')
        .select('owner_id')
        .eq('id', eventId)
        .single();

      if (event?.owner_id) {
        const { data: promoterProfile } = await supabase
          .from('profiles')
          .select('stripe_account_id')
          .eq('id', event.owner_id)
          .single();

        stripeAccountId = promoterProfile?.stripe_account_id ?? null;
      }
    }

    if (!stripeAccountId) {
      throw new Error('This promoter has not connected a Stripe account yet. Contact the promoter directly.');
    }

    const subtotalCents = lineItems.reduce(
      (sum: number, li: { price_data: { unit_amount: number }; quantity: number }) =>
        sum + li.price_data.unit_amount * li.quantity,
      0
    );
    const serviceFeeCents = Math.round(subtotalCents * SERVICE_FEE_PERCENT) + SERVICE_FEE_FLAT_CENTS;

    // Shown to the fan as its own line on the Stripe checkout page
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: 'Merch PUP service fee' },
        unit_amount: serviceFeeCents,
      },
      quantity: 1,
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      // Route payment to the promoter; Merch PUP keeps only the service fee,
      // so the promoter receives the full merch subtotal
      payment_intent_data: {
        application_fee_amount: serviceFeeCents,
        transfer_data: {
          destination: stripeAccountId,
        },
      },
      metadata: {
        fan_id: fanId,
        event_id: eventId ?? '',
        service_fee_cents: String(serviceFeeCents),
        items: JSON.stringify(
          items.map((i: { id: string; size: string; quantity: number }) => ({
            id: i.id,
            size: i.size,
            quantity: i.quantity,
          }))
        ),
      },
    });

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
