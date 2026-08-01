export interface EmailTemplate {
  subject: string;
  html: string;
}

// Brand & URL Constants
const BRAND_NAME = 'IELTS AI Pro';
const BASE_URL = 'https://ieltsai.pro';
const SUPPORT_EMAIL = 'support@ieltsai.pro';
const CURRENT_YEAR = new Date().getFullYear();

const wrapTemplate = (content: string, preheader: string, baseUrl: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${preheader}</title>
    <style>
        body { margin: 0; padding: 0; min-width: 100%; font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; background-color: #f6f5f3; -webkit-font-smoothing: antialiased; color: #18181b; line-height: 1.55; }
        table { border-spacing: 0; width: 100%; border-collapse: collapse; }
        td { padding: 0; }
        img { border: 0; display: block; max-width: 100%; }
        .wrapper { padding: 36px 16px; background-color: #f6f5f3; }
        .main { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e9e7e3; }
        .header { padding: 20px 40px; text-align: center; background: #111113; }
        .brand { display: inline-block; text-decoration: none; }
        .brand-logo { display: block; width: 176px; height: auto; margin: 0 auto; }
        .content { padding: 36px 40px 28px; }
        .footer { padding: 28px 40px 32px; background-color: #faf9f7; border-top: 1px solid #ebe9e5; text-align: center; }
        h1 { margin: 0 0 16px; font-size: 26px; font-weight: 800; letter-spacing: -0.03em; color: #18181b; line-height: 1.22; }
        h2 { margin: 26px 0 12px; font-size: 17px; font-weight: 750; color: #27272a; }
        p { margin: 0 0 18px; font-size: 16px; color: #52525b; }
        p.large { font-size: 18px; line-height: 1.5; color: #3f3f46; }
        a { color: #6c4cff; font-weight: 700; text-decoration: underline; }
        ul { margin: 0 0 24px; padding: 0; list-style-type: none; }
        ul li { margin-bottom: 11px; padding-left: 23px; position: relative; font-size: 15px; color: #52525b; }
        ul li:before { content: "✓"; position: absolute; left: 0; color: #6c4cff; font-weight: 800; }
        ol.steps { margin: 0 0 24px; padding: 0; list-style: none; counter-reset: step; }
        ol.steps li { counter-increment: step; min-height: 26px; margin-bottom: 13px; padding: 1px 0 0 40px; position: relative; font-size: 15px; color: #52525b; }
        ol.steps li:before { content: counter(step); position: absolute; top: 0; left: 0; width: 25px; height: 25px; border-radius: 50%; background: #f0edff; color: #6246d9; font-size: 13px; font-weight: 800; line-height: 25px; text-align: center; }
        .btn { display: inline-block; padding: 13px 22px; background: #6c4cff; color: #ffffff !important; text-decoration: none !important; border-radius: 9px; font-weight: 800; font-size: 15px; }
        .btn-secondary { background: #27272a; }
        .divider { margin: 28px 0; border-top: 1px solid #ebe9e5; }
        .highlight { font-weight: 800; color: #6c4cff; }
        .success-box, .alert-box { border-radius: 10px; padding: 18px; margin: 24px 0; }
        .success-box { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
        .alert-box { background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; }
        .status-eyebrow { margin: 0 0 6px; color: inherit; font-size: 11px; font-weight: 800; letter-spacing: 0.11em; line-height: 1.2; }
        .status-title { margin: 0; color: inherit; font-size: 15px; font-weight: 650; line-height: 1.5; }
        .footer-text { margin: 0 0 10px; font-size: 12px; color: #71717a; line-height: 1.6; text-align: center; }
        .footer-links { margin: 0 0 16px; text-align: center; }
        .footer-links a { display: inline-block; margin: 0 7px; font-size: 12px; color: #52525b !important; text-decoration: none; }
        .reason-text { font-size: 12px; color: #71717a; margin: 14px 0 0; text-align: center; }
        .cta-container { margin: 28px 0; text-align: center; }
        .cta-secondary { text-align: center; margin-top: 16px; font-size: 14px; }
        @media only screen and (max-width: 600px) {
            .wrapper { padding: 16px 8px; }
            .main { border-radius: 16px; }
            .content { padding: 28px 22px; }
            .header { padding: 18px 22px; }
            .footer { padding: 24px 22px; }
            h1 { font-size: 24px !important; }
            .btn { display: block; text-align: center; }
        }
    </style>
</head>
<body>
    <div style="display:none;font-size:1px;color:#f8fafc;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div>
    <table class="wrapper" border="0" cellpadding="0" cellspacing="0">
        <tr>
            <td align="center" valign="top">
                <table class="main" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                        <td class="header" style="background: #111113; padding: 20px 40px; text-align: center;">
                            <a href="${baseUrl}" class="brand" aria-label="${BRAND_NAME}">
                                <img class="brand-logo" src="${baseUrl}/footer.svg" width="176" height="42" alt="IELTS AI Pro" style="display: block; width: 176px; height: auto; margin: 0 auto; border: 0;" />
                            </a>
                        </td>
                    </tr>
                    <tr>
                        <td class="content">
                            ${content}
                        </td>
                    </tr>
                    <tr>
                        <td class="footer">
                            <div class="footer-links">
                                <a href="${baseUrl}/settings?tab=subscription">Manage</a>
                                <span style="color: #a1a1aa;">•</span>
                                <a href="${baseUrl}/privacy">Privacy</a>
                                <span style="color: #a1a1aa;">•</span>
                                <a href="${baseUrl}/terms">Terms</a>
                                <span style="color: #a1a1aa;">•</span>
                                <a href="${baseUrl}/settings?tab=preferences">Unsubscribe</a>
                            </div>
                            
                            <p class="footer-text">You're receiving this because of activity on your IELTS AI Pro account.</p>
                            <p class="footer-text" style="margin-top: 12px; font-size: 11px;">
                                &copy; ${CURRENT_YEAR} ${BRAND_NAME} · <a href="mailto:${SUPPORT_EMAIL}" style="color: #71717a; text-decoration: none; font-weight: 600;">${SUPPORT_EMAIL}</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

export function getEmailTemplate(type: string, data: any): EmailTemplate {
  const name = data.full_name || 'there';
  const baseUrl = BASE_URL;
  const sanitizedName = name.replace(/[<>]/g, ''); // Prevent HTML injection

  let subject = '';
  let preheader = '';
  let htmlContent = '';

  switch (type) {
    case 'welcome':
      subject = 'Welcome to your IELTS AI Pro subscription';
      preheader = 'Your practice tools and feedback are ready.';
      htmlContent = `
                <h1>Welcome, ${sanitizedName}</h1>
                <p class="large">Your subscription is active and your practice tools are ready to use.</p>
                
                <p>Your <a href="${baseUrl}">IELTS AI Pro</a> subscription is active. Here are a few ways to make the most of it:</p>
                
                <ul>
                    <li><strong>Practice Speaking and Writing</strong> with feedback in your dashboard</li>
                    <li><strong>Follow your Learning Path</strong> based on your goals and recent results</li>
                    <li><strong>Review your progress</strong> to decide what to work on next</li>
                </ul>
                
                <p>Choose your next practice task and use the feedback to focus your study time where it matters most.</p>
                
                <div class="cta-container">
                    <a href="${baseUrl}/dashboard" class="btn">Start Your First Practice</a>
                </div>
                
                <p style="font-size: 14px; color: #64748b; border-left: 3px solid #e2e8f0; padding-left: 16px; margin-top: 24px;">
                    <strong>Need help?</strong> Reply to this email or visit your dashboard for practice and progress tracking.
                </p>
            `;
      break;

    case 'renewal_confirmation':
      subject = 'Your IELTS AI Pro subscription renewed';
      preheader = 'Your subscription access continues without interruption.';
      htmlContent = `
                <h1>Your subscription has renewed</h1>
                <p class="large">Your IELTS AI Pro access continues without interruption.</p>
                
                <div class="success-box">
                    <p class="status-eyebrow">PAYMENT CONFIRMED</p>
                    <p class="status-title">Your subscription is active and ready for your next practice session.</p>
                </div>
                
                <p>Thank you for continuing with <a href="${baseUrl}">IELTS AI Pro</a>, ${sanitizedName}. Your subscription is active and your practice history remains available.</p>
                
                <ul>
                    <li>AI-powered Speaking and Writing evaluations</li>
                    <li>Priority processing for instant feedback</li>
                    <li>Detailed performance analytics</li>
                    <li>Expert guidance on improving your band score</li>
                </ul>
                
                <div class="cta-container">
                    <a href="${baseUrl}/dashboard" class="btn">Back to Your Dashboard</a>
                </div>
                
                <p style="font-size: 14px; color: #64748b; margin-top: 24px;">
                    <strong>Need to review your billing details?</strong> Visit your <a href="${baseUrl}/settings?tab=subscription">subscription settings</a> to view invoices, payment methods, and renewal dates.
                </p>
            `;
      break;

    case 'payment_failed':
      subject = 'Action needed: update your payment method';
      preheader = "We couldn't process your subscription renewal.";
      htmlContent = `
                <h1 style="color: #dc2626;">Update your payment method</h1>
                <p class="large">We couldn't process your subscription renewal.</p>
                
                <div class="alert-box" style="background: #fef2f2; border-color: #fecaca; color: #991b1b;">
                    <p class="status-eyebrow">PAYMENT ACTION REQUIRED</p>
                    <p class="status-title">Update your payment method to keep your subscription active. Your practice history is safely stored.</p>
                </div>
                
                <h2>Update your details</h2>
                <ol class="steps">
                    <li>Open your subscription settings.</li>
                    <li>Enter or select your current payment method.</li>
                    <li>We'll retry the payment after your details are updated.</li>
                </ol>
                
                <div class="cta-container">
                    <a href="${baseUrl}/settings?tab=subscription" class="btn" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);">Update Payment Method</a>
                </div>
                
                <p style="font-size: 14px; color: #64748b; margin-top: 24px;">
                    <strong>Need help?</strong> <a href="mailto:${SUPPORT_EMAIL}">Contact support</a> and include the email address on your account.
                </p>
            `;
      break;

    case 'quota_conversion':
      subject = 'You have one practice evaluation remaining';
      preheader = 'Use your final free evaluation or explore Premium practice.';
      htmlContent = `
                <h1>Your final free evaluation is ready</h1>
                <p class="large">You have just <span class="highlight">1 evaluation remaining</span> in your free practice quota.</p>
                
                <p>Use it for the task you want the most feedback on. Consistent practice and clear feedback can help you focus your next study session.</p>
                
                <h2>With Premium, you can:</h2>
                <ul>
                    <li><strong>Increase practice capacity:</strong> Get higher monthly Speaking and Writing evaluation limits.</li>
                    <li><strong>Personalized Learning:</strong> Get an Adaptive Study Path that evolves with your performance.</li>
                    <li><strong>Progress insights:</strong> Track your practice trends and identify your next focus area.</li>
                </ul>
                
                <div class="cta-container">
                    <a href="${baseUrl}/pricing" class="btn">Explore Premium</a>
                </div>
                
                <div class="cta-secondary">
                    or <a href="${baseUrl}/dashboard">use your last evaluation first</a>
                </div>
            `;
      break;

    case 'renewal_reminder':
      const renewDate = data.subscription_end_date
        ? new Date(data.subscription_end_date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
          })
        : 'next week';
      subject = 'Your subscription renews in 7 days';
      preheader = 'Your subscription will automatically renew on ' + renewDate + '.';
      htmlContent = `
                <h1>Your subscription renews soon</h1>
                <p>Hi ${sanitizedName},</p>
                
                <p>Your <strong><a href="${baseUrl}">IELTS AI Pro</a> subscription</strong> will automatically renew on <span class="highlight">${renewDate}</span>.</p>
                
                <p>No action is required—your subscription will continue seamlessly so you won't miss any of your progress or practice history.</p>
                
                <div class="success-box">
                    <p class="status-eyebrow">NO ACTION NEEDED</p>
                    <p class="status-title">Your subscription features and practice history will remain available.</p>
                </div>
                
                <p style="font-weight: 500; margin-bottom: 12px; color: #1e293b;">Want to manage your subscription?</p>
                <div class="cta-container" style="margin: 16px 0 24px 0;">
                    <a href="${baseUrl}/settings?tab=subscription" class="btn btn-secondary" style="background: #6b7280; box-shadow: none;">Manage Subscription</a>
                </div>
                
                <p style="font-size: 13px; color: #64748b;">
                    You can update your payment method, change your billing interval, or cancel anytime from your subscription settings. We're here to make it easy.
                </p>
            `;
      break;

    case 'trial_expiry':
      const expiryDate = data.referral_bonus_expires_at
        ? new Date(data.referral_bonus_expires_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
          })
        : 'very soon';
      subject = 'Use your bonus credits before they expire';
      preheader = 'Your referral bonus evaluations expire on ' + expiryDate + '.';
      htmlContent = `
                <h1>Your bonus credits expire soon</h1>
                <p class="large">You have <strong>3 days left</strong> to use your bonus evaluation credits.</p>
                
                <p>They expire on <span class="highlight">${expiryDate}</span> and won't be available after that date.</p>
                
                <h2>Put your credits to work</h2>
                <p>Complete a Speaking test or Writing task right now and get instant AI feedback on:</p>
                <ul>
                    <li>Grammar, vocabulary, and sentence structure</li>
                    <li>Fluency, coherence, and task achievement</li>
                    <li>Your estimated band score and how to improve it</li>
                </ul>
                
                <div class="cta-container">
                    <a href="${baseUrl}/dashboard" class="btn" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">Use Your Credits Now</a>
                </div>
                
                <p style="font-size: 13px; color: #64748b; text-align: center;">
                    After ${expiryDate}, you can still practice with Premium or our free tier.<br>Ready to upgrade? <a href="${baseUrl}/pricing">See our Premium plans</a>.
                </p>
            `;
      break;

    case 'inactivity_warning':
      subject = 'Ready for your next IELTS practice session?';
      preheader = 'Get back on track with a quick free practice session.';
      htmlContent = `
                <h1>Pick up where you left off</h1>
                <p class="large">It's been 7 days since your last practice session, ${sanitizedName}.</p>
                
                <p>Life gets busy. A focused practice session today can help you keep your preparation moving forward.</p>
                
                <h2>A simple way to restart</h2>
                <ul>
                    <li><strong>Start small.</strong> Spend 5–10 minutes reviewing one skill.</li>
                    <li><strong>Practice with purpose.</strong> Use feedback from one task to spot a pattern.</li>
                    <li><strong>Build a routine.</strong> Return when you are ready for the next session.</li>
                </ul>
                
                <div class="cta-container">
                    <a href="${baseUrl}/dashboard" class="btn">Resume Your Practice</a>
                </div>
                
                <div class="divider"></div>
                
                <h3 style="font-size: 16px; margin: 12px 0 8px 0; color: #1e293b; font-weight: 700;">Not sure what to practice?</h3>
                <p style="font-size: 14px; margin: 0;">Try a <strong>Speaking test</strong> (takes ~15 min) or a <strong>Writing task</strong> (takes ~20 min). Pick whichever section needs the most work.</p>
            `;
      break;

    default:
      subject = 'New message from IELTS AI Pro';
      preheader = 'Important notification';
      htmlContent = `
                <h1>Hello ${sanitizedName}</h1>
                <p>You've received a notification from IELTS AI Pro. Please log in to your account to view details.</p>
                <div class="cta-container">
                    <a href="${baseUrl}/dashboard" class="btn">Open Dashboard</a>
                </div>
            `;
      break;
  }

  return {
    subject,
    html: wrapTemplate(htmlContent, preheader, baseUrl),
  };
}
