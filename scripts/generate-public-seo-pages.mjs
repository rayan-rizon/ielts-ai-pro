import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const distDirectory = path.join(root, 'dist');
const sourcePage = readFileSync(path.join(distDirectory, 'index.html'), 'utf8');

const publicPages = [
  {
    path: 'ielts-writing-checker',
    title: 'Free IELTS Writing Checker – Task 1 & 2 | IELTS Ai Pro',
    description:
      'Paste your Academic IELTS Task 1 or Task 2 response and instantly receive an estimated band score with detailed feedback on all four writing criteria.',
    canonical: 'https://www.ieltsai.pro/ielts-writing-checker',
    imageAlt: 'Student practising Academic IELTS writing with a laptop and notebook',
    prerender: {
      heading: 'IELTS Free Writing Checker',
      intro:
        'Paste your Academic IELTS Task 1 report or Task 2 essay, then get an estimated band score and detailed feedback across all four writing criteria. Your first three feedback reports are free.',
      sections: [
        {
          heading: 'What the IELTS writing checker reviews',
          items: [
            '<strong>Task Achievement and Task Response:</strong> whether the report covers the key features of the visual, or whether the essay answers every part of the question.',
            '<strong>Coherence and Cohesion:</strong> paragraph logic, progression of ideas, and the linking devices that hold the response together.',
            '<strong>Lexical Resource:</strong> range, precision, collocation, and repetition across the response.',
            '<strong>Grammatical Range and Accuracy:</strong> sentence variety alongside the specific errors that pull a band down.',
          ],
        },
        {
          heading: 'How to check an IELTS essay here',
          ordered: true,
          items: [
            '<strong>Choose Task 1 or Task 2:</strong> Task 1 reports need the original chart, graph, map, or diagram; Task 2 needs the essay question.',
            '<strong>Paste your response:</strong> write to the real word minimum — 150 words for Task 1 and 250 words for Task 2.',
            '<strong>Request feedback:</strong> a report is only used when you ask for an analysis, so drafting costs nothing.',
            '<strong>Rewrite one weakness:</strong> take the single highest-impact correction and rewrite that paragraph before starting a new essay.',
          ],
        },
      ],
      faqs: [
        [
          'Is this an Academic IELTS writing checker?',
          'Yes. This checker is designed only for Academic IELTS Writing Task 1 and Task 2. For Task 1, you add the original chart, graph, map or diagram when requesting analysis.',
        ],
        [
          'Is the IELTS writing checker free?',
          'Yes. Your first three Academic IELTS writing feedback reports are free. A report is only used when you choose to analyse a response.',
        ],
        [
          'What feedback will I receive?',
          'You receive an estimated overall band and criterion-level feedback for Task Achievement or Task Response, Coherence and Cohesion, Lexical Resource, and Grammatical Range and Accuracy, plus strengths and practical next steps.',
        ],
        [
          'Is the estimated band an official IELTS result?',
          'No. It is a practice estimate produced to show where a response is strong and where it loses marks. Official IELTS results are issued only by authorised test providers and trained examiners.',
        ],
      ],
    },
  },
  {
    path: 'ielts-speaking-practice-ai',
    title: 'AI IELTS Speaking Practice with Feedback | IELTS Ai Pro',
    description:
      'Practise IELTS Speaking Parts 1–3 with an AI simulator, estimated band guidance, and focused feedback on fluency, vocabulary, grammar, and pronunciation.',
    canonical: 'https://www.ieltsai.pro/ielts-speaking-practice-ai',
    imageAlt: 'Adult IELTS learner practising a speaking response with a laptop',
    prerender: {
      heading: 'Practise IELTS Speaking with feedback you can act on',
      intro:
        'IELTS Ai Pro simulates Speaking Parts 1–3, records your response, and turns the available speech and transcript evidence into estimated criterion-level feedback. You get a clear next step instead of a single unexplained score.',
      sections: [
        {
          heading: 'What IELTS speaking practice includes',
          items: [
            '<strong>Real speaking flow:</strong> move from short personal questions to a two-minute Part 2 response and deeper Part 3 discussion.',
            '<strong>Criterion-level guidance:</strong> review fluency, vocabulary, grammar, and pronunciation evidence with transparent limitations.',
            '<strong>A useful next drill:</strong> turn the report into one focused action for your next answer instead of repeating the full test blindly.',
          ],
        },
        {
          heading: 'How to practise IELTS Speaking effectively',
          ordered: true,
          items: [
            '<strong>Choose a speaking test:</strong> select a realistic Part 1–3 practice set and prepare your microphone.',
            '<strong>Answer naturally:</strong> speak at normal pace without memorising a script or forcing advanced words.',
            '<strong>Review and repeat:</strong> use the strongest evidence in the report to plan one measurable improvement.',
          ],
        },
      ],
      faqs: [
        [
          'Can AI accurately score IELTS Speaking?',
          'AI can provide useful practice estimates and pattern-based feedback, but it cannot issue an official IELTS result. IELTS Ai Pro labels practice estimates and explains when pronunciation evidence is limited.',
        ],
        [
          'Does the practice cover all three IELTS Speaking parts?',
          'Yes. Practice sets can include short Part 1 questions, a Part 2 cue-card response, and more analytical Part 3 follow-up questions.',
        ],
        [
          'How should I use the feedback?',
          'Choose one priority from the report, practise it in a shorter drill, then record another answer and compare the evidence. Small focused repetitions are more useful than chasing a score after every response.',
        ],
      ],
    },
  },
  {
    path: 'cambridge-ielts-practice-tests',
    title: 'Cambridge IELTS Practice Tests Online | IELTS Ai Pro',
    description:
      'Take Cambridge-style IELTS Reading and Listening practice tests online, review answers, estimate band scores, and track the mistakes that affect your result.',
    canonical: 'https://www.ieltsai.pro/cambridge-ielts-practice-tests',
    imageAlt: 'Adult IELTS learner reviewing a computer-based practice test',
    prerender: {
      heading: 'Cambridge-style IELTS practice with a review loop',
      intro:
        'IELTS Ai Pro gives you timed Reading and Listening practice online in a computer-based workspace, then helps you review question-level mistakes and estimated band progress. Use a full mock test to diagnose; use focused sets to improve.',
      sections: [
        {
          heading: 'What these online IELTS practice tests cover',
          items: [
            '<strong>Reading practice:</strong> work through common IELTS question types in a focused, computer-based test workspace.',
            '<strong>Listening practice:</strong> practise following the question sequence, predicting answer forms, and recovering after a missed answer.',
            '<strong>Review that changes the next test:</strong> use answer evidence and progress analytics to separate knowledge gaps from timing and question-type errors.',
          ],
        },
        {
          heading: 'How to use a mock test properly',
          ordered: true,
          items: [
            '<strong>Take a diagnostic set:</strong> complete one realistic section without pausing or checking answers.',
            '<strong>Classify every error:</strong> label the cause — vocabulary, evidence, spelling, timing, or question technique.',
            '<strong>Repeat a focused drill:</strong> practise the weakest pattern before taking another complete mock test.',
          ],
        },
      ],
      faqs: [
        [
          'Are these official Cambridge IELTS tests?',
          'No. IELTS Ai Pro is an independent preparation platform and is not affiliated with Cambridge, IELTS, IDP, or the British Council. The practice experience is designed around familiar IELTS-style skills and question formats.',
        ],
        [
          'Can I practise IELTS Reading and Listening for free?',
          'A free account provides access to selected practice. Availability and limits can vary by plan, and the app shows the current allowance before you begin.',
        ],
        [
          'Should I take a full mock test every day?',
          'Usually not. Use full tests to measure readiness, then spend more time on short drills that target the exact question types and error causes found in your review.',
        ],
      ],
    },
  },
].map((page) => ({ ...page, image: 'https://www.ieltsai.pro/ielts-hero-student.webp' }));

const SITE_URL = 'https://www.ieltsai.pro';

/*
 * The Vite shell ships the homepage's `#static-prerender-content` fallback. Copying
 * it verbatim onto every generated route made all four public URLs serve the same
 * H1 and the same seventeen marketing blocks to crawlers that do not run JavaScript,
 * which a Seobility crawl flagged as duplicate content and keyword cannibalisation.
 * Each generated page now renders its own fallback, mirroring the copy the React
 * route shows once hydrated.
 */
function renderPrerenderContent(config) {
  const { prerender } = config;
  const sections = prerender.sections
    .map((section) => {
      const listTag = section.ordered ? 'ol' : 'ul';
      const items = section.items.map((item) => `<li>${item}</li>`).join('');
      return `<section><h2>${section.heading}</h2><${listTag}>${items}</${listTag}></section>`;
    })
    .join('');
  const faqs = prerender.faqs
    .map(([question, answer]) => `<dt>${question}</dt><dd>${answer}</dd>`)
    .join('');

  return `<article id="static-prerender-content" class="sr-only">
        <h1>${prerender.heading}</h1>
        <p>${prerender.intro}</p>
        ${sections}
        <section><h2>${config.title.replace(' | IELTS Ai Pro', '')} FAQ</h2><dl>${faqs}</dl></section>
        <nav aria-label="Static Site Directory">
          <a href="/">Free AI IELTS Practice &amp; Mock Tests</a>
          ${publicPages
            .filter((page) => page.canonical !== config.canonical)
            .map(
              (page) => `<a href="/${page.path}">${page.title.replace(' | IELTS Ai Pro', '')}</a>`
            )
            .join('\n          ')}
          <a href="/ielts-band-score-calculator">IELTS Band Score Calculator</a>
          <a href="/blog">IELTS Preparation Blog</a>
          <a href="/about">About Us</a>
          <a href="/contact">Contact Us</a>
        </nav>
      </article>`;
}

function replaceTag(html, expression, replacement, label) {
  if (!expression.test(html)) throw new Error(`Could not find ${label} in the Vite output.`);
  return html.replace(expression, replacement);
}

function renderPublicPage(html, config) {
  const shortTitle = config.title.replace(' | IELTS Ai Pro', '');
  const pageSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${config.canonical}#webpage`,
        url: config.canonical,
        name: config.title,
        description: config.description,
        inLanguage: 'en',
        isPartOf: { '@id': `${SITE_URL}/#website` },
        primaryImageOfPage: { '@type': 'ImageObject', url: config.image },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${config.canonical}#app`,
        name: shortTitle,
        url: config.canonical,
        description: config.description,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web',
        publisher: { '@id': `${SITE_URL}/#organization` },
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
      {
        '@type': 'FAQPage',
        '@id': `${config.canonical}#faq`,
        mainEntity: config.prerender.faqs.map(([question, answer]) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: { '@type': 'Answer', text: answer },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${config.canonical}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: shortTitle, item: config.canonical },
        ],
      },
    ],
  });

  let page = replaceTag(html, /<title>[^<]*<\/title>/, `<title>${config.title}</title>`, 'title');
  page = replaceTag(
    page,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
    `<meta name="description" content="${config.description}" />`,
    'description meta tag'
  );
  page = replaceTag(
    page,
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/,
    `<link rel="canonical" href="${config.canonical}" />`,
    'canonical link'
  );
  page = replaceTag(
    page,
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:title" content="${config.title}" />`,
    'Open Graph title'
  );
  page = replaceTag(
    page,
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:description" content="${config.description}" />`,
    'Open Graph description'
  );
  page = replaceTag(
    page,
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:url" content="${config.canonical}" />`,
    'Open Graph URL'
  );
  page = replaceTag(
    page,
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:image" content="${config.image}" />`,
    'Open Graph image'
  );
  page = replaceTag(
    page,
    /<meta\s+property="og:image:alt"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:image:alt" content="${config.imageAlt}" />`,
    'Open Graph image alt text'
  );
  page = replaceTag(
    page,
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/,
    `<meta name="twitter:title" content="${config.title}" />`,
    'Twitter title'
  );
  page = replaceTag(
    page,
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/,
    `<meta name="twitter:description" content="${config.description}" />`,
    'Twitter description'
  );
  page = replaceTag(
    page,
    /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/>/,
    `<meta name="twitter:image" content="${config.image}" />`,
    'Twitter image'
  );
  page = replaceTag(
    page,
    /<script\s+data-static-seo\s+type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script data-static-seo type="application/ld+json">${pageSchema}</script>`,
    'static structured data'
  );
  return replaceTag(
    page,
    /<article\s+id="static-prerender-content"[\s\S]*?<\/article>/,
    renderPrerenderContent(config),
    'static prerender content'
  );
}

for (const page of publicPages) {
  const outputDirectory = path.join(distDirectory, page.path);
  mkdirSync(outputDirectory, { recursive: true });
  writeFileSync(path.join(outputDirectory, 'index.html'), renderPublicPage(sourcePage, page));
}
