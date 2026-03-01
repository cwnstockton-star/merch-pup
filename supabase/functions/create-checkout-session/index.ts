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
      .select('id, name, price')
      .in('id', itemIds);

    if (error || !dbItems) throw new Error('Failed to fetch item prices');

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

    // Resolve the venue's connected Stripe account via the event's owner
    let stripeAccountId: string | null = null;
    if (eventId) {
      const { data: event } = await supabase
        .from('events')
        .select('owner_id')
        .eq('id', eventId)
        .single();

      if (event?.owner_id) {
        const { data: venueProfile } = await supabase
          .from('profiles')
          .select('stripe_account_id')
          .eq('id', event.owner_id)
          .single();

        stripeAccountId = venueProfile?.stripe_account_id ?? null;
      }
    }

    if (!stripeAccountId) {
      throw new Error('This venue has not connected a Stripe account yet. Contact the venue directly.');
    }

    // 5% application fee (in cents) — stays with Merch Pup platform account
    const totalCents = lineItems.reduce(
      (sum: number, li: { price_data: { unit_amount: number }; quantity: number }) =>
        sum + li.price_data.unit_amount * li.quantity,
      0
    );
    const applicationFeeAmount = Math.round(totalCents * 0.05);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      // Route payment to venue; platform keeps 5%
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: stripeAccountId,
        },
      },
      metadata: {
        fan_id: fanId,
        event_id: eventId ?? '',
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
