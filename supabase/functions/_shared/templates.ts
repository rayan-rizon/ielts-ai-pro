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
        body { margin: 0; padding: 0; min-width: 100%; font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; -webkit-font-smoothing: antialiased; color: #0f172a; line-height: 1.6; }
        table { border-spacing: 0; width: 100%; }
        td { padding: 0; }
        img { border: 0; max-width: 100%; }
        
        .wrapper { padding: 40px 16px; background-color: #f8fafc; }
        .main { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        
        .header { padding: 48px 40px 10px 40px; text-align: center; }
        .logo-container { display: inline-flex; align-items: center; gap: 12px; text-decoration: none; }
        .logo-icon { background-color: #2563eb; color: #ffffff; width: 42px; height: 42px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); }
        .logo-text { font-size: 24px; font-weight: 900; letter-spacing: -0.02em; color: #0f172a; text-decoration: none; font-family: sans-serif; }
        .logo-text span { color: #2563eb; font-style: italic; }

        .content { padding: 32px 40px 24px; }
        .footer { padding: 32px 40px; background-color: #0f172a; border-top: 1px solid rgba(255,255,255,0.05); text-align: center; }
        
        .footer-text { margin: 0 0 8px; font-size: 13px; font-weight: normal; color: #94a3b8; line-height: 1.6; }
        .footer-links { margin: 0 0 20px; font-size: 13px; font-weight: 600; color: #e2e8f0; }
        .footer-links a { color: #f8fafc !important; text-decoration: none !important; transition: color 0.2s; }
        .footer-links a:hover { color: #ffffff !important; }
        
        h1 { margin: 0 0 20px; font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1.3; }
        p { margin: 0 0 20px; font-size: 16px; color: #334155; }
        p.large { font-size: 18px; color: #1e293b; }
        
        ul { margin: 0 0 24px; padding: 0; list-style-type: none; }
        li { margin-bottom: 12px; padding-left: 24px; position: relative; font-size: 15px; color: #475569; }
        li:before { content: "•"; position: absolute; left: 0; color: #4f46e5; font-weight: bold; }
        
        .btn { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); color: #ffffff !important; text-decoration: none !important; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.2); }
        .btn-secondary { background: #0f172a; color: #ffffff !important; }
        
        .divider { margin: 32px 0; border-top: 1px solid #e2e8f0; }
        .highlight { font-weight: 600; color: #4f46e5; }
        
        .success-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 24px 0; color: #166534; font-size: 14px; }
        .alert-box { background: #fffaf0; border: 1px solid #feebc8; border-radius: 8px; padding: 16px; margin: 24px 0; color: #c05621; font-size: 14px; }
        
        .footer-text { margin-bottom: 12px; font-size: 13px; color: #475569; line-height: 1.6; text-align: center; }
        .footer-text:last-child { margin-bottom: 0; }
        .footer a { color: #334155; text-decoration: none; font-weight: 600; }
        
        .footer-divider { margin: 16px 0; border-top: 1px solid #e2e8f0; }
        .footer-links { margin-top: 12px; text-align: center; }
        .footer-links a { display: inline-block; margin: 0 10px; font-size: 12px; color: #475569; text-decoration: none; }
        
        .reason-text { font-size: 12px; color: #64748b; margin: 14px 0 0 0; text-align: center; font-style: normal; }
        
        .cta-container { margin: 32px 0; text-align: center; }
        .cta-secondary { text-align: center; margin-top: 16px; font-size: 14px; }
        
        @media only screen and (max-width: 600px) {
            .wrapper { padding: 20px 12px; }
            .content { padding: 28px 20px; }
            .header { padding: 32px 20px 10px; }
            .footer { padding: 24px 20px; }
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
                        <td class="header">
                            <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                                <tr>
                                    <td align="center">
                                        <div class="logo-container">
                                            <div class="logo-icon">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block;">
                                                    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                    <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                </svg>
                                            </div>
                                            <div class="logo-text">IELTS <span>AI</span> Pro</div>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td class="content">
                            ${content}
                        </td>
                    </tr>
                    <tr>
                        <td class="footer">
                            <p class="footer-text" style="font-weight: 800; color: #ffffff; margin-bottom: 12px; font-size: 15px;">${BRAND_NAME}</p>
                            
                            <div class="footer-links">
                                <a href="${baseUrl}/settings?tab=subscription">Manage</a>
                                <span style="color: #475569;">•</span>
                                <a href="${baseUrl}/privacy">Privacy</a>
                                <span style="color: #475569;">•</span>
                                <a href="${baseUrl}/terms">Terms</a>
                                <span style="color: #475569;">•</span>
                                <a href="${baseUrl}/settings?tab=preferences">Unsubscribe</a>
                            </div>
                            
                            <p class="footer-text" style="margin-top: 16px; font-size: 11px; color: #64748b;">
                                &copy; ${CURRENT_YEAR} ${BRAND_NAME} • 
                                <a href="mailto:${SUPPORT_EMAIL}" style="color: #94a3b8; text-decoration: none; font-weight: normal;">${SUPPORT_EMAIL}</a>
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
            subject = "Your Premium IELTS training starts now 🚀";
            preheader = "Unlimited AI feedback, priority processing, and personalized insights await.";
            htmlContent = `
                <h1>Welcome to Premium, ${sanitizedName}! 🎓</h1>
                <p class="large">You've just unlocked everything you need to crush your target band score.</p>
                
                <p>Your <a href="${baseUrl}" style="color: #2563eb; text-decoration: none; font-weight: bold;">IELTS AI Pro</a> Premium subscription is now active. Here's what you can do right now:</p>
                
                <ul>
                    <li><strong>Up to 100 Speaking & 200 Writing evaluations</strong> each month</li>
                    <li><strong>Full access to the Adaptive AI Learning Path</strong> tailored to your goals</li>
                    <li><strong>Deep predictive insights</strong> to track your progress and target scores</li>
                    <li><strong>Priority access</strong> to all new Cambridge practice tests and materials</li>
                </ul>
                
                <p>Consistent practice with professional feedback is the proven path to IELTS success. Let's get you there.</p>
                
                <div class="cta-container">
                    <a href="${baseUrl}/dashboard" class="btn">Start Your First Practice</a>
                </div>
                
                <p style="font-size: 14px; color: #64748b; border-left: 3px solid #e2e8f0; padding-left: 16px; margin-top: 24px;">
                    <strong>Need help?</strong> Open your dashboard anytime for support, practice, and progress tracking.
                </p>
            `;
            break;

        case 'renewal_confirmation':
            subject = "Your Premium subscription renewed successfully ✅";
            preheader = "Uninterrupted access to unlimited practice and expert feedback.";
            htmlContent = `
                <h1>Subscription Renewed Successfully</h1>
                <p class="large">Your IELTS AI Pro Premium membership is continuing strong.</p>
                
                <div class="success-box">
                    <p>✓ Payment processed | ✓ Premium features unlocked | ✓ Ready to practice</p>
                </div>
                
                <p>Thank you for your continued trust in <a href="${baseUrl}" style="color: #2563eb; text-decoration: none; font-weight: bold;">IELTS AI Pro</a>, ${sanitizedName}. Your subscription has been renewed and you now have unlimited access to:</p>
                
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
            subject = "❌ Payment failed—update your payment method";
            preheader = "We couldn't process your renewal. Here's how to fix it quickly.";
            htmlContent = `
                <h1 style="color: #ef4444;">Payment Failed ⚠️</h1>
                <p class="large">We tried to process your Premium subscription renewal, but it didn't go through.</p>
                
                <div class="alert-box" style="background: #fef2f2; border-color: #fecaca; color: #991b1b;">
                    <p>⚠️ Your Premium access may be suspended if payment isn't updated soon. Don't lose access to your evaluations and practice history.</p>
                </div>
                
                <h2 style="font-size: 18px; margin: 24px 0 12px 0; color: #1e293b; font-weight: 700;">Here's what to do:</h2>
                <ol style="padding-left: 24px; margin: 0 0 24px 0; color: #475569;">
                    <li style="margin-bottom: 12px;">Click the button below to update your billing information</li>
                    <li style="margin-bottom: 12px;">Enter your current payment method</li>
                    <li style="margin-bottom: 0;">We'll automatically retry the charge within 24 hours</li>
                </ol>
                
                <div class="cta-container">
                    <a href="${baseUrl}/settings?tab=subscription" class="btn" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);">Update Payment Method</a>
                </div>
                
                <p style="font-size: 14px; color: #64748b; margin-top: 24px;">
                    <strong>Still having issues?</strong> Our support team is here to help. <a href="mailto:${SUPPORT_EMAIL}">Email us with your billing question</a>, and we'll resolve it ASAP.
                </p>
            `;
            break;

        case 'quota_conversion':
            subject = "Upgrade now: You're down to your last evaluation 🎯";
            preheader = "Unlock unlimited practice before your free credits run out.";
            htmlContent = `
                <h1>You're Making Real Progress! 🔥</h1>
                <p class="large">You have just <span class="highlight">1 evaluation remaining</span> in your free practice quota.</p>
                
                <p>The fact that you've used up your practice credits this quickly means you're putting in the work—and that dedication pays off. The fastest way to improve your IELTS band score is through <strong>consistent practice with professional feedback</strong>.</p>
                
                <h2 style="font-size: 18px; margin: 20px 0 14px 0; color: #1e293b; font-weight: 700;">Here's what's waiting for you with Premium:</h2>
                <ul>
                    <li><strong>Unlock High-Quota Practice:</strong> Significantly increase your monthly limits with up to 100 Speaking & 200 Writing evaluations.</li>
                    <li><strong>Personalized Learning:</strong> Get an Adaptive Study Path that evolves with your performance.</li>
                    <li><strong>Score Predictor:</strong> Use our advanced AI to predict your actual IELTS band score with high accuracy.</li>
                </ul>
                
                <p style="margin-top: 24px; font-size: 15px; background: #f0f9ff; padding: 16px; border-radius: 6px; border-left: 3px solid #0284c7; color: #0c4a6e;">
                    <strong>Limited time offer:</strong> Premium starts at just a few dollars a month. One IELTS test costs far more—make this investment in your score.
                </p>
                
                <div class="cta-container">
                    <a href="${baseUrl}/pricing" class="btn btn-secondary">Upgrade to Premium</a>
                </div>
                
                <div class="cta-secondary">
                    or <a href="${baseUrl}/dashboard">use your last evaluation first</a>
                </div>
            `;
            break;

        case 'renewal_reminder':
            const renewDate = data.subscription_end_date 
                ? new Date(data.subscription_end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
                : 'next week';
            subject = "Reminder: Your Premium renewal is in 7 days";
            preheader = "Your subscription will automatically renew on " + renewDate + ".";
            htmlContent = `
                <h1>Subscription Renewal Reminder 📅</h1>
                <p>Hi ${sanitizedName},</p>
                
                <p>Just a friendly heads-up: your <strong><a href="${baseUrl}" style="color: #2563eb; text-decoration: none;">IELTS AI Pro</a> Premium subscription</strong> will automatically renew in 7 days (on <span class="highlight">${renewDate}</span>).</p>
                
                <p>No action is required—your subscription will continue seamlessly so you won't miss any of your progress or practice history.</p>
                
                <div style="background: #f0fdf4; padding: 16px; border-radius: 6px; margin: 24px 0; border-left: 3px solid #22c55e;">
                    <p style="margin: 0; color: #166534;" >✓ Your Premium features will remain active</p>
                    <p style="margin: 8px 0 0 0; color: #166534;">✓ Your account data and progress are fully preserved</p>
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
                ? new Date(data.referral_bonus_expires_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
                : 'very soon';
            subject = "⏳ 3 days left: Use your bonus credits before they expire";
            preheader = "Your referral bonus evaluations expire on " + expiryDate + ".";
            htmlContent = `
                <h1 style="color: #f59e0b;">Your Bonus Credits Expire Soon ⏳</h1>
                <p class="large">You have <strong>3 days left</strong> to use your bonus evaluation credits!</p>
                
                <p>They expire on <span class="highlight">${expiryDate}</span> and won't be available after that date.</p>
                
                <h2 style="font-size: 18px; margin: 20px 0 14px 0; color: #1e293b; font-weight: 700;">Don't let them go to waste!</h2>
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
            subject = "Come back: Your IELTS prep is waiting for you 👋";
            preheader = "Get back on track with a quick free practice session.";
            htmlContent = `
                <h1>We Notice You've Been Away 👋</h1>
                <p class="large">It's been 7 days since your last practice session, ${sanitizedName}.</p>
                
                <p>We know life gets busy, but we wanted to remind you: <strong>consistent IELTS practice is the most reliable path to your target band score.</strong></p>
                
                <h2 style="font-size: 18px; margin: 20px 0 14px 0; color: #1e293b; font-weight: 700;">Here's why coming back now matters:</h2>
                <ul>
                    <li><strong>Skills fade quickly.</strong> Just 5-10 minutes of practice today keeps your momentum going</li>
                    <li><strong>Every session counts.</strong> Professional feedback on even one task helps you identify patterns</li>
                    <li><strong>Progress compounds.</strong> Each week of practice makes a measurable difference in your band score</li>
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
            subject = "New message from IELTS AI Pro";
            preheader = "Important notification";
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
        html: wrapTemplate(htmlContent, preheader, baseUrl)
    };
}
