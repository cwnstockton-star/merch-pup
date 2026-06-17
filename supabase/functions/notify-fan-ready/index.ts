import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const { orderId } = await req.json();

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('qr_code, fan:profiles!fan_id(name, phone), event:events(artist, venue_name, pickup_window)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const phone = (order.fan as { phone?: string } | null)?.phone;
    if (!phone) {
      return new Response(JSON.stringify({ error: 'No phone number on file for this fan' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      return new Response(JSON.stringify({ error: 'SMS not configured on this project' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const event = order.event as { artist?: string; venue_name?: string; pickup_window?: string } | null;

    const lines = ['🐾 Merch PUP — Your order is ready for pickup!'];
    if (event?.artist) lines.push(`Show: ${event.artist}`);
    if (event?.venue_name) lines.push(`Head to the merch table at ${event.venue_name}.`);
    if (event?.pickup_window) lines.push(`Pickup window: ${event.pickup_window}`);
    lines.push(`Your pickup code: ${order.qr_code}`);
    lines.push('See you there!');

    const body = new URLSearchParams({
      To: phone,
      From: fromNumber,
      Body: lines.join('\n'),
    });

    const twilioRes = await fetch(
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

    if (!twilioRes.ok) {
      const errText = await twilioRes.text();
      return new Response(JSON.stringify({ error: `Twilio error: ${errText}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
