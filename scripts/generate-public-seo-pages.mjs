import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import {
  SEO_LANDING_CONTENT,
  toPrerenderConfig,
} from '../src/features/core/components/seo-landing/seoLandingContent.js';

const root = process.cwd();
const distDirectory = path.join(root, 'dist');
const sourcePage = readFileSync(path.join(distDirectory, 'index.html'), 'utf8');

/*
 * The two search-landing routes share their copy with the React page that renders
 * them (src/features/core/components/seo-landing/seoLandingContent.js). Keeping a
 * second hand-written copy here is how the static FAQPage JSON-LD ended up
 * advertising questions the hydrated page no longer showed.
 */
function seoLandingPage(content) {
  return {
    path: content.path.replace(/^\//, ''),
    title: `${content.title} | IELTS Ai Pro`,
    description: content.description,
    keywords: content.keywords,
    canonical: `https://www.ieltsai.pro${content.path}`,
    imageAlt: content.heroAlt,
    primaryCta: content.primaryCta,
    primaryHref: content.primaryHref,
    secondaryCta: content.secondaryCta,
    secondaryHref: content.secondaryHref,
    prerender: toPrerenderConfig(content),
  };
}

const publicPages = [
  {
    path: 'ielts-writing-checker',
    title: 'IELTS Writing Checker: Task 1 & 2 | IELTS Ai Pro',
    description:
      'Paste your Academic IELTS Task 1 or Task 2 response and instantly receive an estimated band score with detailed feedback on all four writing criteria.',
    keywords:
      'IELTS writing checker, free IELTS writing checker, online IELTS writing feedback, AI IELTS writing checker, check IELTS writing online, IELTS Task 1 checker, IELTS Task 2 checker',
    canonical: 'https://www.ieltsai.pro/ielts-writing-checker',
    imageAlt: 'Student practising Academic IELTS writing with a laptop and notebook',
    prerender: {
      heading: 'Free IELTS Writing Checker for Task 1 & Task 2',
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
    primaryCta: 'Check my IELTS writing',
    primaryHref: '#checker',
    secondaryCta: 'Read the IELTS Writing Task 1 maps guide',
    secondaryHref: '/blog/ielts-writing-task-1-maps',
  },
  seoLandingPage(SEO_LANDING_CONTENT.speaking),
  seoLandingPage(SEO_LANDING_CONTENT.practice),
  /*
   * The five routes below are plain SPA routes: vercel.json used to rewrite them
   * straight to the untouched Vite shell, so crawlers that do not run JavaScript
   * received the homepage's title, description and - worst of all - the homepage's
   * <link rel="canonical">. A Semrush crawl saw all five as "canonical to another
   * page" and counted them as the five sitemap errors, because a sitemap must not
   * list URLs that disown themselves. React sets the right tags on hydration; these
   * static heads make the raw HTML agree with it.
   */
  {
    path: 'about',
    title: 'About IELTS Ai Pro - AI-Powered IELTS Preparation Platform',
    description:
      'Get instant, examiner-grade AI feedback for IELTS Writing Task 1 & 2, Speaking Parts 1-3, Reading, and Listening. Achieve Band 7.5+ faster.',
    canonical: 'https://www.ieltsai.pro/about',
    imageAlt: 'IELTS learners preparing with the IELTS Ai Pro platform',
    schemaType: 'AboutPage',
    prerender: {
      heading: 'About IELTS Ai Pro',
      intro:
        'IELTS Ai Pro is an independent preparation platform built around one idea: a band estimate is only useful when it tells you what to practise next. We combine Reading, Listening, Writing, and Speaking practice with criterion-level feedback and progress tracking in a single workspace.',
      sections: [
        {
          heading: 'What we build',
          items: [
            '<strong>Practice, not guesswork:</strong> timed Reading and Listening question sets, Academic Writing Task 1 and Task 2 evaluation, and Speaking Parts 1 to 3 simulation, with every piece of feedback tied back to the four assessment criteria examiners actually use.',
            '<strong>Feedback that names the next action:</strong> a report is only worth reading if it changes the next attempt, so each one separates what already works from the single change most likely to move a band.',
            '<strong>Honest labelling:</strong> AI band scores are presented as practice estimates. Where the evidence is thin - for example pronunciation judged from a transcript rather than from audio - the product says so instead of quietly presenting a number.',
            '<strong>Progress you can inspect:</strong> saved attempts, skill-level trends, and recurring error patterns, so improvement is visible over weeks rather than guessed at from a single score.',
            '<strong>Independence:</strong> we are not affiliated with IELTS, IDP, Cambridge Assessment English, or the British Council, and we do not claim to predict an official result.',
          ],
        },
        {
          heading: 'Who IELTS Ai Pro is for',
          items: [
            '<strong>Learners without a tutor:</strong> the feedback loop replaces the part of tutoring that is hardest to self-serve - being told specifically why an answer lost marks.',
            '<strong>Learners repeating the test:</strong> analytics and error logs make it clear whether a plateau is a knowledge gap, a timing problem, or a question-technique habit.',
            '<strong>Learners short on time:</strong> focused drills built from your own weakest patterns are more efficient than repeating full mock tests every day.',
          ],
        },
        {
          heading: 'How the feedback works',
          ordered: true,
          items: [
            '<strong>You complete a real task:</strong> a timed Reading or Listening section, an Academic Task 1 or Task 2 response, or a recorded Speaking answer.',
            '<strong>The response is assessed against the criteria:</strong> Task Achievement or Task Response, Coherence and Cohesion, Lexical Resource, and Grammatical Range and Accuracy for Writing; Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, and Pronunciation for Speaking.',
            '<strong>You get an estimate plus the reasoning:</strong> the report shows which specific sentences, answers, or habits drove the estimate, not just the number.',
            '<strong>You practise one thing:</strong> the report ends in a concrete next drill, and the analytics track whether repeating it actually moved the pattern.',
          ],
        },
      ],
      faqs: [
        [
          'Is IELTS Ai Pro affiliated with the official IELTS test?',
          'No. IELTS Ai Pro is an independent preparation platform and has no affiliation with IELTS, IDP, Cambridge Assessment English, or the British Council. Official IELTS results are issued only by authorised test providers and trained examiners, and nothing produced here is an official result or a prediction of one.',
        ],
        [
          'How accurate are the AI band estimates?',
          'They are useful for spotting patterns across several attempts and much less useful read one at a time. Treat a single estimate as a rough signal, and treat the criterion-level comments and the trend across attempts as the part worth acting on.',
        ],
        [
          'Do I need to pay to use IELTS Ai Pro?',
          'A free account covers Reading and Listening practice, a monthly allowance of Writing evaluation, vocabulary tools, and basic progress analytics. Paid plans raise the monthly Writing and Speaking evaluation limits and add features such as advanced analytics and an adaptive learning path. Current limits are always shown before you start a task.',
        ],
        [
          'Which IELTS test does the platform target?',
          'The practice material and Writing evaluation are built around Academic IELTS. Reading and Listening technique, Speaking practice, and study planning transfer to General Training, but Academic Task 1 report writing is specific to the Academic paper.',
        ],
        [
          'How do I contact the team?',
          'Email mail@ieltsai.pro, or use the contact page for support, billing, and product feedback enquiries.',
        ],
      ],
    },
  },
  {
    path: 'contact',
    title: 'Contact Support & Help Desk - IELTS Ai Pro',
    description:
      'Get help with IELTS practice, Writing and Speaking AI feedback, or your subscription. Email mail@ieltsai.pro or use the contact form.',
    canonical: 'https://www.ieltsai.pro/contact',
    imageAlt: 'IELTS Ai Pro learner support desk',
    schemaType: 'ContactPage',
    prerender: {
      heading: 'Contact IELTS Ai Pro support',
      intro:
        'Questions about your practice reports, an AI band estimate, or your subscription? Email mail@ieltsai.pro and the team will get back to you, or send the form on this page.',
      sections: [
        {
          heading: 'What we can help with',
          items: [
            '<strong>Practice and feedback:</strong> questions about a Writing, Speaking, Reading, or Listening report - how an estimate was produced, why a criterion was marked the way it was, or what a comment means in practice.',
            '<strong>Account and billing:</strong> plan limits and allowances, upgrades and downgrades, invoices and receipts, payment failures, and problems signing in.',
            '<strong>Data and privacy:</strong> requests to export, correct, or delete the personal data held on your account, handled under the GDPR and CCPA rights described in our privacy policy.',
            '<strong>Bugs:</strong> anything that behaved unexpectedly - a task that would not submit, a report that failed to generate, audio that would not record, or a page that did not load.',
            '<strong>Product feedback:</strong> feature requests, missing question types, and suggestions about how practice or reporting should work.',
          ],
        },
        {
          heading: 'How to get a faster answer',
          ordered: true,
          items: [
            '<strong>Say which account you are writing from:</strong> use the email address the account is registered to, so we can look it up without a round trip.',
            '<strong>Name the task or report:</strong> the skill, the question type, and roughly when you attempted it is usually enough to find the record.',
            '<strong>Describe what you expected and what happened:</strong> for a bug, the exact wording of any error message matters more than a description of it.',
            '<strong>Attach a screenshot where it helps:</strong> layout, billing, and report-rendering problems are far quicker to diagnose visually.',
          ],
        },
        {
          heading: 'What to expect',
          items: [
            '<strong>Email is the primary channel:</strong> mail@ieltsai.pro reaches the same team as the contact form on this page.',
            '<strong>Support does not mark essays:</strong> evaluation happens inside the app so the report stays attached to your practice history and analytics.',
            '<strong>We cannot change an official IELTS result:</strong> IELTS Ai Pro is an independent preparation platform, so scores, bookings, and certificates from a test centre have to go through that centre.',
          ],
        },
      ],
      faqs: [
        [
          'How do I reach IELTS Ai Pro?',
          'Email mail@ieltsai.pro, or send the form on this page - both reach the same team. It is the fastest route for support, billing, account, and data-privacy questions.',
        ],
        [
          'Can you review my IELTS essay by email?',
          'No. Feedback is produced inside the app so the report stays tied to your practice history and progress analytics. Use the writing checker rather than sending essays to support, and write to us if the checker itself is not working.',
        ],
        [
          'Can you help with booking or rescheduling an IELTS test?',
          'No. IELTS Ai Pro is an independent preparation platform with no affiliation to IELTS, IDP, Cambridge, or the British Council. Bookings, test-day arrangements, and official results are handled only by your test centre.',
        ],
        [
          'How do I cancel a subscription or request a refund?',
          'Email mail@ieltsai.pro from the address on the account and say what you would like cancelled. Include the receipt or invoice reference if you have one, as it makes the payment easy to locate.',
        ],
        [
          'How do I request deletion of my data?',
          'Email mail@ieltsai.pro from your account address. Deletion, export, and correction requests are handled under the rights set out in our privacy policy.',
        ],
      ],
    },
  },
  {
    path: 'ielts-band-score-calculator',
    title: 'IELTS Band Score Calculator | IELTS Ai Pro',
    description:
      'Free IELTS band score calculator: turn your Listening, Reading, Writing and Speaking scores into an overall band, plus raw score conversion.',
    keywords:
      'IELTS band score calculator, IELTS score calculator, IELTS band calculator, IELTS test band calculator, IELTS score and band calculator, calculate IELTS score, IELTS reading score conversion, IELTS raw score conversion',
    canonical: 'https://www.ieltsai.pro/ielts-band-score-calculator',
    imageAlt: 'IELTS learner calculating an overall band score',
    prerender: {
      heading: 'IELTS Band Score Calculator',
      intro:
        'Enter your Listening, Reading, Writing, and Speaking bands to get an overall band using the official Cambridge rounding rules, and convert Listening or Reading raw scores into a band.',
      sections: [
        {
          heading: 'How IELTS band scores are calculated',
          ordered: true,
          items: [
            '<strong>Average the four skills:</strong> add your Listening, Reading, Writing, and Speaking bands together and divide by four. Every skill carries equal weight, so a weak paper cannot be offset by weighting a strong one.',
            '<strong>Round to the nearest half band:</strong> an average ending in .25 rounds up to the next half band and an average ending in .75 rounds up to the next whole band. A 6.25 average becomes 6.5, and a 6.75 average becomes 7.0.',
            '<strong>Round down below the threshold:</strong> an average ending in .125 or .375 rounds down, which is why an average of 7.625 does not reach Band 8. Small differences either side of a threshold decide the reported band.',
            '<strong>Convert raw scores separately:</strong> Listening and Reading are marked out of 40, and the number of correct answers maps onto a band before it enters the four-skill average.',
          ],
        },
        {
          heading: 'Worked examples',
          items: [
            '<strong>6.5, 6.5, 6.0, 6.0</strong> averages to 6.25, which rounds up to an overall <strong>Band 6.5</strong>.',
            '<strong>7.0, 7.0, 6.5, 6.5</strong> averages to 6.75, which rounds up to an overall <strong>Band 7.0</strong>.',
            '<strong>7.5, 7.5, 7.0, 8.5</strong> averages to 7.625, which rounds down to an overall <strong>Band 7.5</strong>.',
            '<strong>8.0, 7.5, 6.5, 6.5</strong> averages to 7.125, which rounds down to an overall <strong>Band 7.0</strong> - a reminder that raising the weakest paper usually moves the overall band faster than polishing the strongest.',
          ],
        },
        {
          heading: 'Using the raw score converter',
          items: [
            '<strong>Listening:</strong> enter the number of correct answers out of 40 to see the band that score maps to.',
            '<strong>Academic Reading:</strong> the same 40-question total maps onto a different curve, so an identical raw score does not produce an identical band across the two papers.',
            '<strong>General Training Reading:</strong> the curve is more demanding, and a given band typically requires several more correct answers than Academic Reading.',
            '<strong>Spelling and word limits count:</strong> a correct idea written outside the stated word limit or misspelled scores zero, so raw-score practice is worth reviewing answer by answer.',
          ],
        },
        {
          heading: 'Setting a realistic target',
          ordered: true,
          items: [
            '<strong>Start from your current four bands:</strong> use recent timed practice rather than an estimate from memory.',
            '<strong>Find the cheapest half band:</strong> work out which single paper needs the smallest improvement to move the rounded average across the next threshold.',
            '<strong>Check the requirement, not the ambition:</strong> many universities and visa routes set a minimum in each skill as well as an overall band, and the per-skill minimum is often the binding constraint.',
          ],
        },
      ],
      faqs: [
        [
          'How is the overall IELTS band score calculated?',
          'Your overall band is the average of Listening, Reading, Writing, and Speaking, rounded to the nearest half band. A 6.25 average rounds up to 6.5, and 6.75 rounds up to 7.0.',
        ],
        [
          'How many correct answers yield Band 7.0 in Listening and Reading?',
          'Typically 30 out of 40 correct answers earns Band 7.0 in Listening and Academic Reading. General Training Reading requires around 34 correct answers.',
        ],
        [
          'Is this IELTS band score calculator official?',
          'No. It uses official Cambridge rounding rules for practice estimation. Official result certificates are issued exclusively by authorised IELTS test centres.',
        ],
      ],
    },
    primaryCta: 'Calculate your IELTS band score',
    primaryHref: '#overall-band-calculator',
    secondaryCta: 'Try an IELTS practice test',
    secondaryHref: '/cambridge-ielts-practice-tests',
  },
  {
    path: 'ielts-university-requirements',
    title: 'IELTS University Requirements by Country | IELTS Ai Pro',
    description:
      'Check IELTS university requirements by country. Compare overall scores and section minimums, then see which universities your band meets before applying.',
    keywords:
      'IELTS university requirements, IELTS requirements by university, IELTS score for university admission, minimum IELTS score for university, IELTS requirements by country, IELTS university entry requirements, university IELTS checker',
    canonical: 'https://www.ieltsai.pro/ielts-university-requirements',
    imageAlt: 'Student comparing IELTS university requirements by country',
    prerender: {
      heading: 'IELTS University Requirements by Country',
      intro:
        'Compare IELTS university requirements by country, course, and study level. Set your Listening, Reading, Writing, and Speaking bands to see which universities your score meets. Every requirement is checked against the university’s own page, dated, and linked to that source.',
      sections: [
        {
          heading: 'How IELTS university requirements vary by country',
          items: [
            '<strong>Common taught-course baseline:</strong> many universities publish 6.0 to 6.5 overall with a minimum in each skill, while competitive programmes may require Band 7.0 or higher.',
            '<strong>Country and institution matter:</strong> the same IELTS score can meet one university’s requirement and miss another’s, even for a similar course.',
            '<strong>Foundation and pathway entry:</strong> some institutions accept a lower band when English support or a pre-sessional route is built into the offer.',
            '<strong>Professional and research degrees:</strong> Medicine, Nursing, Law, Teaching, MBA, and research programmes often set higher or more specific component minimums.',
          ],
        },
        {
          heading: 'Why the component minimum decides most applications',
          ordered: true,
          items: [
            '<strong>The overall band is only half the rule:</strong> nearly every university sets a floor for each of the four skills alongside the overall figure.',
            '<strong>A high average can still fail:</strong> 6.5 overall built from 7.5 Listening, 7.0 Reading, 5.5 Writing, and 6.0 Speaking misses a 6.0 component floor, so the application is rejected despite the overall band being met.',
            '<strong>The weakest skill is the binding constraint:</strong> raising one weak paper by half a band usually unlocks more universities than raising an already strong paper.',
            '<strong>Check the per-skill line before applying:</strong> it is stated on the same page as the overall requirement and is the line most applicants skim past.',
          ],
        },
        {
          heading: 'Requirements are set per course and country',
          items: [
            '<strong>Many universities publish a range, not one number:</strong> a single institution can span 5.5 to 7.5 across its programmes and departments.',
            '<strong>Tiered systems are common:</strong> courses may be assigned Standard, High, or Advanced levels, each with its own overall and component minimums.',
            '<strong>Country rules are not interchangeable:</strong> UK, US, Canadian, Australian, and European institutions can use different score policies, accepted tests, and conditional pathways.',
            '<strong>Check the official course page:</strong> the university’s current programme or admissions page is the authority before you pay an application fee.',
          ],
        },
        {
          heading: 'If your score falls short',
          ordered: true,
          items: [
            '<strong>Check whether a pre-sessional route exists:</strong> many universities admit applicants slightly below the requirement onto a pre-sessional English course that leads into the degree.',
            '<strong>Target the single weakest skill:</strong> re-sitting to lift one component is faster and cheaper than trying to raise every paper at once.',
            '<strong>Look at the range, not the headline:</strong> a university whose typical requirement is above your band may still run courses at a lower level.',
            '<strong>Confirm on the course page before paying a fee:</strong> requirements change between intakes, and the course page is the only authority.',
          ],
        },
      ],
      faqs: [
        [
          'What IELTS score do I need for university admission?',
          'Many universities set a baseline of 6.0 to 6.5 overall with a minimum in each skill, while competitive courses may require 7.0 or higher. The exact requirement depends on the country, university, course, and study level.',
        ],
        [
          'Can I be rejected if my overall band meets the requirement?',
          'Yes. Almost every university sets a minimum for each of the four skills as well as an overall band. A 6.5 overall with 5.5 in Writing fails a 6.0 component minimum, so the application is rejected even though the overall figure looks high enough.',
        ],
        [
          'Do all universities publish a single IELTS requirement?',
          'No. Requirements often vary by country, course, department, and study level. Universities may publish a range or tiered levels instead of one figure, so this page shows the available requirement and links to the official university source.',
        ],
        [
          'How current is this requirement data?',
          'Every entry carries the date a person last checked it against the university’s own page and links to that page. Entries older than a year are flagged as possibly out of date rather than presented as current.',
        ],
        [
          'What can I do if I am half a band short?',
          'Many universities run pre-sessional English courses that admit applicants slightly below the requirement. Lifting a single weak skill is also usually faster than re-sitting the whole test.',
        ],
      ],
    },
    primaryCta: 'Check university IELTS requirements',
    primaryHref: '#university-requirements-checker',
    secondaryCta: 'Calculate your overall band score',
    secondaryHref: '/ielts-band-score-calculator',
  },
  {
    path: 'privacy',
    title: 'Privacy Policy & Data Security | IELTS Ai Pro',
    description:
      'Read the IELTS Ai Pro privacy policy to understand how we collect, use, and protect your personal data in compliance with GDPR and CCPA regulations.',
    canonical: 'https://www.ieltsai.pro/privacy',
    imageAlt: 'IELTS Ai Pro privacy and data protection',
    prerender: {
      heading: 'Privacy Policy',
      intro:
        'This policy explains what personal data IELTS Ai Pro collects, why it is collected, how long it is kept, and the rights you have over it under GDPR and CCPA.',
      sections: [
        {
          heading: 'What this policy covers',
          items: [
            '<strong>Information collection:</strong> what we ask for when you register on the site, subscribe to a plan, respond to a survey, or fill out a form, and what is collected automatically as you use the application.',
            '<strong>Lawful basis for processing:</strong> the GDPR Article 6 grounds we rely on for each category of processing, including contract, consent, and legitimate interests.',
            '<strong>Data we process:</strong> account details, subscription and payment records, the practice responses you submit, and the derived feedback and analytics built from them.',
            '<strong>Data security and encryption:</strong> the technical and organisational measures used to protect data in transit and at rest.',
            '<strong>Your rights under GDPR and CCPA:</strong> access, portability, rectification, erasure, restriction, objection, and the right not to be discriminated against for exercising them.',
            '<strong>Account deletion and data wiping:</strong> what happens to your practice history, reports, and account record when you ask for deletion.',
            '<strong>Data breach notification:</strong> how and when affected users and regulators are informed.',
            '<strong>International data transfers:</strong> the safeguards applied when data moves between jurisdictions.',
            '<strong>Data retention:</strong> how long each category is kept and what triggers its removal.',
            '<strong>Contact and Data Protection Officer:</strong> where to send a privacy request or a complaint.',
          ],
        },
        {
          heading: 'How practice data is used',
          items: [
            '<strong>To produce your feedback:</strong> a Writing response or Speaking recording has to be processed to return criterion-level comments and an estimated practice band.',
            '<strong>To build your progress history:</strong> saved attempts are what make skill trends, error patterns, and the adaptive learning path possible.',
            '<strong>To operate the service:</strong> authentication, plan limits, billing, and support all require a minimum of account data.',
            '<strong>Not to sell:</strong> we do not sell personal information, and CCPA-covered users retain the right to direct that no sale takes place.',
          ],
        },
        {
          heading: 'Exercising your rights',
          ordered: true,
          items: [
            '<strong>Write from your account address:</strong> email mail@ieltsai.pro from the address the account is registered to, which is the fastest way for us to verify the request.',
            '<strong>Say what you want:</strong> a copy of your data, a correction, restriction of a particular processing activity, or full deletion of the account and its practice history.',
            '<strong>We respond within the statutory period:</strong> requests are handled in line with the response deadlines set by the GDPR and the CCPA.',
            '<strong>You can complain to a regulator:</strong> if you are not satisfied with the outcome, you may raise the matter with your local supervisory authority.',
          ],
        },
      ],
      faqs: [
        [
          'How do I request deletion of my data?',
          'Email mail@ieltsai.pro from the address on your account and we will process the request in line with GDPR and CCPA requirements. Deletion removes the account record along with the practice responses, reports, and analytics derived from them.',
        ],
        [
          'Are my practice essays and recordings used to train AI models?',
          'Your submissions are processed to generate the feedback you asked for and to build your own progress history. Where any further use would require your consent, that consent is asked for separately rather than assumed.',
        ],
        [
          'Does IELTS Ai Pro sell personal information?',
          'No. We do not sell personal information. CCPA-covered users retain the right to direct that no sale takes place, and exercising any privacy right never results in a degraded service.',
        ],
        [
          'How long is my data kept?',
          'Each category has its own retention period, set out in the data retention section of the policy. Practice history is retained while the account is active so that progress tracking works, and is removed when the account is deleted.',
        ],
      ],
    },
  },
  {
    path: 'terms',
    title: 'Terms of Service & Usage Policy | IELTS Ai Pro',
    description:
      'Review the IELTS Ai Pro terms of service: licensing, disclaimers, and limitations of liability for our AI-powered IELTS preparation platform.',
    canonical: 'https://www.ieltsai.pro/terms',
    imageAlt: 'IELTS Ai Pro terms of service',
    prerender: {
      heading: 'Terms of Service',
      intro:
        'These terms govern your use of IELTS Ai Pro, including the licence granted to you, acceptable use of the practice materials, disclaimers, and limitations of liability.',
      sections: [
        {
          heading: 'Key terms',
          ordered: true,
          items: [
            '<strong>Acceptance of terms:</strong> by accessing and using this website you agree to be bound by this agreement, and when using a particular service you are additionally subject to any guidelines or rules posted for that service.',
            '<strong>Use licence:</strong> permission is granted to temporarily download one copy of the materials on the site for personal, non-commercial, transitory viewing only. This is a licence, not a transfer of title. You may not modify or copy the materials, use them for any commercial purpose or public display, or attempt to decompile or reverse engineer any software on the site.',
            '<strong>Disclaimer:</strong> materials are provided on an "as is" basis, without warranties of any kind, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement of intellectual property.',
            '<strong>Limitations:</strong> we are not liable for damages arising out of the use or inability to use the materials, to the fullest extent permitted by applicable law.',
            '<strong>Revisions and errata:</strong> materials may include technical, typographical, or photographic errors, and we may change them at any time without notice. We do not warrant that any material is accurate, complete, or current.',
          ],
        },
        {
          heading: 'What these terms mean in practice',
          items: [
            '<strong>Practice estimates are not results:</strong> AI band scores, criterion feedback, and readiness indicators are preparation aids. Official IELTS results are issued only by authorised test providers and trained examiners.',
            '<strong>No affiliation:</strong> IELTS Ai Pro is independent and is not associated with IELTS, IDP, Cambridge Assessment English, or the British Council. References to IELTS describe the test the platform prepares you for, not an endorsement.',
            '<strong>No outcome guarantee:</strong> nothing on the platform guarantees a particular band, an admission decision, or a visa outcome.',
            '<strong>Your account is yours to keep secure:</strong> access is personal to you, and sharing credentials puts your practice history and subscription at risk.',
            '<strong>Plan limits are shown before you commit:</strong> monthly evaluation allowances and feature availability are displayed in the application before a task consumes an allowance.',
          ],
        },
      ],
      faqs: [
        [
          'Are AI band scores covered by any guarantee?',
          'No. They are practice estimates provided as-is to guide preparation, and they carry no guarantee of a particular official IELTS outcome, admission decision, or visa result.',
        ],
        [
          'Can I reuse IELTS Ai Pro material with my own students?',
          'Not under this licence. Materials are licensed for personal, non-commercial viewing, which excludes commercial use and public display. Write to mail@ieltsai.pro if you need different terms.',
        ],
        [
          'Can these terms change?',
          'Yes. Materials and terms may be revised at any time without notice, and continued use of the site after a change means you accept the current version.',
        ],
        [
          'Which law governs these terms?',
          'The governing law and dispute-resolution provisions are set out in full on this page; where local consumer law grants you stronger rights, those rights are unaffected.',
        ],
      ],
    },
  },
  {
    path: 'refund',
    title: 'Refund & Cancellation Policy | IELTS Ai Pro',
    description:
      'Understand subscription cancellation, AI-credit usage, the unused-purchase refund window, and consumer rights for IELTS Ai Pro purchases made through Stripe.',
    canonical: 'https://www.ieltsai.pro/refund',
    imageAlt: 'IELTS Ai Pro refund and cancellation policy',
    prerender: {
      heading: 'Refund & Cancellation Policy',
      intro:
        'This policy explains the voluntary refund window for an unused first purchase, what happens when paid SaaS features or AI credits are used, and how to stop future subscription renewals.',
      sections: [
        {
          heading: 'Scope and legal rights',
          items: [
            'This policy applies to paid IELTS Ai Pro purchases processed through Stripe. It does not exclude or limit consumer rights or remedies that cannot legally be excluded or limited where you live.',
            'A statutory cancellation or withdrawal right is separate from the voluntary seven-day offer. Contact us within the applicable legal period; charges for service already provided will be handled only as local law permits.',
          ],
        },
        {
          heading: 'Canceling a subscription',
          items: [
            'Cancel from your account subscription settings to stop future renewals. Paid access normally continues until the current billing period ends; canceling alone does not refund that period or unused time unless law requires otherwise.',
          ],
        },
        {
          heading: 'Seven-day unused-purchase window',
          items: [
            'A voluntary full refund may be requested within seven calendar days of the first paid subscription purchase only if it is completely unused: no paid-only feature accessed, no paid AI request or evaluation consuming credits or allowances, no paid test started, and no paid-only material downloaded.',
            'Seven days is a request window, not a free trial. Using any paid feature or one AI credit ends this voluntary offer. Using all included credits within seven days does not qualify the purchase for an unused-purchase refund.',
            'A failed AI request that produced no usable result and consumed no credit or allowance is not completed usage for this voluntary offer.',
          ],
        },
        {
          heading: 'Non-refundable situations',
          items: [
            'Except where applicable law or a billing/service exception requires otherwise, used purchases, renewals, repeat purchases, purchases outside the seven-day window, unused subscription time or credits, change of mind, dissatisfaction with estimated AI feedback, and failure to achieve a particular IELTS result are not eligible for a voluntary refund.',
            'This voluntary usage rule does not remove a non-waivable legal right or a remedy for a confirmed billing or service problem.',
          ],
        },
        {
          heading: 'Billing and service exceptions',
          items: [
            'We review confirmed duplicate or incorrect charges, payments where the purchased service was not supplied, material failures preventing the core paid service, reported unauthorized transactions, and any other remedy required by applicable law.',
          ],
        },
        {
          heading: 'How to request a refund',
          items: [
            'Email mail@ieltsai.pro from the account email with the purchase date, plan, amount, Stripe receipt or transaction reference, and a brief explanation. Never send a password, full card number, security code, or one-time code.',
            'Approved refunds are submitted through Stripe to the original payment method where supported. Bank or card issuer posting times vary. A full refund ends the related paid access and unused entitlements.',
          ],
        },
      ],
      faqs: [
        [
          'Can I get a refund after using AI credits?',
          'Not under the voluntary unused-purchase offer. Using one or all paid AI credits makes that purchase ineligible, while non-waivable legal rights and confirmed billing or service remedies remain unaffected.',
        ],
        [
          'Does canceling renewals refund my current period?',
          'No. Cancellation stops future renewals and paid access normally continues through the current period. A refund is handled separately under this policy and applicable law.',
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
  const callsToAction = config.primaryCta
    ? `<nav aria-label="Page actions">
          <a href="${config.primaryHref}">${config.primaryCta}</a>
          ${config.secondaryCta ? `<a href="${config.secondaryHref}">${config.secondaryCta}</a>` : ''}
        </nav>`
    : '';

  return `<article id="static-prerender-content" class="sr-only">
        <h1>${prerender.heading}</h1>
        <p>${prerender.intro}</p>
        ${callsToAction}
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
          <a href="/blog">IELTS Preparation Blog</a>
        </nav>
      </article>`;
}

function replaceTag(html, expression, replacement, label) {
  if (!expression.test(html)) throw new Error(`Could not find ${label} in the Vite output.`);
  return html.replace(expression, replacement);
}

/*
 * There is deliberately no SoftwareApplication node here. Google's Software App
 * markup requires an aggregateRating, and the only way to satisfy that would be to
 * publish review data the product does not have. After the About/Contact/Privacy/
 * Terms/Calculator pages were given their own graphs, the four pages a Semrush crawl
 * still reported markup errors on were exactly the four that emitted
 * SoftwareApplication - so the node is dropped rather than padded with invented
 * ratings. Add it back only alongside genuine collected reviews.
 */
function renderPublicPage(html, config) {
  const shortTitle = config.title.replace(' | IELTS Ai Pro', '');
  const pageSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': config.schemaType || 'WebPage',
        '@id': `${config.canonical}#webpage`,
        url: config.canonical,
        name: config.title,
        description: config.description,
        inLanguage: 'en',
        isPartOf: { '@id': `${SITE_URL}/#website` },
        primaryImageOfPage: { '@type': 'ImageObject', url: config.image },
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
  if (config.keywords) {
    const keywordTag = `<meta name="keywords" content="${config.keywords}" />`;
    if (/<meta\s+name="keywords"[^>]*\/>/.test(page)) {
      page = replaceTag(page, /<meta\s+name="keywords"[^>]*\/>/, keywordTag, 'keywords meta tag');
    } else {
      page = replaceTag(
        page,
        /<meta\s+name="description"[^>]*\/>/,
        (match) => `${match}\n  ${keywordTag}`,
        'description meta tag for keyword insertion'
      );
    }
  }
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
