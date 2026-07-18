import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const siteUrl = 'https://www.ieltsai.pro';
const publicDir = path.resolve(process.cwd(), 'public');
const updated = '2026-06-19';

const navLinks = [
  ['IELTS Writing Checker', '/ielts-writing-checker'],
  ['IELTS Speaking Practice', '/ielts-speaking-practice-ai'],
  ['IELTS Mock Test', '/ielts-mock-test-online'],
  ['AI IELTS Prep', '/ai-ielts-preparation'],
];

const keywordPages = [
  {
    slug: 'ielts-writing-checker',
    title: 'IELTS Writing Checker With AI Score',
    description:
      'Check IELTS Writing Task 1 and Task 2 essays with AI feedback, estimated band scores, grammar fixes, vocabulary advice, and official IELTS criteria.',
    keyword: 'IELTS writing checker',
    h1: 'IELTS Writing Checker With Instant AI Feedback',
    intro:
      'Improve Task 1 reports and Task 2 essays with instant IELTS writing feedback mapped to task response, coherence and cohesion, lexical resource, and grammar range.',
    bullets: [
      'Estimated band score for IELTS Writing Task 1 and Task 2',
      'Criterion-level feedback based on official IELTS band descriptors',
      'Grammar, vocabulary, structure, and idea development suggestions',
      'Progress tracking for students targeting Band 7, 7.5, or 8+',
    ],
    sections: [
      [
        'Why IELTS writing feedback matters',
        'Writing is one of the hardest IELTS skills to improve alone because students often repeat the same grammar, cohesion, and task-response mistakes. IELTS Ai Pro gives fast feedback after each essay so learners can revise before bad habits become permanent.',
      ],
      [
        'Task 1 and Task 2 support',
        'Practice Academic Task 1 reports, General Training letters, and Task 2 essays. The platform highlights weak paragraphs, unclear claims, limited vocabulary, and grammar issues that affect band score.',
      ],
    ],
    faqs: [
      [
        'Can AI check IELTS writing?',
        'Yes. IELTS Ai Pro uses AI to give fast writing feedback, estimated band scores, and improvement suggestions. Treat scores as practice guidance, not an official IELTS result.',
      ],
      [
        'Does it support Task 1 and Task 2?',
        'Yes. You can practice Task 1 reports or letters and Task 2 essays with feedback for each IELTS writing criterion.',
      ],
      [
        'Is this useful for Band 7 preparation?',
        'Yes. Feedback focuses on clarity, cohesion, vocabulary range, grammar control, and task achievement, which are common blockers for Band 7+.',
      ],
    ],
  },
  {
    slug: 'ielts-speaking-practice-ai',
    title: 'IELTS Speaking Practice With AI Feedback',
    description:
      'Practice IELTS Speaking online with AI feedback for fluency, pronunciation, vocabulary, grammar, and estimated speaking band score.',
    keyword: 'IELTS speaking practice AI',
    h1: 'IELTS Speaking Practice With AI Examiner Feedback',
    intro:
      'Train for IELTS Speaking Parts 1, 2, and 3 with AI-powered practice that helps you speak longer, organize ideas, and understand what affects your band score.',
    bullets: [
      'Speaking practice for IELTS Part 1, Part 2, and Part 3',
      'Feedback on fluency, pronunciation, vocabulary, and grammar',
      'Band score estimates for practice sessions',
      'Personalized tips for more natural, confident answers',
    ],
    sections: [
      [
        'Practice when no speaking partner is available',
        'Many IELTS learners struggle to find consistent speaking practice. IELTS Ai Pro gives repeatable speaking drills, instant review, and focused corrections so daily practice becomes easier.',
      ],
      [
        'Prepare for real examiner criteria',
        'Speaking feedback is organized around fluency and coherence, lexical resource, grammatical range and accuracy, and pronunciation so learners can connect practice with IELTS scoring criteria.',
      ],
    ],
    faqs: [
      [
        'Can AI score IELTS Speaking?',
        'AI can estimate speaking performance for practice and show likely weak areas. Official IELTS scores only come from certified IELTS examiners.',
      ],
      [
        'Which speaking parts can I practice?',
        'IELTS Ai Pro supports practice for common IELTS Speaking Part 1, Part 2 cue card, and Part 3 discussion-style answers.',
      ],
      [
        'How does speaking feedback help?',
        'It shows patterns in fluency, vocabulary, grammar, pronunciation, answer length, and idea organization so you know what to fix next.',
      ],
    ],
  },
  {
    slug: 'ielts-mock-test-online',
    title: 'IELTS Mock Test Online With Analytics',
    description:
      'Take realistic IELTS mock tests online for Reading, Listening, Writing, and Speaking with timers, analytics, and AI feedback.',
    keyword: 'IELTS mock test online',
    h1: 'IELTS Mock Test Online for Real Exam Practice',
    intro:
      'Build test-day speed and confidence with IELTS mock tests that mirror online exam timing, question flow, and score-focused review.',
    bullets: [
      'Timed Reading and Listening practice',
      'Writing and Speaking feedback with estimated bands',
      'Skill analytics after each practice session',
      'Study recommendations based on weak areas',
    ],
    sections: [
      [
        'Realistic practice builds exam stamina',
        'Full-length IELTS practice helps students manage time pressure, reduce careless mistakes, and understand which section needs more work before exam day.',
      ],
      [
        'Analytics after every attempt',
        'Instead of guessing what to study next, learners can review performance by skill and target the question types or band descriptors causing score loss.',
      ],
    ],
    faqs: [
      [
        'What is an IELTS mock test?',
        'An IELTS mock test is a practice exam that simulates real IELTS timing, sections, and task types so you can estimate readiness before test day.',
      ],
      [
        'Can I practice all four skills?',
        'Yes. IELTS Ai Pro covers Reading, Listening, Writing, and Speaking practice in one platform.',
      ],
      [
        'Do mock tests improve IELTS scores?',
        'They help when paired with review. Mock tests reveal timing issues, weak skills, and repeated mistakes that targeted practice can fix.',
      ],
    ],
  },
  {
    slug: 'cambridge-ielts-practice-tests',
    title: 'Cambridge IELTS Practice Tests Online',
    description:
      'Practice Cambridge-style IELTS Reading and Listening tests online with realistic timing, answer review, and progress tracking.',
    keyword: 'Cambridge IELTS practice tests',
    h1: 'Cambridge IELTS Practice Tests Online',
    intro:
      'Use Cambridge-style IELTS practice tests to prepare for Academic and General Training exam formats with realistic reading and listening tasks.',
    bullets: [
      'Reading and Listening practice modeled on IELTS test formats',
      'Computer-based test interface with accurate timers',
      'Answer review and progress tracking',
      'Free practice options for core IELTS skills',
    ],
    sections: [
      [
        'Why Cambridge-style practice works',
        'Students need repeated exposure to IELTS passage length, audio pacing, and question types. Cambridge-style practice builds familiarity with matching, gap fill, multiple choice, and short answer tasks.',
      ],
      [
        'Train with review, not repetition only',
        'Reviewing wrong answers is where score gains happen. IELTS Ai Pro helps learners understand patterns in mistakes and choose next practice based on performance.',
      ],
    ],
    faqs: [
      [
        'Are these official Cambridge tests?',
        'IELTS Ai Pro provides Cambridge-style practice materials and imported practice content where available. It is not affiliated with Cambridge, IDP, or British Council.',
      ],
      [
        'Can I practice Listening online?',
        'Yes. Listening practice includes audio-based tasks, timing, and answer review.',
      ],
      [
        'Can I practice Reading online?',
        'Yes. Reading practice includes academic-style passages, common IELTS question types, and timed sessions.',
      ],
    ],
  },
  {
    slug: 'free-ielts-practice-tests',
    title: 'Free IELTS Practice Tests Online',
    description:
      'Start free IELTS practice tests online for Reading and Listening, then upgrade for AI Writing and Speaking feedback when ready.',
    keyword: 'free IELTS practice tests',
    h1: 'Free IELTS Practice Tests Online',
    intro:
      'Begin IELTS preparation with free online practice for core skills, then add AI feedback for Writing and Speaking when you need deeper scoring guidance.',
    bullets: [
      'Free IELTS Reading practice',
      'Free IELTS Listening practice',
      'Realistic online test interface',
      'Optional AI feedback for Writing and Speaking',
    ],
    sections: [
      [
        'Start with free practice',
        'Free practice helps learners understand current level, test timing, and common question types before paying for advanced coaching or exam registration.',
      ],
      [
        'Move from practice to score improvement',
        'Once you know weak areas, targeted feedback and analytics help you improve faster than random practice. IELTS Ai Pro connects practice results with next steps.',
      ],
    ],
    faqs: [
      [
        'Are IELTS practice tests free?',
        'IELTS Ai Pro offers free Reading and Listening practice options. Advanced AI feedback may require a paid plan.',
      ],
      [
        'Do I need an account?',
        'An account helps save progress, track analytics, and access personalized recommendations.',
      ],
      [
        'What should I practice first?',
        'Start with a timed Reading or Listening test, then use results to decide whether Writing, Speaking, vocabulary, or time management needs focus.',
      ],
    ],
  },
  {
    slug: 'ai-ielts-preparation',
    title: 'AI IELTS Preparation App for Band 7+',
    description:
      'Use IELTS Ai Pro as your AI IELTS preparation app for mock tests, writing feedback, speaking practice, band analytics, and daily study planning.',
    keyword: 'AI IELTS preparation',
    h1: 'AI IELTS Preparation for Band 7+ Goals',
    intro:
      'IELTS Ai Pro combines mock tests, instant feedback, analytics, and adaptive planning so learners can prepare for IELTS with a clear daily roadmap.',
    bullets: [
      'AI feedback for IELTS Writing and Speaking',
      'Mock tests for Reading and Listening',
      'Band score analytics and weak-skill tracking',
      'Personalized study recommendations',
    ],
    sections: [
      [
        'One platform for all four IELTS skills',
        'Switching between tools slows preparation. IELTS Ai Pro brings Reading, Listening, Writing, Speaking, analytics, and planning into one focused IELTS study workflow.',
      ],
      [
        'Study plan based on performance',
        'The platform helps learners focus on the skills most likely to lift band score, instead of spending equal time on areas that are already strong.',
      ],
    ],
    faqs: [
      [
        'Is IELTS Ai Pro an AI IELTS app?',
        'Yes. It is a web-based AI IELTS preparation platform for practice, feedback, analytics, and study planning.',
      ],
      [
        'Can it help me reach Band 7?',
        'It can help identify and practice the skills needed for Band 7, especially Writing and Speaking weaknesses. Score improvement also depends on consistency and starting level.',
      ],
      [
        'Does it replace a teacher?',
        'No tool fully replaces expert human instruction, but AI feedback can support daily practice between lessons or when a teacher is unavailable.',
      ],
    ],
  },
  {
    slug: 'ielts-band-score-feedback',
    title: 'IELTS Band Score Feedback Online',
    description:
      'Get IELTS band score feedback with AI analysis for Writing and Speaking, plus analytics that show what to improve next.',
    keyword: 'IELTS band score feedback',
    h1: 'IELTS Band Score Feedback With Clear Next Steps',
    intro:
      'Understand why your IELTS score is stuck and what to fix next with band score estimates, rubric-based feedback, and skill-level analytics.',
    bullets: [
      'Estimated IELTS band scores for practice tasks',
      'Feedback tied to IELTS criteria',
      'Skill gap analytics across modules',
      'Actionable recommendations after each session',
    ],
    sections: [
      [
        'Feedback must be specific',
        'A band number alone does not teach you what to change. IELTS Ai Pro explains score drivers so learners can revise essays, improve answers, and track measurable progress.',
      ],
      [
        'Find score blockers faster',
        'Common blockers include weak cohesion, limited vocabulary range, short speaking answers, grammar control, and poor timing. Analytics make these patterns easier to see.',
      ],
    ],
    faqs: [
      [
        'What is IELTS band score feedback?',
        'It is feedback that estimates performance against IELTS band descriptors and explains what caused the score.',
      ],
      [
        'Is AI band feedback official?',
        'No. AI feedback is for practice. Official results only come from IELTS test providers.',
      ],
      [
        'How often should I check my score?',
        'Check after meaningful practice sessions, then revise based on feedback before submitting another attempt.',
      ],
    ],
  },
];

const utilityPages = [
  {
    slug: 'about',
    title: 'About AI IELTS Coaching',
    description:
      'Learn how IELTS Ai Pro helps students prepare for IELTS with AI writing feedback, speaking practice, mock tests, and band score analytics.',
    keyword: 'about IELTS Ai Pro',
    h1: 'About IELTS Ai Pro',
    intro:
      'IELTS Ai Pro helps learners prepare for IELTS with practical AI feedback, realistic mock tests, and analytics focused on measurable score improvement.',
    bullets: [
      'AI-powered writing and speaking feedback',
      'Reading and listening practice tests',
      'Band score analytics and study planning',
      'Built for Academic and General Training learners',
    ],
    sections: [
      [
        'Our mission',
        'Make high-quality IELTS preparation more accessible, faster, and easier to practice consistently from anywhere.',
      ],
      [
        'Our approach',
        'Combine IELTS scoring criteria, exam-style practice, and modern AI feedback so learners get clearer next steps after every session.',
      ],
    ],
    faqs: [
      [
        'Who is IELTS Ai Pro for?',
        'IELTS Ai Pro is for IELTS candidates preparing for study, work, immigration, or professional goals.',
      ],
      [
        'Is IELTS Ai Pro affiliated with IELTS?',
        'No. IELTS Ai Pro is an independent preparation platform and is not affiliated with IELTS, IDP, British Council, or Cambridge.',
      ],
    ],
  },
  {
    slug: 'contact',
    title: 'Contact Support',
    description:
      'Contact IELTS Ai Pro for account help, IELTS preparation support, pricing questions, technical issues, and product feedback.',
    keyword: 'IELTS Ai Pro support',
    h1: 'Contact IELTS Ai Pro',
    intro:
      'Need help with IELTS Ai Pro? Contact support for account questions, technical issues, subscriptions, or preparation guidance.',
    bullets: [
      'Email support: mail@ieltsai.pro',
      'Help with accounts and billing',
      'Support for IELTS practice tools',
      'Feedback and partnership inquiries',
    ],
    sections: [
      [
        'Support scope',
        'We help with platform access, AI feedback questions, billing, technical issues, and general product guidance.',
      ],
      [
        'Response time',
        'Most support requests are reviewed as quickly as possible. Include your account email and clear issue details.',
      ],
    ],
    faqs: [
      [
        'How do I contact IELTS Ai Pro?',
        'Email mail@ieltsai.pro with your question and account email if relevant.',
      ],
      [
        'Can support give official IELTS advice?',
        'Support can help with platform usage, but official IELTS exam rules should be confirmed with IELTS test providers.',
      ],
    ],
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    description:
      'Read how IELTS Ai Pro handles account data, practice results, AI feedback data, payments, cookies, and privacy rights.',
    keyword: 'IELTS Ai Pro privacy policy',
    h1: 'Privacy Policy',
    intro:
      'IELTS Ai Pro protects learner data and explains how account, practice, payment, analytics, and support information may be used.',
    bullets: [
      'Practice data powers feedback and analytics',
      'Payment data is handled by payment providers',
      'Users can contact support about privacy rights',
      'Security controls protect account access',
    ],
    sections: [
      [
        'Data we process',
        'We may process account details, practice submissions, feedback results, subscription data, support messages, and basic analytics.',
      ],
      ['Contact', 'For privacy questions, contact mail@ieltsai.pro.'],
    ],
    faqs: [
      [
        'Does IELTS Ai Pro sell personal data?',
        'No. IELTS Ai Pro does not sell personal information.',
      ],
      [
        'How can I ask about my data?',
        'Contact mail@ieltsai.pro with your account email and request details.',
      ],
    ],
  },
  {
    slug: 'terms',
    title: 'Terms of Service',
    description:
      'Review IELTS Ai Pro terms for using IELTS practice tools, AI feedback, subscriptions, acceptable use, and limitations.',
    keyword: 'IELTS Ai Pro terms',
    h1: 'Terms of Service',
    intro:
      'These terms explain acceptable use of IELTS Ai Pro, subscriptions, AI feedback limits, and platform responsibilities.',
    bullets: [
      'Use IELTS Ai Pro for lawful IELTS preparation',
      'AI scores are practice estimates, not official IELTS results',
      'Subscriptions follow plan limits shown at purchase',
      'Contact support for billing or account issues',
    ],
    sections: [
      [
        'Practice guidance',
        'AI feedback and band estimates are educational tools. Official IELTS scores are issued only by authorized IELTS test providers.',
      ],
      ['Contact', 'Questions about these terms can be sent to mail@ieltsai.pro.'],
    ],
    faqs: [
      ['Are AI scores official?', 'No. AI scores are estimates for practice only.'],
      [
        'Where can I ask billing questions?',
        'Contact mail@ieltsai.pro with your account email and billing question.',
      ],
    ],
  },
];

const allStaticPages = [...keywordPages, ...utilityPages];

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function jsonLd(data) {
  return JSON.stringify(data).replaceAll('</script', '<\\/script');
}

function pageUrl(slug) {
  return `${siteUrl}/${slug}`;
}

const PAGE_CSS = `
    :root{color-scheme:light;--ink:#111827;--muted:#4b5563;--line:#e5e7eb;--brand:#4f46e5;--soft:#eef2ff;--bg:#f8fafc}
    *{box-sizing:border-box}
    body{margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--ink);background:var(--bg);line-height:1.65}
    a{color:inherit}
    .skip{position:absolute;left:-999px;top:12px;background:#fff;padding:10px 14px;border:1px solid var(--line);border-radius:8px;z-index:10}
    .skip:focus{left:12px}
    header{background:#fff;border-bottom:1px solid var(--line)}
    nav{max-width:1120px;margin:0 auto;padding:18px 20px;display:flex;gap:18px;align-items:center;justify-content:space-between;flex-wrap:wrap}
    .brand{font-weight:900;text-decoration:none;font-size:20px}
    .links{display:flex;gap:14px;flex-wrap:wrap;color:var(--muted);font-size:14px}
    .links a{text-decoration:none}
    main{max-width:1120px;margin:0 auto;padding:48px 20px}
    .hero{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(280px,.8fr);gap:32px;align-items:center}
    .eyebrow{display:inline-flex;padding:6px 10px;border-radius:999px;background:var(--soft);color:var(--brand);font-weight:800;font-size:13px}
    h1{font-size:clamp(34px,6vw,68px);line-height:.98;margin:18px 0 18px;letter-spacing:0}
    h2{font-size:clamp(24px,3vw,34px);line-height:1.15;margin:0 0 14px;letter-spacing:0}
    p{margin:0 0 16px;color:var(--muted);font-size:17px}
    .cta{display:flex;gap:12px;flex-wrap:wrap;margin-top:24px}
    .btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:800}
    .btn.primary{background:var(--brand);color:#fff}
    .btn.secondary{background:#fff;color:var(--ink);border:1px solid var(--line)}
    .panel{background:#fff;border:1px solid var(--line);border-radius:8px;padding:24px}
    .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-top:32px}
    ul{margin:0;padding-left:20px;color:var(--muted)}
    li{margin:8px 0}
    section{margin-top:48px}
    .faq{display:grid;gap:12px}
    details{background:#fff;border:1px solid var(--line);border-radius:8px;padding:16px}
    summary{cursor:pointer;font-weight:800}
    footer{max-width:1120px;margin:0 auto;padding:32px 20px;border-top:1px solid var(--line);color:var(--muted);font-size:14px}
    @media (max-width:760px){.hero,.grid{grid-template-columns:1fr}main{padding-top:32px}nav{align-items:flex-start}.links{display:grid;grid-template-columns:1fr 1fr;width:100%}}
`;

function buildSchemas(page) {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faqs.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  };

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'IELTS Ai Pro',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    url: siteUrl,
    description:
      'AI IELTS preparation platform with writing feedback, speaking practice, mock tests, analytics, and study planning.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: page.h1,
        item: pageUrl(page.slug),
      },
    ],
  };

  return { faqSchema, softwareSchema, breadcrumbSchema };
}

function renderPage(page) {
  const { faqSchema, softwareSchema, breadcrumbSchema } = buildSchemas(page);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(page.title)} | IELTS Ai Pro</title>
  <meta name="description" content="${escapeHtml(page.description)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="author" content="IELTS Ai Pro">
  <link rel="canonical" href="${pageUrl(page.slug)}">
  <link rel="icon" type="image/webp" href="/favicon.webp">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <meta property="og:title" content="${escapeHtml(page.title)} | IELTS Ai Pro">
  <meta property="og:description" content="${escapeHtml(page.description)}">
  <meta property="og:url" content="${pageUrl(page.slug)}">
  <meta property="og:site_name" content="IELTS Ai Pro">
  <meta property="og:type" content="article">
  <meta property="og:image" content="${siteUrl}/og-image.webp">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(page.title)} | IELTS Ai Pro">
  <meta name="twitter:description" content="${escapeHtml(page.description)}">
  <meta name="twitter:image" content="${siteUrl}/og-image.webp">
  <script type="application/ld+json">${jsonLd(softwareSchema)}</script>
  <script type="application/ld+json">${jsonLd(faqSchema)}</script>
  <script type="application/ld+json">${jsonLd(breadcrumbSchema)}</script>
  <style>${PAGE_CSS}</style>
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  <header>
    <nav aria-label="Primary">
      <a class="brand" href="/">IELTS Ai Pro</a>
      <div class="links">
        ${navLinks.map(([label, href]) => `<a href="${href}">${escapeHtml(label)}</a>`).join('')}
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
      </div>
    </nav>
  </header>
  <main id="main">
    <section class="hero">
      <div>
        <span class="eyebrow">${escapeHtml(page.keyword)}</span>
        <h1>${escapeHtml(page.h1)}</h1>
        <p>${escapeHtml(page.intro)}</p>
        <div class="cta">
          <a class="btn primary" href="/signup">Start Free IELTS Practice</a>
          <a class="btn secondary" href="/">Open IELTS Ai Pro</a>
        </div>
      </div>
      <aside class="panel" aria-label="Key benefits">
        <h2>What You Get</h2>
        <ul>
          ${page.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
        </ul>
      </aside>
    </section>
    <div class="grid">
      ${page.sections
        .map(
          ([heading, body]) => `<section class="panel">
        <h2>${escapeHtml(heading)}</h2>
        <p>${escapeHtml(body)}</p>
      </section>`
        )
        .join('')}
    </div>
    <section class="panel">
      <h2>How to use IELTS Ai Pro effectively</h2>
      <p>Start with one timed practice activity and review the result before moving to another task. Reading and Listening attempts show answer-level performance. Writing and Speaking activities can add estimated AI feedback when your plan includes an available evaluation. Save each attempt so the analytics dashboard can show patterns across skills instead of treating one result as your final level.</p>
      <p>Use the feedback to choose one specific change for the next session: improve timing, revise an essay paragraph, expand a speaking answer, review unfamiliar vocabulary, or repeat a weak question type. Focused repetition makes the practice history more useful and helps you avoid random study.</p>
    </section>
    <section class="panel">
      <h2>Understand practice estimates</h2>
      <p>AI-assisted bands and comments are preparation guidance, not official IELTS results. They are designed to organize feedback around relevant criteria and help you identify possible weaknesses. Always use official IELTS sources for current test rules, score requirements, and booking information. Official scores are issued only by authorized test providers after the real examination.</p>
    </section>
    <section>
      <h2>IELTS Preparation FAQ</h2>
      <div class="faq">
        ${page.faqs
          .map(
            ([question, answer]) => `<details>
          <summary>${escapeHtml(question)}</summary>
          <p>${escapeHtml(answer)}</p>
        </details>`
          )
          .join('')}
      </div>
    </section>
  </main>
  <footer>
    <p>IELTS Ai Pro is an independent IELTS preparation platform and is not affiliated with IELTS, IDP, British Council, or Cambridge. AI scores are practice estimates.</p>
    <p><a href="/privacy">Privacy Policy</a> · <a href="/terms">Terms of Service</a> · <a href="/contact">Contact</a></p>
    <p>Updated ${updated}. © 2026 IELTS Ai Pro.</p>
  </footer>
</body>
</html>
`;
}

function renderSitemap() {
  const urls = [
    { loc: `${siteUrl}/`, priority: '1.0', changefreq: 'weekly' },
    ...allStaticPages.map((page) => ({
      loc: pageUrl(page.slug),
      priority: keywordPages.includes(page) ? '0.9' : '0.6',
      changefreq: keywordPages.includes(page) ? 'weekly' : 'monthly',
    })),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${updated}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;
}

function renderRobots() {
  return `# IELTS Ai Pro - robots.txt
# Last updated: ${updated}

User-agent: *
Allow: /

# Public SEO pages
Allow: /ielts-writing-checker
Allow: /ielts-speaking-practice-ai
Allow: /ielts-mock-test-online
Allow: /cambridge-ielts-practice-tests
Allow: /free-ielts-practice-tests
Allow: /ai-ielts-preparation
Allow: /ielts-band-score-feedback

# Private/authenticated routes
Disallow: /dashboard/
Disallow: /admin/
Disallow: /onboarding/
Disallow: /settings
Disallow: /analytics
Disallow: /learning-path
Disallow: /leaderboard

# Auth flows
Disallow: /login
Disallow: /signup
Disallow: /forgot-password
Disallow: /update-password

# Protected app pages
Disallow: /pricing
Disallow: /resources

# API and function routes
Disallow: /api/
Disallow: /functions/

Sitemap: ${siteUrl}/sitemap.xml

# AI Training Signal (standard-compliant comment)
# Content-Signal: search=yes,ai-train=no
`;
}

await Promise.all(
  allStaticPages.map(async (page) => {
    const dir = path.join(publicDir, page.slug);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'index.html'), renderPage(page), 'utf8');
  })
);

await writeFile(path.join(publicDir, 'sitemap.xml'), renderSitemap(), 'utf8');
await writeFile(path.join(publicDir, 'robots.txt'), renderRobots(), 'utf8');

console.log(`Generated ${allStaticPages.length} static SEO pages and sitemap.xml`);
