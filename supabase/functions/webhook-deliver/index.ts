import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { event_type, payload, user_id } = await req.json();

    // Fetch active webhook configs for this user and event type
    const { data: configs, error: configError } = await supabaseClient
      .from('webhook_configs')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true)
      .contains('events', [event_type]);

    if (configError) throw configError;

    console.log(`Found ${configs?.length || 0} webhook configs for event ${event_type}`);

    // Deliver to each webhook
    for (const config of configs || []) {
      await deliverWebhook(supabaseClient, config, event_type, payload);
    }

    return new Response(
      JSON.stringify({ success: true, delivered: configs?.length || 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('webhook-deliver error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function deliverWebhook(
  supabaseClient: any,
  config: any,
  event_type: string,
  payload: any
) {
  const timestamp = new Date().toISOString();
  const body = JSON.stringify({ event: event_type, ...payload, ts: timestamp });

  // Generate HMAC-SHA256 signature
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(config.secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${timestamp}.${body}`)
  );
  const signatureHex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  let logEntry = {
    webhook_config_id: config.id,
    event_type,
    payload: payload,
    attempt_count: 1,
    response_status: null as number | null,
    response_body: null as string | null,
    delivered_at: null as string | null,
    failed_at: null as string | null,
    next_retry_at: null as string | null,
  };

  try {
    const response = await fetch(config.endpoint_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Cider-Signature': `sha256=${signatureHex}`,
        'X-Cider-Timestamp': timestamp,
      },
      body,
    });

    logEntry.response_status = response.status;
    logEntry.response_body = await response.text();

    if (response.status >= 200 && response.status < 300) {
      logEntry.delivered_at = new Date().toISOString();
      console.log(`Webhook delivered successfully to ${config.endpoint_url}`);
    } else {
      // Schedule retry with exponential backoff
      const retryDelay = Math.min(2 ** logEntry.attempt_count * 60 * 1000, 3600 * 1000); // max 1 hour
      logEntry.next_retry_at = new Date(Date.now() + retryDelay).toISOString();
      console.log(`Webhook delivery failed (${response.status}), scheduling retry`);
    }
  } catch (error: any) {
    logEntry.response_body = error.message;
    const retryDelay = Math.min(2 ** logEntry.attempt_count * 60 * 1000, 3600 * 1000);
    logEntry.next_retry_at = new Date(Date.now() + retryDelay).toISOString();
    console.error(`Webhook delivery error: ${error.message}`);
  }

  // Save log entry
  await supabaseClient.from('webhook_logs').insert([logEntry]);
}