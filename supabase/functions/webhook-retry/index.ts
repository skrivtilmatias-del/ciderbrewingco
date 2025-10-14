import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (_req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch pending retries
    const { data: pendingLogs, error: logsError } = await supabaseClient
      .from('webhook_logs')
      .select('*, webhook_configs(*)')
      .lte('next_retry_at', new Date().toISOString())
      .is('delivered_at', null)
      .is('failed_at', null)
      .lt('attempt_count', 5) // Max 5 attempts
      .limit(50);

    if (logsError) throw logsError;

    console.log(`Retrying ${pendingLogs?.length || 0} webhooks`);

    for (const log of pendingLogs || []) {
      await retryWebhook(supabaseClient, log);
    }

    return new Response(
      JSON.stringify({ success: true, retried: pendingLogs?.length || 0 }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('webhook-retry error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function retryWebhook(supabaseClient: any, log: any) {
  const config = log.webhook_configs;
  const timestamp = new Date().toISOString();
  const body = JSON.stringify({ ...log.payload, ts: timestamp });

  // Generate signature
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

    const updateData: any = {
      response_status: response.status,
      response_body: await response.text(),
      attempt_count: log.attempt_count + 1,
    };

    if (response.status >= 200 && response.status < 300) {
      updateData.delivered_at = new Date().toISOString();
      updateData.next_retry_at = null;
    } else if (log.attempt_count + 1 >= 5) {
      updateData.failed_at = new Date().toISOString();
      updateData.next_retry_at = null;
    } else {
      const retryDelay = Math.min(2 ** (log.attempt_count + 1) * 60 * 1000, 3600 * 1000);
      updateData.next_retry_at = new Date(Date.now() + retryDelay).toISOString();
    }

    await supabaseClient
      .from('webhook_logs')
      .update(updateData)
      .eq('id', log.id);

    console.log(`Webhook retry attempt ${log.attempt_count + 1} completed`);
  } catch (error: any) {
    console.error(`Webhook retry error: ${error.message}`);
    
    const updateData: any = {
      response_body: error.message,
      attempt_count: log.attempt_count + 1,
    };

    if (log.attempt_count + 1 >= 5) {
      updateData.failed_at = new Date().toISOString();
      updateData.next_retry_at = null;
    } else {
      const retryDelay = Math.min(2 ** (log.attempt_count + 1) * 60 * 1000, 3600 * 1000);
      updateData.next_retry_at = new Date(Date.now() + retryDelay).toISOString();
    }

    await supabaseClient
      .from('webhook_logs')
      .update(updateData)
      .eq('id', log.id);
  }
}