import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Expected path: /r/batch/{id} or /r/blend/{id}
    // pathParts will be: ['r', 'batch', '{id}'] or ['r', 'blend', '{id}']
    if (pathParts.length < 3) {
      return new Response('Invalid path', { status: 400 });
    }

    const type = pathParts[1]; // 'batch' or 'blend'
    const id = pathParts[2];

    if (!['batch', 'blend'].includes(type)) {
      return new Response('Invalid resource type', { status: 400 });
    }

    console.log(`[QR Redirect] Type: ${type}, ID: ${id}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Get auth token from Authorization header
    const authHeader = req.headers.get('Authorization');
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    });

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log(`[QR Redirect] Auth check - User: ${user?.id || 'none'}, Error: ${authError?.message || 'none'}`);

    // Determine target path
    const targetPath = type === 'batch' 
      ? `/?batch=${id}&tab=production`
      : `/blend/${id}`;

    // Get the app origin
    const origin = req.headers.get('origin') || url.origin;
    
    if (user) {
      // User is authenticated - redirect to target
      console.log(`[QR Redirect] Authenticated - redirecting to ${targetPath}`);
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${origin}${targetPath}`,
          ...corsHeaders,
        },
      });
    } else {
      // User not authenticated - redirect to login with next parameter
      const loginPath = `/auth?next=${encodeURIComponent(targetPath)}`;
      console.log(`[QR Redirect] Not authenticated - redirecting to ${loginPath}`);
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${origin}${loginPath}`,
          ...corsHeaders,
        },
      });
    }
  } catch (error) {
    console.error('[QR Redirect] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
