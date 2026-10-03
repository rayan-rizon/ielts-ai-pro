// Shared by the React page and the build-time HTML generator so crawlers and
// visitors read the same institution offer and approval process.
export const institutionLanding = {
  path: '/institutions',
  title: 'IELTS Platform for Institutions | IELTS Ai Pro',
  description:
    'AI IELTS preparation for institutions. Give students Pro or Premium access and manage prepaid seats, invitations and billing in one portal. Apply for access.',
  keywords:
    'IELTS preparation platform for institutions, IELTS software for language schools, IELTS online practice, AI IELTS preparation',
  canonical: 'https://www.ieltsai.pro/institutions',
  image: 'https://www.ieltsai.pro/images/institutions/social.jpg',
  imageAlt: 'Four adult learners studying together with a laptop and notebooks',
  heading: 'Better IELTS practice for your institution.',
  headingLead: 'Better IELTS practice',
  headingBridge: 'for your',
  headingAccent: 'institution.',
  intro:
    'Give your students AI-powered IELTS practice across all four skills. Manage Pro and Premium access, student invitations and billing in one simple institution portal.',
  primaryCta: 'Apply for institution access',
  primaryHref: '/institution/apply',
  secondaryCta: 'Institution sign in',
  secondaryHref: '/institution/login',
};

export const portalFeatures = [
  {
    title: 'Invite in minutes',
    description: 'Add students by email or import a CSV. Send invitations and see who has joined.',
  },
  {
    title: 'Buy only the seats you need',
    description:
      'Choose Pro or Premium, a 1- or 3-month duration, and the number of prepaid seats.',
  },
  {
    title: 'Keep billing in one place',
    description:
      'See your seat balance, purchase history and available invoices in your institution portal.',
  },
];

export const practiceFeatures = [
  {
    title: 'Reading',
    description: 'Build confidence with passages, question types and timed reading practice.',
  },
  {
    title: 'Listening',
    description: 'Practise with audio, interactive questions and realistic listening tasks.',
  },
  {
    title: 'Writing',
    description: 'Get criterion-based AI feedback on Task 1 and Task 2 practice responses.',
  },
  {
    title: 'Speaking',
    description: 'Practise speaking with AI feedback, topic prompts and model answers.',
  },
];

export const approvalSteps = [
  {
    title: 'Apply',
    description: 'Tell us about your institution, your students and the access you need.',
  },
  {
    title: 'Admin review',
    description: 'Our team reviews your request and gets in touch to discuss your needs.',
  },
  {
    title: 'Owner invitation',
    description:
      'After approval, the owner receives an invitation to set up the institution portal.',
  },
];

export const institutionFaqs = [
  [
    'Who is this IELTS preparation platform for?',
    'IELTS Ai Pro is for language schools, IELTS coaching centres and education providers that want to give students online IELTS preparation access. Institutions manage Pro or Premium seats, invitations and billing in a separate portal; students practise in their own learner dashboard.',
  ],
  [
    'What do students get?',
    'Students use the existing IELTS Ai Pro learner dashboard with the standard allowances of their assigned Pro or Premium plan. They can practise Reading, Listening, Writing and Speaking. AI feedback and band scores are practice estimates, not official IELTS results.',
  ],
  [
    'How does institution access work?',
    'Apply with your institution details. Our team reviews the request and may contact you. If approved, the institution owner receives an invitation to set up their separate portal. There is no public institution sign-up.',
  ],
  [
    'When does a student’s access start?',
    'Students must accept a paid seat invitation within 90 days of purchase. Each student gets the full purchased duration from activation. If they already have paid access, the institution seat waits until that access ends; personal renewals can postpone activation.',
  ],
  [
    'Can we purchase seats for different groups?',
    'Yes. Purchase prepaid Pro or Premium seats for 1 or 3 months and invite the students who need them. Buy more seats when your next group is ready. Contact our team through your application to discuss bulk or custom pricing.',
  ],
  [
    'Can our institution see students’ practice submissions?',
    'The institution portal shows student identity and access status. Students’ submissions and private learning activity stay in their learner dashboard.',
  ],
];

export const institutionPrerender = {
  ...institutionLanding,
  path: 'institutions',
  prerender: {
    heading: institutionLanding.heading,
    intro: institutionLanding.intro,
    sections: [
      {
        heading: 'One portal. Every student connected.',
        items: portalFeatures.map(({ title, description }) => `${title}: ${description}`),
      },
      {
        heading: 'Practice that continues beyond the classroom.',
        items: practiceFeatures.map(({ title, description }) => `${title}: ${description}`),
      },
      {
        heading: 'How institution access works.',
        ordered: true,
        items: approvalSteps.map(({ title, description }) => `${title}: ${description}`),
      },
    ],
    faqs: institutionFaqs,
  },
};
