import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { sendEmail, EmailType } from "../_shared/resend.ts";
import { getEmailTemplate } from "../_shared/templates.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Authenticate the user - must be an admin
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Parse request body
    const { type, action, test_email } = await req.json();

    if (!type) {
      return new Response(JSON.stringify({ error: 'Missing email type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mock data for preview/test
    const mockData = {
      full_name: profile.full_name || user.email?.split('@')[0] || 'Admin Tester',
      subscription_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      referral_bonus_expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const template = getEmailTemplate(type, mockData);

    if (action === 'preview') {
      return new Response(JSON.stringify({ 
        subject: template.subject, 
        html: template.html 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'send') {
      if (!test_email) {
        return new Response(JSON.stringify({ error: 'Missing test_email address' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`Sending test email (${type}) to ${test_email}`);
      
      // We bypass the "is enabled" check for manual test sends
      // by calling sendEmail directly if we wanted to, but the current sendEmail
      // check is fine because it allows sending if it's NOT disabled.
      // Actually, let's just use the template.
      
      const result = await sendEmail({
        to: test_email,
        subject: `[TEST] ${template.subject}`,
        type: type as EmailType,
        html: template.html,
      });

      if (result.error) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, message: 'Test email sent successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Email Tester Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
