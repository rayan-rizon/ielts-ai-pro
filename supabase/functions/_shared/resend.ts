import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

export type EmailType = 
    | 'welcome' 
    | 'renewal_confirmation' 
    | 'payment_failed' 
    | 'quota_conversion' 
    | 'renewal_reminder' 
    | 'trial_expiry' 
    | 'inactivity_warning';

interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
    type: EmailType;
}

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function sendEmail({ to, subject, html, type }: SendEmailParams) {
    if (!resendApiKey) {
        console.error("Missing RESEND_API_KEY");
        return { error: "Missing RESEND_API_KEY" };
    }

    try {
        // 1. Check if email type is enabled by Admin
        const { data, error } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'email_preferences')
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error("Error fetching email settings:", error);
            // Fallback safe: allow send if setting fetch errors (except not found)
        }

        if (data && data.value) {
            const preferences = data.value as Record<string, boolean>;
            // If explicitly turned off, skip sending
            if (preferences[type] === false) {
                console.log(`Email '${type}' is disabled via Admin Settings. Skipping send to ${to}.`);
                return { success: true, skipped: true };
            }
        }

        // 2. Set Context-Aware Sender
        const supportEmails: EmailType[] = ['payment_failed'];
        const isSupport = supportEmails.includes(type);
        const from = isSupport 
            ? "IELTS AI Pro Support <mail@ieltsai.pro>" 
            : "IELTS AI Pro <mail@ieltsai.pro>";

        // 3. Dispatch to Resend API
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from,
                to,
                subject,
                html,
            }),
        });

        const result = await response.json();

        if (response.ok) {
            console.log(`Successfully sent '${type}' email to ${to}:`, result.id);
            return { success: true, id: result.id };
        } else {
            console.error(`Resend API Error sending '${type}' email:`, result);
            return { error: result };
        }

    } catch (err) {
        console.error("Unexpected error in sendEmail:", err);
        return { error: err };
    }
}
