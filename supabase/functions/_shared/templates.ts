export interface EmailTemplate {
  subject: string;
  html: string;
  /**
   * Plain-text alternative. Sending `text` alongside `html` is what separates a
   * multipart email from an HTML-only one: it is what plain-text clients,
   * screen readers and text previews render, and its absence is a well-known
   * spam signal. Every template below produces one.
   */
  text: string;
}

// Brand & URL constants
const BRAND_NAME = 'IELTS AI Pro';
/**
 * Must stay on `www`. The apex `ieltsai.pro` has DNS records but nothing
 * answering on it — every link and the logo built from the apex resolved to a
 * connection timeout, which meant transactional mail shipped with a blank
 * header and dead Manage / Privacy / Terms / Unsubscribe links.
 */
const BASE_URL = 'https://www.ieltsai.pro';
const SUPPORT_EMAIL = 'support@ieltsai.pro';
const CURRENT_YEAR = new Date().getFullYear();

/**
 * Design tokens for email.
 *
 * These deliberately mirror the marketing site rather than the admin panel,
 * and they are literals — email clients strip `<style>` in enough places that
 * every meaningful colour also has to survive as an inline attribute.
 */
const INK = '#111113';
const HEADING = '#18181b';
const BODY_TEXT = '#52525b';
const LEAD_TEXT = '#3f3f46';
const MUTED_TEXT = '#71717a';
const ACCENT = '#6c4cff';
const ACCENT_DEEP = '#5b3be8';
const ACCENT_SOFT = '#f5f3ff';
const ACCENT_BORDER = '#ddd6fe';
const PAGE_BG = '#f4f3f1';
const CARD_BORDER = '#e8e5e0';
const FOOTER_BG = '#faf9f7';
const RULE = '#ebe9e5';

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Helvetica, Arial, sans-serif";

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

/* ------------------------------------------------------------------ *
 * Content builders
 *
 * Each returns a self-contained table or block with fully inline styles.
 * Templates below compose from these so every email shares one type scale,
 * one spacing rhythm and one button treatment instead of each case restyling
 * its own headings and CTAs.
 * ------------------------------------------------------------------ */

const eyebrow = (text: string, colour = ACCENT) =>
  `<p style="margin:0 0 10px;font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:${colour};line-height:1.2">${text}</p>`;

const heading = (text: string, colour = HEADING) =>
  `<h1 style="margin:0 0 16px;font-size:26px;font-weight:800;letter-spacing:-.02em;color:${colour};line-height:1.24">${text}</h1>`;

const lead = (text: string) =>
  `<p style="margin:0 0 18px;font-size:17px;font-weight:500;line-height:1.5;color:${LEAD_TEXT}">${text}</p>`;

const paragraph = (text: string, size = 15) =>
  `<p style="margin:0 0 16px;font-size:${size}px;line-height:1.65;color:${BODY_TEXT}">${text}</p>`;

const strong = (text: string) =>
  `<strong style="color:${HEADING};font-weight:700">${text}</strong>`;

const link = (href: string, text: string) =>
  `<a href="${href}" style="color:${ACCENT};font-weight:700;text-decoration:underline">${text}</a>`;

/**
 * Checklist. Built from table rows rather than `<ul>` — Outlook's list
 * rendering ignores padding and produces ragged indents, so the tick and the
 * copy are laid out as two cells instead.
 */
const checklist = (items: string[]) => `
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:0 0 22px;border-collapse:collapse">
  ${items
    .map(
      (item) => `<tr>
    <td width="26" valign="top" style="padding:0 0 11px;font-size:15px;line-height:1.6;color:${ACCENT};font-weight:800">&#10003;</td>
    <td valign="top" style="padding:0 0 11px;font-size:15px;line-height:1.6;color:${BODY_TEXT}">${item}</td>
  </tr>`
    )
    .join('')}
</table>`;

/** Numbered steps, same two-cell approach as the checklist. */
const steps = (items: string[]) => `
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:0 0 22px;border-collapse:collapse">
  ${items
    .map(
      (item, index) => `<tr>
    <td width="38" valign="top" style="padding:0 0 12px">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr>
        <td width="26" height="26" align="center" valign="middle" style="width:26px;height:26px;background:${ACCENT_SOFT};border-radius:13px;font-size:13px;font-weight:800;color:${ACCENT_DEEP};line-height:26px;text-align:center">${index + 1}</td>
      </tr></table>
    </td>
    <td valign="top" style="padding:2px 0 12px;font-size:15px;line-height:1.6;color:${BODY_TEXT}">${item}</td>
  </tr>`
    )
    .join('')}
</table>`;

/**
 * Status callout. `tone` picks the colour trio; the eyebrow carries the state
 * in words as well as colour, so the meaning survives for anyone who cannot
 * distinguish the tint.
 */
const notice = (tone: 'ok' | 'warn' | 'fault' | 'info', label: string, body: string) => {
  const palette = {
    ok: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' },
    warn: { bg: '#fff7ed', border: '#fed7aa', text: '#9a3412' },
    fault: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b' },
    info: { bg: ACCENT_SOFT, border: ACCENT_BORDER, text: '#4c43a8' },
  }[tone];
  return `
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-collapse:separate;background:${palette.bg};border:1px solid ${palette.border};border-radius:12px">
  <tr><td style="padding:16px 18px">
    <p style="margin:0 0 5px;font-size:11px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;color:${palette.text};line-height:1.2">${label}</p>
    <p style="margin:0;font-size:15px;font-weight:600;line-height:1.5;color:${palette.text}">${body}</p>
  </td></tr>
</table>`;
};

/**
 * Bulletproof CTA.
 *
 * The VML branch is what makes this render as a real button in Outlook
 * 2007–2019, which ignores `border-radius` and `padding` on anchors and would
 * otherwise show a bare underlined link. Non-Outlook clients skip the
 * conditional entirely and get the padded anchor.
 */
const button = (href: string, label: string, colour = ACCENT) => `
<table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin:28px auto 8px">
  <tr><td align="center">
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:48px;v-text-anchor:middle;width:280px" arcsize="20%" stroke="f" fillcolor="${colour}">
      <w:anchorlock/>
      <center style="color:#ffffff;font-family:${FONT_STACK};font-size:15px;font-weight:bold">${label}</center>
    </v:roundrect>
    <![endif]-->
    <!--[if !mso]><!-- -->
    <a href="${href}" style="display:inline-block;padding:14px 30px;background:${colour};color:#ffffff;text-decoration:none;border-radius:10px;font-weight:800;font-size:15px;line-height:1.2;mso-hide:all">${label}</a>
    <!--<![endif]-->
  </td></tr>
</table>`;

const secondaryLink = (text: string) =>
  `<p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:${MUTED_TEXT};text-align:center">${text}</p>`;

/** Quiet closing note, separated by a hairline rather than a coloured band. */
const footnote = (text: string) => `
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:26px 0 0;border-collapse:collapse">
  <tr><td style="padding:20px 0 0;border-top:1px solid ${RULE};font-size:13px;line-height:1.6;color:${MUTED_TEXT}">${text}</td></tr>
</table>`;

/* ------------------------------------------------------------------ *
 * Shell
 * ------------------------------------------------------------------ */

/**
 * Wrap rendered content in the branded email shell.
 *
 * Notes on the parts that are not obvious:
 *
 * - `color-scheme` / `supported-color-schemes` stop Gmail and Apple Mail from
 *   force-inverting the palette in dark mode, which previously turned the ink
 *   header and the light body into an unreadable mid-grey wash.
 * - The preheader is padded with zero-width joiners so Gmail's preview line
 *   shows only the intended sentence instead of pulling in the first paragraph.
 * - The `[if mso]` table gives Outlook a fixed 600px column, since it ignores
 *   `max-width` on tables and would otherwise stretch the card to full width.
 * - The logo is a PNG, not the site's `footer.svg`: Gmail, Outlook and Yahoo
 *   all refuse to render SVG in email, so the SVG header came up blank for most
 *   recipients. `public/footer.png` is a 2x raster of the same mark, served at
 *   176x42 so it stays sharp on retina. The styled `alt` still matters — Gmail
 *   blocks images from unknown senders by default, and this makes that case
 *   read as the brand name in brand type rather than a broken-image box.
 */
export const wrapTemplate = (
  content: string,
  preheader: string,
  baseUrl: string,
  /**
   * Why this email arrived. Transactional mail is sent on account activity;
   * marketing mail is sent on consent, and saying so is a compliance
   * requirement rather than a nicety — so the campaign renderer overrides it.
   */
  footerReason = `You are receiving this because of activity on your ${BRAND_NAME} account.`,
  /**
   * Where "Unsubscribe" points. Marketing mail passes a token-authenticated
   * one-click URL that works without signing in; transactional mail falls back
   * to the Settings tab, where the same toggle lives for logged-in learners.
   */
  unsubscribeUrl = `${baseUrl}/settings?tab=preferences`,
  navigation = {
    manageUrl: `${baseUrl}/settings?tab=subscription`,
    manageLabel: 'Manage',
    showUnsubscribe: true,
  }
) => `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${preheader}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    :root { color-scheme: light; supported-color-schemes: light; }
    body { margin:0; padding:0; width:100% !important; background-color:${PAGE_BG}; -webkit-font-smoothing:antialiased; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table { border-spacing:0; border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; }
    td { padding:0; }
    img { border:0; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
    a { color:${ACCENT}; }
    @media only screen and (max-width:620px) {
      .card { border-radius:0 !important; border-left:0 !important; border-right:0 !important; }
      .wrap { padding:0 !important; }
      .pad { padding:30px 24px !important; }
      .head { padding:20px 24px !important; }
      .foot { padding:26px 24px !important; }
      .h1 { font-size:23px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${PAGE_BG};font-family:${FONT_STACK};color:${HEADING}">
  <div style="display:none;font-size:1px;color:${PAGE_BG};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${preheader}&#8203;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:${PAGE_BG}">
    <tr>
      <td class="wrap" align="center" valign="top" style="padding:36px 16px">
        <!--[if mso]><table role="presentation" width="600" border="0" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
        <table role="presentation" class="card" width="100%" border="0" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;margin:0 auto;background-color:#ffffff;border:1px solid ${CARD_BORDER};border-radius:16px;overflow:hidden">

          <tr>
            <td class="head" align="center" style="padding:22px 40px;background-color:${INK}">
              <a href="${baseUrl}" style="display:inline-block;text-decoration:none">
                <img src="${baseUrl}/footer.png" width="176" height="42" alt="${BRAND_NAME}" style="display:block;width:176px;height:auto;margin:0 auto;border:0;color:#f7f8ff;font-family:${FONT_STACK};font-size:17px;font-weight:800;letter-spacing:-.01em;line-height:42px;text-align:center;text-decoration:none" />
              </a>
            </td>
          </tr>

          <tr>
            <td style="font-size:0;line-height:0">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td height="3" style="height:3px;background-color:${ACCENT};font-size:0;line-height:0">&nbsp;</td>
                  <td height="3" style="height:3px;background-color:#8a6bff;font-size:0;line-height:0">&nbsp;</td>
                  <td height="3" style="height:3px;background-color:#a977ff;font-size:0;line-height:0">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="pad" style="padding:38px 40px 32px">
              ${content}
            </td>
          </tr>

          <tr>
            <td class="foot" align="center" style="padding:26px 40px 30px;background-color:${FOOTER_BG};border-top:1px solid ${RULE}">
              <p style="margin:0 0 14px;font-size:12px;line-height:1.6;text-align:center">
                <a href="${navigation.manageUrl}" style="display:inline-block;margin:0 7px;font-size:12px;color:${BODY_TEXT};text-decoration:none;font-weight:600">${navigation.manageLabel}</a>
                <span style="color:#c3c0bb">&middot;</span>
                <a href="${baseUrl}/privacy" style="display:inline-block;margin:0 7px;font-size:12px;color:${BODY_TEXT};text-decoration:none;font-weight:600">Privacy</a>
                <span style="color:#c3c0bb">&middot;</span>
                <a href="${baseUrl}/terms" style="display:inline-block;margin:0 7px;font-size:12px;color:${BODY_TEXT};text-decoration:none;font-weight:600">Terms</a>
                ${
                  navigation.showUnsubscribe
                    ? `<span style="color:#c3c0bb">&middot;</span>
                <a href="${unsubscribeUrl}" style="display:inline-block;margin:0 7px;font-size:12px;color:${BODY_TEXT};text-decoration:underline;font-weight:600">Unsubscribe</a>`
                    : ''
                }
              </p>
              <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:${MUTED_TEXT};text-align:center">${footerReason}</p>
              <p style="margin:0;font-size:11px;line-height:1.6;color:#a1a1aa;text-align:center">&copy; ${CURRENT_YEAR} ${BRAND_NAME} &middot; <a href="mailto:${SUPPORT_EMAIL}" style="color:#a1a1aa;text-decoration:none;font-weight:600">${SUPPORT_EMAIL}</a></p>
            </td>
          </tr>

        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;

/** Turn a template's plain-text body into the full text alternative. */
const wrapText = (
  body: string,
  baseUrl: string,
  footerReason = `You are receiving this because of activity on your ${BRAND_NAME} account.`,
  unsubscribeUrl = `${baseUrl}/settings?tab=preferences`
) =>
  `${body.trim()}

—
${BRAND_NAME}
Manage your subscription: ${baseUrl}/settings?tab=subscription
Unsubscribe: ${unsubscribeUrl}
Questions? ${SUPPORT_EMAIL}

${footerReason}
© ${CURRENT_YEAR} ${BRAND_NAME}`;

/* ------------------------------------------------------------------ *
 * Templates
 * ------------------------------------------------------------------ */

export function getInstitutionInvitationTemplate(input: {
  email: string;
  invitationUrl: string;
  kind: 'owner' | 'student';
  institutionName: string;
  expiresAt: string;
}): EmailTemplate {
  const owner = input.kind === 'owner';
  const institution = escapeHtml(input.institutionName);
  const email = escapeHtml(input.email);
  const url = escapeHtml(input.invitationUrl);
  const expiry = new Date(input.expiresAt);
  if (Number.isNaN(expiry.getTime())) throw new Error('Invalid invitation expiry');
  const deadline =
    expiry.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    }) + ' UTC';
  const title = owner ? 'Your institution workspace is ready' : 'Your institution has invited you';
  const intro = owner
    ? `You have been invited to manage ${strong(institution)} on ${BRAND_NAME}.`
    : `${strong(institution)} has invited you to join its IELTS learning programme on ${BRAND_NAME}.`;
  const nextSteps = owner
    ? [
        'Select Accept invitation to open your invitation link.',
        'Sign in with the invited email, or set up your password if this is your first visit.',
        'Accept your invitation to open your institution workspace and manage students.',
      ]
    : [
        'Select Accept invitation to open your invitation link.',
        'Sign in with the invited email, or set up your password if this is your first visit.',
        'Accept your invitation to view your institution access.',
      ];
  const reason =
    'You received this email because an institution invitation was issued for this address.';
  const content = `
${eyebrow(owner ? 'Institution owner invitation' : 'Student invitation')}
${heading(title)}
${lead(intro)}
${notice('info', 'Your invited email', `<span style="word-break:break-all">${email}</span>`)}
${paragraph(owner ? 'Bring your IELTS preparation into one workspace. Review your seat balance, invite students, and follow their institution access.' : 'Accept the invitation to connect your account to your institution. Your available access will be shown after acceptance.')}
${button(url, 'Accept invitation')}
${secondaryLink(`Accept before ${strong(escapeHtml(deadline))}.`)}
<h2 style="margin:28px 0 16px;font-size:16px;font-weight:700;color:${HEADING}">Getting started</h2>
${steps(nextSteps)}
${footnote(`If the button does not work, copy this link into your browser:<br /><a href="${url}" style="color:${ACCENT};word-break:break-all;overflow-wrap:anywhere">${url}</a><br /><br />This invitation is intended for ${strong(email)}. Keep the link private. If you were not expecting it, you can ignore this email. For an expired invitation, ask your institution administrator to send a new one.`)}`;
  return {
    subject: owner
      ? `Your institution invitation | ${BRAND_NAME}`
      : `Your student invitation | ${BRAND_NAME}`,
    html: wrapTemplate(
      content,
      escapeHtml(`Accept your invitation to ${input.institutionName}.`),
      BASE_URL,
      reason,
      '',
      {
        manageUrl: `${BASE_URL}/institution/login`,
        manageLabel: 'Institution sign-in',
        showUnsubscribe: false,
      }
    ),
    text: `${title}\n\n${input.institutionName} has invited you ${owner ? 'to manage its institution workspace' : 'to join its IELTS learning programme'} on ${BRAND_NAME}.\n\nInvited email: ${input.email}\nAccept invitation: ${input.invitationUrl}\nAccept before ${deadline}.\n\nGetting started\n${nextSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}\n\nKeep this invitation link private. If you were not expecting it, you can ignore this email. For an expired invitation, ask your institution administrator to send a new one.\n\nInstitution sign-in: ${BASE_URL}/institution/login\nSupport: ${SUPPORT_EMAIL}\n\n${reason}\n© ${CURRENT_YEAR} ${BRAND_NAME}`,
  };
}

export function getEmailTemplate(type: string, data: any): EmailTemplate {
  const baseUrl = BASE_URL;
  const name = escapeHtml(data?.full_name || 'there');

  let subject = '';
  let preheader = '';
  let html = '';
  let text = '';

  switch (type) {
    case 'welcome':
      subject = `Welcome to ${BRAND_NAME}, ${data?.full_name ? String(data.full_name).split(' ')[0] : 'and good luck'}`;
      preheader = 'Your subscription is active — here is where to start.';
      html = `
${eyebrow('Subscription active')}
${heading(`Welcome, ${name}`)}
${lead('Your practice tools and AI feedback are ready to use.')}
${paragraph(`Everything on your plan is unlocked. If you only do one thing today, complete a single Speaking or Writing task — the feedback is what makes the next session more focused.`)}
${checklist([
  `${strong('Practise Speaking and Writing')} and get structured feedback in minutes`,
  `${strong('Follow your Learning Path')}, built from your goals and recent results`,
  `${strong('Track your progress')} so you know what to work on next`,
])}
${button(`${baseUrl}/dashboard`, 'Start your first practice')}
${secondaryLink(`or ${link(`${baseUrl}/settings?tab=subscription`, 'review your plan details')}`)}
${footnote(`Need a hand getting started? Reply to this email — it reaches a real person.`)}`;
      text = `Welcome, ${data?.full_name || 'there'}

Your ${BRAND_NAME} subscription is active and your practice tools are ready.

If you only do one thing today, complete a single Speaking or Writing task — the feedback is what makes your next session more focused.

What is unlocked:
- Practise Speaking and Writing with structured feedback in minutes
- Follow your Learning Path, built from your goals and recent results
- Track your progress so you know what to work on next

Start your first practice: ${baseUrl}/dashboard

Need a hand getting started? Reply to this email — it reaches a real person.`;
      break;

    case 'renewal_confirmation':
      subject = 'Your IELTS AI Pro subscription has renewed';
      preheader = 'Payment confirmed — your access continues uninterrupted.';
      html = `
${eyebrow('Payment confirmed', '#166534')}
${heading('Your subscription has renewed')}
${lead('Your access continues without interruption.')}
${notice('ok', 'Nothing to do', 'Your subscription is active and your full practice history is intact.')}
${paragraph(`Thank you for continuing with ${BRAND_NAME}, ${name}. Everything on your plan stays available:`)}
${checklist([
  'AI evaluation for Speaking and Writing',
  'Priority processing, so feedback arrives faster',
  'Detailed performance analytics across your sessions',
  'Guidance on the specific criteria holding your band back',
])}
${button(`${baseUrl}/dashboard`, 'Back to your dashboard')}
${footnote(`Invoices, payment method and renewal date all live in your ${link(`${baseUrl}/settings?tab=subscription`, 'subscription settings')}.`)}`;
      text = `Your subscription has renewed

Payment confirmed — your ${BRAND_NAME} access continues without interruption, and your full practice history is intact.

Your plan still includes:
- AI evaluation for Speaking and Writing
- Priority processing, so feedback arrives faster
- Detailed performance analytics across your sessions
- Guidance on the specific criteria holding your band back

Back to your dashboard: ${baseUrl}/dashboard

Invoices, payment method and renewal date: ${baseUrl}/settings?tab=subscription`;
      break;

    case 'payment_failed':
      subject = 'Action needed: update your payment method';
      preheader = "We couldn't process your renewal — your practice history is safe.";
      html = `
${eyebrow('Action required', '#991b1b')}
${heading('We could not process your renewal', '#b91c1c')}
${lead('Your card was declined, so your subscription has not renewed yet.')}
${notice('fault', 'Your work is safe', 'Nothing has been deleted. Your practice history and progress stay exactly where they are while you sort this out.')}
${paragraph('Updating your details takes under a minute:')}
${steps([
  'Open your subscription settings.',
  'Add or select a current payment method.',
  'We retry the charge automatically once the details are saved.',
])}
${button(`${baseUrl}/settings?tab=subscription`, 'Update payment method', '#dc2626')}
${footnote(`If the card looks fine on your side, it is usually the bank declining an international charge. ${link(`mailto:${SUPPORT_EMAIL}`, 'Contact support')} with the email address on your account and we will look into it with you.`)}`;
      text = `We could not process your renewal

Your card was declined, so your ${BRAND_NAME} subscription has not renewed yet.

Your work is safe — nothing has been deleted, and your practice history and progress stay exactly where they are.

To fix it:
1. Open your subscription settings.
2. Add or select a current payment method.
3. We retry the charge automatically once the details are saved.

Update payment method: ${baseUrl}/settings?tab=subscription

If the card looks fine on your side, it is usually the bank declining an international charge. Email ${SUPPORT_EMAIL} with the address on your account and we will look into it with you.`;
      break;

    case 'quota_conversion':
      subject = 'You have one free evaluation left';
      preheader = 'Make it count — or see what a full plan opens up.';
      html = `
${eyebrow('One evaluation remaining')}
${heading('Your last free evaluation is ready')}
${lead(`You have ${strong('1 evaluation')} left in your free quota this month.`)}
${paragraph('Spend it on the task you most want honest feedback on — usually the one you have been avoiding. A single specific correction is worth more than another untimed rehearsal.')}
${button(`${baseUrl}/dashboard`, 'Use your last evaluation')}
${paragraph(`<span style="font-weight:700;color:${HEADING}">If you want more room to practise</span>`, 16)}
${checklist([
  `${strong('A far higher monthly limit')} for Speaking and Writing evaluations`,
  `${strong('An adaptive study path')} that changes as your results change`,
  `${strong('Progress analytics')} that show which criterion is actually costing you marks`,
])}
${secondaryLink(link(`${baseUrl}/pricing`, 'Compare the plans →'))}`;
      text = `Your last free evaluation is ready

You have 1 evaluation left in your free quota this month.

Spend it on the task you most want honest feedback on — usually the one you have been avoiding. A single specific correction is worth more than another untimed rehearsal.

Use your last evaluation: ${baseUrl}/dashboard

If you want more room to practise, a paid plan adds:
- A far higher monthly limit for Speaking and Writing evaluations
- An adaptive study path that changes as your results change
- Progress analytics that show which criterion is actually costing you marks

Compare the plans: ${baseUrl}/pricing`;
      break;

    case 'renewal_reminder': {
      const renewDate = data?.subscription_end_date
        ? new Date(data.subscription_end_date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
          })
        : 'next week';

      // An Exam Pass, a bKash payment or a cancelled subscription is not going
      // to be charged again. Telling those learners "no action needed" means
      // their access quietly lapses a week before they expect it to.
      if (data?.renews === false) {
        subject = 'Your IELTS Ai Pro access ends in 7 days';
        preheader = `Your plan ends on ${renewDate} and will not renew.`;
        html = `
${eyebrow('Heads-up')}
${heading('Your access ends soon')}
${paragraph(`Hi ${name}, your ${BRAND_NAME} plan ends on ${strong(renewDate)}. It was a one-time payment, so nothing will be charged and it will not renew.`)}
${notice('info', 'Your progress stays', 'After that date your account moves to the Free plan. Your practice history, scores and study plan are kept.')}
${paragraph('Still preparing for your exam? You can pick a new plan at any time from the pricing page.')}
${button(`${baseUrl}/pricing`, 'See plans', '#3f3f46')}`;
        text = `Your access ends soon

Hi ${data?.full_name || 'there'}, your ${BRAND_NAME} plan ends on ${renewDate}. It was a one-time payment, so nothing will be charged and it will not renew.

After that date your account moves to the Free plan. Your practice history, scores and study plan are kept.

Still preparing for your exam? Pick a new plan any time: ${baseUrl}/pricing`;
        break;
      }

      subject = 'Your subscription renews in 7 days';
      preheader = `Automatic renewal on ${renewDate}. No action needed.`;
      html = `
${eyebrow('Heads-up')}
${heading('Your subscription renews soon')}
${paragraph(`Hi ${name}, your ${BRAND_NAME} subscription renews automatically on ${strong(renewDate)}.`)}
${notice('info', 'No action needed', 'Your plan, practice history and progress carry straight over. This note is just so the charge is not a surprise.')}
${paragraph('If you would rather change something before then, everything is self-serve: switch billing interval, update your card, or cancel — all from one page.')}
${button(`${baseUrl}/settings?tab=subscription`, 'Manage subscription', '#3f3f46')}
${footnote('Cancelling keeps your access until the end of the period you have already paid for.')}`;
      text = `Your subscription renews soon

Hi ${data?.full_name || 'there'}, your ${BRAND_NAME} subscription renews automatically on ${renewDate}.

No action is needed — your plan, practice history and progress carry straight over. This note is just so the charge is not a surprise.

If you would rather change something first, it is all self-serve: switch billing interval, update your card, or cancel.

Manage subscription: ${baseUrl}/settings?tab=subscription

Cancelling keeps your access until the end of the period you have already paid for.`;
      break;
    }

    case 'trial_expiry': {
      const expiryDate = data?.referral_bonus_expires_at
        ? new Date(data.referral_bonus_expires_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
          })
        : 'very soon';
      subject = 'Your bonus credits expire in 3 days';
      preheader = `Referral bonus evaluations expire on ${expiryDate}.`;
      html = `
${eyebrow('Expiring soon', '#9a3412')}
${heading('Your bonus credits expire soon')}
${lead(`You have ${strong('3 days')} to use your referral bonus evaluations.`)}
${notice('warn', `Expires ${expiryDate}`, 'Unused bonus credits are removed on that date and cannot be restored.')}
${paragraph('One Speaking test or Writing task is enough to put them to work. You will get feedback on:')}
${checklist([
  'Grammatical range and accuracy, with the specific errors marked',
  'Fluency, coherence and task achievement',
  'An estimated band, and what would need to change to move it',
])}
${button(`${baseUrl}/dashboard`, 'Use your credits now', '#d97706')}
${footnote(`After ${expiryDate} you can keep practising on your current plan, or ${link(`${baseUrl}/pricing`, 'look at the paid tiers')} if you want a larger monthly allowance.`)}`;
      text = `Your bonus credits expire soon

You have 3 days to use your referral bonus evaluations. They expire on ${expiryDate}, and unused credits cannot be restored.

One Speaking test or Writing task is enough to put them to work. You will get feedback on:
- Grammatical range and accuracy, with the specific errors marked
- Fluency, coherence and task achievement
- An estimated band, and what would need to change to move it

Use your credits now: ${baseUrl}/dashboard

After ${expiryDate} you can keep practising on your current plan, or look at the paid tiers: ${baseUrl}/pricing`;
      break;
    }

    case 'inactivity_warning':
      subject = 'Ready for your next practice session?';
      preheader = 'Seven days since your last session — a short one still counts.';
      html = `
${eyebrow('Pick up where you left off')}
${heading('It has been a week')}
${lead(`Your last practice session was seven days ago, ${name}.`)}
${paragraph('Preparation slips for ordinary reasons, and the fix is smaller than it feels. You do not need a free evening — you need one task and the feedback that follows it.')}
${checklist([
  `${strong('Start small.')} Five to ten minutes reviewing one skill is a real session.`,
  `${strong('Practise with intent.')} Take one piece of feedback and look for the pattern behind it.`,
  `${strong('Rebuild the habit.')} Two short sessions a week beats one long one a month.`,
])}
${button(`${baseUrl}/dashboard`, 'Resume your practice')}
${footnote(`Not sure where to restart? A ${strong('Speaking test')} takes about 15 minutes and a ${strong('Writing task')} about 20 — pick whichever section you trust least.`)}`;
      text = `It has been a week

Your last practice session was seven days ago.

Preparation slips for ordinary reasons, and the fix is smaller than it feels. You do not need a free evening — you need one task and the feedback that follows it.

- Start small. Five to ten minutes reviewing one skill is a real session.
- Practise with intent. Take one piece of feedback and look for the pattern behind it.
- Rebuild the habit. Two short sessions a week beats one long one a month.

Resume your practice: ${baseUrl}/dashboard

Not sure where to restart? A Speaking test takes about 15 minutes and a Writing task about 20 — pick whichever section you trust least.`;
      break;

    default:
      subject = `A new notification from ${BRAND_NAME}`;
      preheader = 'Sign in to see the details.';
      html = `
${heading(`Hello ${name}`)}
${paragraph(`There is an update waiting on your ${BRAND_NAME} account. Sign in to see the details.`)}
${button(`${baseUrl}/dashboard`, 'Open dashboard')}`;
      text = `Hello ${data?.full_name || 'there'}

There is an update waiting on your ${BRAND_NAME} account.

Open your dashboard: ${baseUrl}/dashboard`;
      break;
  }

  return {
    subject,
    html: wrapTemplate(html, preheader, baseUrl),
    text: wrapText(text, baseUrl),
  };
}

/**
 * Render a marketing campaign into the same shell as every transactional
 * email. The dispatcher used to carry its own single-line copy of the whole
 * document, which is how the two drifted apart — a change to the footer or the
 * button treatment only ever landed on one of them.
 */
export function getCampaignTemplate(input: {
  title: string;
  message: string;
  subject?: string | null;
  objective?: string | null;
  lifecycleStage?: string | null;
  ctaLabel?: string | null;
  recipientName: string;
  clickUrl: string;
  openUrl?: string;
  /**
   * Token-authenticated one-click unsubscribe for this specific delivery.
   * Required for marketing mail: it is both the learner's only working opt-out
   * and the URL used in the List-Unsubscribe header.
   */
  unsubscribeUrl?: string;
  offer?: {
    code: string;
    discountPercent?: number | null;
    expiresAt?: string | null;
    durationHours?: number | null;
    firstPaymentOnly?: boolean;
  } | null;
}): EmailTemplate {
  const expiresAt = input.offer?.expiresAt ? new Date(input.offer.expiresAt).getTime() : null;
  // Never advertise an expired or malformed offer, even if a caller missed validation.
  const offer =
    expiresAt !== null && (!Number.isFinite(expiresAt) || expiresAt <= Date.now())
      ? null
      : input.offer;
  const remainingMinutes =
    expiresAt === null ? null : Math.max(0, Math.floor((expiresAt - Date.now()) / 60_000));
  const countdown =
    remainingMinutes === null
      ? null
      : [
          ...(remainingMinutes > 1440
            ? [{ value: Math.floor(remainingMinutes / 1440), label: 'Days' }]
            : []),
          {
            value: Math.floor(
              (remainingMinutes > 1440 ? remainingMinutes % 1440 : remainingMinutes) / 60
            ),
            label: 'Hours',
          },
          { value: remainingMinutes % 60, label: 'Minutes' },
        ];
  const countdownText = countdown
    ? remainingMinutes === 0
      ? 'Less than 1 minute remaining when sent.'
      : `Time remaining when sent: ${countdown.map(({ value, label }) => `${value} ${label.toLowerCase()}`).join(', ')}.`
    : '';
  const baseUrl = BASE_URL;
  const name = escapeHtml(input.recipientName || 'there');
  const title = escapeHtml(input.title);
  const message = escapeHtml(input.message);
  const ctaLabel = escapeHtml(input.ctaLabel || 'Learn more');
  const stageLabels: Record<string, string> = {
    signup: 'First steps',
    first_result: 'Your next step',
    quota: 'More room to practise',
  };
  const objective = escapeHtml(
    stageLabels[input.lifecycleStage || ''] || (input.objective || 'update').replaceAll('_', ' ')
  );
  const offerWindow = offer?.expiresAt
    ? `Expires ${new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(offer.expiresAt))} UTC.`
    : 'Apply it at checkout when you choose your plan.';
  const lifecycleItems: Record<string, string[]> = {
    signup: [
      'Set your target band and study time in onboarding.',
      'Complete one Writing, Speaking, Reading or Listening task within your Free allowance.',
      'Review the result and choose one thing to work on next.',
    ],
    first_result: [
      'More AI Writing evaluations and Speaking sessions for repeated practice.',
      'An adaptive Learning Path and advanced weakness analytics.',
      'Expanded vocabulary kits and unlimited Reading Assistant requests.',
    ],
    quota: [
      'Choose Pro for a regular feedback routine, or Premium for higher practice capacity.',
      'Compare your regional prices and exact allowances before paying.',
      'Your saved results stay in your account when you upgrade.',
    ],
  };
  const stageItems = lifecycleItems[input.lifecycleStage || ''];
  const progressText =
    offer || stageItems
      ? ''
      : 'Pick up where you left off, review your recent feedback, and choose one thing to work on next.';
  const progressParagraph = stageItems
    ? checklist(stageItems.map((item) => escapeHtml(item)))
    : progressText
      ? paragraph(progressText)
      : '';

  const offerTerms = offer?.firstPaymentOnly
    ? `${offer.discountPercent ? `${offer.discountPercent}% off` : 'Your discount applies to'} the first payment of your subscription. Once per account. Future renewals use the regular plan price.`
    : '';

  // Mirrors the in-app offer strip: a red percent stamp, a red "Limited time"
  // pill and red "Ends in" tiles. Email has no live clock or transforms, so the
  // tiles are a snapshot at send time and the exact deadline is printed below.
  const OFFER_RED = '#c93c34';
  const stampValue = offer?.discountPercent ? `${escapeHtml(offer.discountPercent)}%` : '%';
  const offerTitle = offer?.discountPercent
    ? `Your personal ${escapeHtml(offer.discountPercent)}% offer`
    : 'Your personal offer';
  const offerSubline = offer?.firstPaymentOnly
    ? 'First subscription payment, once per account'
    : 'Applied when you choose your plan';
  const offerBlock = offer
    ? `
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:22px 0 0;border-collapse:separate;background:#fdf5f4;border:1px solid #f1cfcb;border-radius:20px;table-layout:fixed">
  <tr><td style="padding:14px 16px 16px">
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
      <tr>
        <td width="58" valign="middle" style="width:58px">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:${OFFER_RED};border-radius:14px"><tr>
            <td align="center" valign="middle" width="54" height="54" style="width:54px;height:54px;text-align:center;color:#ffffff;line-height:1">
              <span style="display:block;font-size:19px;font-weight:800;letter-spacing:-.03em;color:#ffffff">${stampValue}</span>
              <span style="display:block;margin-top:2px;font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#ffffff">Off</span>
            </td>
          </tr></table>
        </td>
        <td valign="middle" style="padding-left:12px">
          <span style="display:inline-block;padding:2px 8px;background:${OFFER_RED};border-radius:999px;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#ffffff;line-height:1.4">&#9679;&nbsp;Limited time</span>
          <p style="margin:4px 0 0;font-size:17px;font-weight:800;line-height:1.2;letter-spacing:-.01em;color:#262438">${offerTitle}</p>
          <p style="margin:2px 0 0;font-size:12px;line-height:1.4;color:#68657a">${escapeHtml(offerSubline)}</p>
        </td>
      </tr>
    </table>
    ${
      countdown
        ? `
    <p style="margin:12px 0 6px;font-size:12px;font-weight:700;color:${OFFER_RED}">Ends in${remainingMinutes === 0 ? ' less than 1 minute' : ''} <span style="font-weight:500;color:#68657a">· time remaining when sent</span></p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed;border-collapse:separate;border-spacing:0"><tr>${countdown.map(({ value, label }) => `<td align="center" style="padding:7px 4px;background:#ffffff;border:1px solid #efe1df;border-radius:10px;text-align:center"><span style="display:block;font-family:Consolas,Menlo,Monaco,monospace;font-size:21px;font-weight:700;line-height:1.15;color:#262438">${String(value).padStart(2, '0')}</span><span style="display:block;margin-top:1px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#68657a">${label}</span></td>`).join('<td width="6" style="width:6px"></td>')}</tr></table>
    <p style="margin:8px 0 0;font-size:12px;line-height:1.5;color:#68657a">${escapeHtml(offerWindow)}</p>`
        : ''
    }
    <p style="margin:12px 0 5px;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#68657a;text-align:center">Copy the code below</p>
    <p style="margin:0;padding:8px 12px;background:#ffffff;border:1px dashed ${OFFER_RED};border-radius:10px;font-family:Consolas,Menlo,Monaco,'Courier New',monospace;font-size:17px;font-weight:700;letter-spacing:.03em;word-break:break-all;overflow-wrap:anywhere;color:#262438;line-height:1.5;text-align:center">${escapeHtml(offer.code)}</p>
    ${offerTerms ? `<p style="margin:10px 0 0;font-size:12px;line-height:1.5;color:${BODY_TEXT};text-align:center">${escapeHtml(offerTerms)}</p>` : ''}
  </td></tr>
</table>`
    : '';

  const html = `
${eyebrow(objective)}
${heading(title)}
${lead(`Hi ${name},`)}
${paragraph(message)}
${progressParagraph}
${offerBlock}
${button(input.clickUrl, ctaLabel)}
${footnote('Your progress and practice history stay saved in your account, so you can return whenever you are ready.')}`;

  const trackingPixel = input.openUrl
    ? `<img src="${escapeHtml(input.openUrl)}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0" />`
    : '';

  const text = `${input.title}

Hi ${input.recipientName || 'there'},

${input.message}
${stageItems ? stageItems.map((item) => `- ${item}`).join('\n') : progressText}
${
  offer
    ? `
Copy the code below: ${offer.code}${offer.discountPercent ? ` (${offer.discountPercent}% off)` : ''}
${countdownText}
${offerWindow}
${offerTerms}
`
    : ''
}
${input.ctaLabel || 'Learn more'}: ${input.clickUrl}

Your progress and practice history stay saved in your account, so you can return whenever you are ready.`;

  const consentLine =
    'Account tips and offers from IELTS AI Pro. You can unsubscribe from these emails using the link below.';

  return {
    subject: input.subject || input.title,
    html: wrapTemplate(html, input.message, baseUrl, consentLine, input.unsubscribeUrl).replace(
      '</body>',
      `${trackingPixel}</body>`
    ),
    text: wrapText(text, baseUrl, consentLine, input.unsubscribeUrl),
  };
}
