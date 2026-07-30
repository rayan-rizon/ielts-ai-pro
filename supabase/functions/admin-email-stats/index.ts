import { createClient } from 'npm:@supabase/supabase-js@2';

const resendApiKey = Deno.env.get('RESEND_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('[admin-email-stats] Supabase service configuration is missing');
    return new Response(JSON.stringify({ error: 'Email metrics are not configured' }), {
      status: 503,
      headers: corsHeaders,
    });
  }

  if (!resendApiKey) {
    console.error('[admin-email-stats] RESEND_API_KEY is not configured');
    return new Response(JSON.stringify({ error: 'Resend email metrics are not configured' }), {
      status: 503,
      headers: corsHeaders,
    });
  }

  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .maybeSingle();

    if (profileError || userProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    // Fetch recent emails from Resend (last 100)
    const response = await fetch('https://api.resend.com/emails?limit=100', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[admin-email-stats] Resend request failed:', response.status, error);
      return new Response(JSON.stringify({ error: 'Unable to fetch Resend delivery metrics' }), {
        status: 502,
        headers: corsHeaders,
      });
    }

    const data = await response.json();
    const emails = data.data || [];

    // Basic aggregation for health metrics
    let delivered = 0;
    let bounced = 0;
    let failed = 0;
    let other = 0;

    for (const email of emails) {
      if (email.status === 'delivered') delivered++;
      else if (email.status === 'bounced') bounced++;
      else if (email.status === 'failed') failed++;
      else other++;
    }

    return new Response(
      JSON.stringify({
        metrics: {
          total: emails.length,
          delivered,
          bounced,
          failed,
          other,
        },
        recent: emails.slice(0, 10), // Only send 10 latest fully
      }),
      { headers: corsHeaders, status: 200 }
    );
  } catch (error) {
    console.error('[admin-email-stats] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Unable to load email delivery metrics' }), {
      headers: corsHeaders,
      status: 500,
    });
  }
});
