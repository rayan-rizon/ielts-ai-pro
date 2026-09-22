import React from 'react';
import { Navigate } from 'react-router-dom';
import DocumentHead from '@/components/shared/DocumentHead';
import {
  LegalPageLayout,
  LegalSection,
  LegalList,
  LegalDefinitions,
  LegalNote,
} from '@/features/core/components/legal/LegalPageLayout';
import { detectLocation } from '@/lib/pricingUtils';

const LAST_UPDATED = { en: 'September 22, 2026', bn: '২২ সেপ্টেম্বর ২০২৬' };

const ROUTES = {
  terms: { en: '/bd/terms', bn: '/bn/terms' },
  privacy: { en: '/bd/privacy', bn: '/bn/privacy' },
  refund: { en: '/bd/refund-cancellation', bn: '/bn/refund-cancellation' },
};

const GLOBAL_ROUTES = {
  terms: '/terms',
  privacy: '/privacy',
  refund: '/refund',
};

const SECTION_TITLES = {
  en: {
    terms: [
      ['business', 'Business identity'],
      ['scope', 'Scope and acceptance'],
      ['service', 'Service and AI features'],
      ['accounts', 'Accounts and eligibility'],
      ['subscriptions', 'Plans, subscriptions, and payment'],
      ['credits', 'AI credits and fair use'],
      ['cancellation', 'Cancellation and refunds'],
      ['acceptable-use', 'Acceptable use'],
      ['availability', 'Availability and liability'],
      ['complaints', 'Complaints, law, and contact'],
    ],
    privacy: [
      ['business', 'Who is responsible for your data'],
      ['scope', 'Scope'],
      ['data', 'Information we collect'],
      ['use', 'Why we use information'],
      ['ai', 'AI processing'],
      ['sharing', 'Service providers and disclosures'],
      ['transfers', 'International processing'],
      ['retention', 'Retention and security'],
      ['rights', 'Your rights'],
      ['children', 'Children, contact, and updates'],
    ],
    refund: [
      ['business', 'Business identity'],
      ['scope', 'Scope and legal rights'],
      ['unused', 'Seven-day unused-purchase window'],
      ['used', 'When the service has been used'],
      ['exceptions', 'Billing and service exceptions'],
      ['not-refundable', 'Non-refundable situations'],
      ['cancellation', 'Subscription cancellation'],
      ['request', 'Request, review, and payment timing'],
      ['disputes', 'Usage records and disputes'],
      ['contact', 'Contact'],
    ],
  },
  bn: {
    terms: [
      ['business', 'ব্যবসায়িক পরিচয়'],
      ['scope', 'প্রযোজ্যতা ও সম্মতি'],
      ['service', 'সেবা ও এআই সুবিধা'],
      ['accounts', 'অ্যাকাউন্ট ও ব্যবহারকারীর যোগ্যতা'],
      ['subscriptions', 'প্ল্যান, সাবস্ক্রিপশন ও মূল্য পরিশোধ'],
      ['credits', 'এআই ক্রেডিট ও ন্যায্য ব্যবহার'],
      ['cancellation', 'সাবস্ক্রিপশন বাতিল ও রিফান্ড'],
      ['acceptable-use', 'গ্রহণযোগ্য ব্যবহারের নিয়ম'],
      ['availability', 'সেবার প্রাপ্যতা ও দায়সীমা'],
      ['complaints', 'অভিযোগ, প্রযোজ্য আইন ও যোগাযোগ'],
    ],
    privacy: [
      ['business', 'আপনার তথ্যের জন্য দায়ী প্রতিষ্ঠান'],
      ['scope', 'প্রযোজ্যতা'],
      ['data', 'আমরা যেসব তথ্য সংগ্রহ করি'],
      ['use', 'কেন তথ্য ব্যবহার করি'],
      ['ai', 'এআই-ভিত্তিক তথ্য প্রক্রিয়াকরণ'],
      ['sharing', 'সেবাদাতা ও তথ্য প্রকাশ'],
      ['transfers', 'বাংলাদেশের বাইরে তথ্য প্রক্রিয়াকরণ'],
      ['retention', 'তথ্য সংরক্ষণ ও নিরাপত্তা'],
      ['rights', 'আপনার অধিকার'],
      ['children', 'অপ্রাপ্তবয়স্ক ব্যবহারকারী, যোগাযোগ ও পরিবর্তন'],
    ],
    refund: [
      ['business', 'ব্যবসায়িক পরিচয়'],
      ['scope', 'প্রযোজ্যতা ও আইনগত অধিকার'],
      ['unused', 'অব্যবহৃত ক্রয়ের জন্য সাত দিনের সময়সীমা'],
      ['used', 'সেবা ব্যবহার করা হলে'],
      ['exceptions', 'বিলিং ও সেবাজনিত ব্যতিক্রম'],
      ['not-refundable', 'যেসব ক্ষেত্রে রিফান্ড প্রযোজ্য নয়'],
      ['cancellation', 'সাবস্ক্রিপশন বাতিল'],
      ['request', 'আবেদন, যাচাই ও রিফান্ডের সময়'],
      ['disputes', 'ব্যবহারের রেকর্ড ও আপত্তি'],
      ['contact', 'যোগাযোগ'],
    ],
  },
};

function getSections(type, language) {
  return SECTION_TITLES[language][type].map(([id, title]) => ({ id, title }));
}

function BusinessIdentity({ language, includeLicence = false }) {
  const isBangla = language === 'bn';
  return (
    <LegalDefinitions
      items={[
        {
          term: isBangla ? 'প্রতিষ্ঠানের নাম' : 'Company name',
          description: 'QuantByte Tech',
        },
        {
          term: isBangla ? 'পণ্যের নাম' : 'Product',
          description: isBangla
            ? 'ieltsai.pro — QuantByte Tech-এর একটি পণ্য'
            : 'ieltsai.pro — a product of QuantByte Tech',
        },
        ...(includeLicence
          ? [
              {
                term: isBangla ? 'ট্রেড লাইসেন্স নম্বর' : 'Trade licence number',
                description: '03663',
              },
            ]
          : []),
        {
          term: isBangla ? 'যোগাযোগ নম্বর' : 'Contact number',
          description: <a href="tel:+8801776662444">01776662444</a>,
        },
        {
          term: isBangla ? 'ইমেইল' : 'Email',
          description: <a href="mailto:mail@ieltsai.pro">mail@ieltsai.pro</a>,
        },
        {
          term: isBangla ? 'ওয়েবসাইট' : 'Website',
          description: <a href="https://ieltsai.pro">ieltsai.pro</a>,
        },
      ]}
    />
  );
}

const EnglishTerms = () => (
  <>
    <LegalSection id="business" title="1. Business identity">
      <BusinessIdentity language="en" includeLicence />
    </LegalSection>
    <LegalSection id="scope" title="2. Scope and acceptance">
      <p>
        These terms apply to customers in Bangladesh who use IELTS Ai Pro or purchase a plan priced
        in Bangladeshi taka.
      </p>
      <p>
        By creating an account, purchasing a plan, or using a paid feature, you agree to these
        terms, the Bangladesh Privacy Notice, and the Bangladesh Refund &amp; Cancellation Policy.
      </p>
    </LegalSection>
    <LegalSection id="service" title="3. Service and AI features">
      <p>
        IELTS Ai Pro is a software-as-a-service platform for IELTS preparation. It provides practice
        tools, learning resources, progress features, and automated feedback. AI-generated scores,
        corrections, suggestions, and answers are educational estimates and may contain errors.
      </p>
      <LegalNote title="Not an official IELTS result">
        AI feedback is not an examiner decision, official IELTS score, admission decision,
        immigration advice, or guarantee of a particular outcome.
      </LegalNote>
    </LegalSection>
    <LegalSection id="accounts" title="4. Accounts and eligibility">
      <LegalList
        items={[
          'Provide accurate information and keep your login credentials secure.',
          'Use one personal account unless QuantByte Tech approves another arrangement in writing.',
          'Users under 18 must have the permission and supervision of a parent or legal guardian.',
          'Notify us promptly if you suspect unauthorised account or payment activity.',
        ]}
      />
    </LegalSection>
    <LegalSection id="subscriptions" title="5. Plans, subscriptions, and payment">
      <p>
        Before purchase, the checkout must show the plan, BDT price, access period, included usage,
        material limits, and whether the subscription renews automatically. Available payment
        providers are shown at checkout and may apply their own customer terms.
      </p>
      <p>
        A recurring subscription may be charged only after explicit authorisation. Where automatic
        renewal is offered, the checkout will state the charge frequency and cancellation method. We
        will not introduce an automatic recurring charge merely because you previously made a
        one-time purchase.
      </p>
    </LegalSection>
    <LegalSection id="credits" title="6. AI credits and fair use">
      <p>
        AI credits are a limited licence to request specified digital services during the applicable
        plan period. Credits are not money, cannot be transferred or redeemed for cash, and do not
        carry forward unless the plan expressly says so. A credit or usage allowance is normally
        consumed when processing completes and a result is made available.
      </p>
      <p>
        We may rate-limit or stop automated, shared, fraudulent, abusive, or technically harmful
        use. A failed request that produces no usable result should not consume paid usage; contact
        support if the record appears incorrect.
      </p>
    </LegalSection>
    <LegalSection id="cancellation" title="7. Cancellation and refunds">
      <p>
        Cancellation stops future renewal where recurring billing applies; it does not automatically
        refund the current period. Digital service begins when paid access or a paid feature becomes
        available. A voluntary refund is available only under the Bangladesh Refund &amp;
        Cancellation Policy—most importantly, the seven-day window applies only to a completely
        unused purchase. Any paid-feature use or AI-credit consumption ends that voluntary option.
      </p>
    </LegalSection>
    <LegalSection id="acceptable-use" title="8. Acceptable use">
      <LegalList
        items={[
          'Do not share, sell, scrape, bulk-download, reverse engineer, or commercially resupply the service or feedback.',
          'Do not bypass account, credit, security, or payment controls.',
          'Do not upload unlawful, abusive, infringing, or malicious content.',
          'Do not present AI feedback as an official IELTS score or examiner report.',
        ]}
      />
    </LegalSection>
    <LegalSection id="availability" title="9. Availability and liability">
      <p>
        We may maintain, repair, replace, or discontinue features. If a material paid service is not
        supplied, we may restore usage, extend access, provide a reasonable substitute, or issue the
        remedy required by the Refund Policy and Bangladesh law. To the fullest extent permitted by
        law, we do not guarantee a band score, exam result, admission, visa result, or uninterrupted
        service. Nothing here excludes a right or liability that cannot legally be excluded.
      </p>
    </LegalSection>
    <LegalSection id="complaints" title="10. Complaints, law, and contact">
      <p>
        Bangladesh law applies where required. For support or a complaint, call{' '}
        <a href="tel:+8801776662444">01776662444</a> or email{' '}
        <a href="mailto:mail@ieltsai.pro">mail@ieltsai.pro</a>. Include your account email and
        relevant order or transaction reference, but never send a password, PIN, or OTP. We aim to
        acknowledge a complete complaint within 72 hours.
      </p>
    </LegalSection>
  </>
);

const EnglishPrivacy = () => (
  <>
    <LegalSection id="business" title="1. Who is responsible for your data">
      <p>
        QuantByte Tech operates IELTS Ai Pro and is responsible for the processing described here.
      </p>
      <BusinessIdentity language="en" />
    </LegalSection>
    <LegalSection id="scope" title="2. Scope">
      <p>
        This notice explains how IELTS Ai Pro handles personal data of users in Bangladesh,
        including account, subscription, learning, and AI-feature data.
      </p>
    </LegalSection>
    <LegalSection id="data" title="3. Information we collect">
      <LegalDefinitions
        items={[
          {
            term: 'Account and contact',
            description:
              'Name, email, account identifiers, preferences, age or guardian information where applicable, and support messages.',
          },
          {
            term: 'Subscription and billing',
            description:
              'Plan, amount, currency, invoice or transaction reference, payment status, timestamps, renewal status, consent record, and refund history. Payment providers handle payment credentials; we never need your wallet PIN or OTP.',
          },
          {
            term: 'Learning and AI',
            description:
              'Answers, essays, recordings, transcripts, uploaded content, progress, estimated scores, feedback, AI outputs, and feature-usage records.',
          },
          {
            term: 'Device and activity',
            description:
              'IP address, approximate country, browser, device, cookies, security events, page activity, and diagnostics.',
          },
        ]}
      />
    </LegalSection>
    <LegalSection id="use" title="4. Why we use information">
      <LegalList
        items={[
          'Create and secure accounts and provide the requested SaaS features.',
          'Process subscriptions, confirm payment status, apply entitlements, prevent duplicate charges, and handle refunds.',
          'Generate requested AI feedback and measure the associated usage.',
          'Diagnose failures, prevent fraud and abuse, enforce limits, and protect users and the service.',
          'Answer support requests, send essential service messages, comply with law, and establish or defend legal claims.',
          'Improve the service through analytics where consent or another lawful basis applies.',
        ]}
      />
    </LegalSection>
    <LegalSection id="ai" title="5. AI processing">
      <p>
        Content submitted to an AI or speech feature is sent to contracted providers so they can
        produce the requested result. We limit the data to what the feature reasonably needs and
        require providers to process it only for contracted purposes. Do not upload secrets or
        another person’s data unless you have authority to do so.
      </p>
    </LegalSection>
    <LegalSection id="sharing" title="6. Service providers and disclosures">
      <p>
        We share necessary data with database, authentication, hosting, email, analytics, support,
        fraud-prevention, AI, speech, and payment providers. A payment provider processes payment
        credentials under its own privacy notice. We may disclose data when legally required, to
        protect rights and safety, or during a business transfer with appropriate safeguards. We do
        not sell personal data.
      </p>
    </LegalSection>
    <LegalSection id="transfers" title="7. International processing">
      <p>
        Some providers process data outside Bangladesh. Where required, we use contractual,
        organisational, and technical safeguards and transfer only what the service needs.
      </p>
    </LegalSection>
    <LegalSection id="retention" title="8. Retention and security">
      <LegalList
        items={[
          'Subscription, transaction, consent, dispute, and refund evidence is normally kept for at least six years, or longer where law or an active dispute requires it.',
          'Learning content is kept while needed for the account and is deleted or de-identified after a valid deletion request, subject to legal, security, fraud, and dispute records.',
          'Backups may remain for up to 90 days after deletion from active systems.',
          'We use access controls, encryption in transit, monitoring, and least-access practices, but no online system is risk-free.',
        ]}
      />
    </LegalSection>
    <LegalSection id="rights" title="9. Your rights">
      <p>
        Subject to Bangladesh law, you may ask to access, correct, update, or delete your personal
        data; obtain information about its processing; withdraw consent where consent is the basis;
        and object to or complain about certain processing. Some billing, fraud, tax, security, and
        dispute records must be retained. We may verify identity before acting.
      </p>
    </LegalSection>
    <LegalSection id="children" title="10. Children, contact, and updates">
      <p>
        A user under 18 must use the service with parent or legal-guardian permission and
        supervision. We do not knowingly use children’s data for targeted advertising. For privacy
        requests, call <a href="tel:+8801776662444">01776662444</a> or email{' '}
        <a href="mailto:mail@ieltsai.pro">mail@ieltsai.pro</a>. Material changes will be posted with
        a revised date and, where required, additional notice or consent.
      </p>
    </LegalSection>
  </>
);

const EnglishRefund = () => (
  <>
    <LegalSection id="business" title="1. Business identity">
      <BusinessIdentity language="en" />
    </LegalSection>
    <LegalSection id="scope" title="2. Scope and legal rights">
      <p>
        This policy applies to Bangladesh plans purchased from IELTS Ai Pro in BDT. The unused-
        purchase refund below is a voluntary policy. It does not limit a non-waivable remedy under
        Bangladesh law for an incorrect or duplicate charge, non-delivery, or a materially defective
        service.
      </p>
    </LegalSection>
    <LegalSection id="unused" title="3. Seven-day unused-purchase window">
      <p>
        You may request a full refund within seven calendar days after the first activation of a
        paid plan only when the purchase is completely unused. “Unused” means that the account has
        not opened or used a paid-only feature, submitted a paid AI request, consumed any AI credit
        or usage allowance, started a paid test or evaluation, or downloaded paid-only material.
      </p>
      <LegalNote title="Seven days is a request window, not a free trial">
        The voluntary refund right ends immediately when any paid feature or AI credit is used—even
        if that use occurs minutes after purchase and even if the seven-day period has not ended.
      </LegalNote>
    </LegalSection>
    <LegalSection id="used" title="4. When the service has been used">
      <p>
        AI evaluation and other digital SaaS services are delivered immediately and incur computing
        costs when used. Therefore, after any paid usage has been consumed, we do not provide a
        voluntary refund for change of mind, dissatisfaction with AI feedback, unused remaining
        time, or failure to continue using the plan. A customer who uses all included credits is not
        eligible for an unused-purchase refund.
      </p>
      <p>
        The free plan and publicly available product information should be used to evaluate general
        suitability before purchase. AI feedback remains an estimate and does not guarantee an IELTS
        score or result.
      </p>
    </LegalSection>
    <LegalSection id="exceptions" title="5. Billing and service exceptions">
      <p>Paid-feature use does not prevent us from investigating and remedying:</p>
      <LegalList
        items={[
          'a confirmed duplicate or incorrect charge;',
          'payment received but the purchased service was not supplied within the stated delivery time after complete and valid transaction information was available;',
          'a confirmed material platform failure that prevented the core paid service and was not reasonably cured by restored usage, extended access, or another suitable remedy;',
          'an unauthorised transaction reported promptly, subject to provider and legal investigation; or',
          'another refund or remedy required by applicable Bangladesh law.',
        ]}
      />
    </LegalSection>
    <LegalSection id="not-refundable" title="6. Non-refundable situations">
      <LegalNote title="Paid usage means no voluntary refund" tone="warning">
        Any use of a paid feature or AI credit makes the purchase ineligible for the seven-day
        unused-purchase refund. This does not remove rights for duplicate charges, service not
        supplied, or remedies required by Bangladesh law.
      </LegalNote>
      <LegalList
        items={[
          'Any paid feature, AI credit, test, evaluation, chatbot request, or paid-only resource has been used.',
          'The seven-day unused-purchase window has expired.',
          'The request concerns a renewal, repeat purchase, promotional credit, or free entitlement, unless law requires otherwise.',
          'The issue is caused by the user’s device, internet connection, unsupported software, or failure to follow published requirements.',
          'The account was shared, resold, automated, used to bypass limits, or suspended for a material terms violation.',
          'The user expected a guaranteed band score, exam result, admission, or visa outcome.',
        ]}
      />
    </LegalSection>
    <LegalSection id="cancellation" title="7. Subscription cancellation">
      <p>
        Where a plan does not renew automatically, it expires at the end of its access period
        without another charge. Where recurring billing is expressly offered and authorised,
        cancellation stops future renewals and normally leaves access available until the paid
        period ends. Cancellation or account deletion does not itself create a refund for the
        current period.
      </p>
    </LegalSection>
    <LegalSection id="request" title="8. Request, review, and payment timing">
      <p>
        Email <a href="mailto:mail@ieltsai.pro">mail@ieltsai.pro</a> from your account email or call{' '}
        <a href="tel:+8801776662444">01776662444</a>. Include the account email, plan, amount,
        payment date, transaction reference, reason, and relevant evidence. Never send a password,
        PIN, or OTP.
      </p>
      <p>
        We aim to acknowledge a complete request within 72 hours. If approved, we will initiate the
        refund to the original payment method where technically possible within 10 days after all
        required information is complete. Provider processing may take additional time. Access and
        unused entitlements tied to a full refund end when it is approved.
      </p>
    </LegalSection>
    <LegalSection id="disputes" title="9. Usage records and disputes">
      <p>
        We review subscription, access, incident, and feature-usage records to decide eligibility.
        If you believe a record is incorrect, provide the reason and evidence and a person will
        review the dispute. A failed request that produced no usable result should not be treated as
        consumed usage. This process does not restrict a complaint to a payment provider or
        regulator.
      </p>
    </LegalSection>
    <LegalSection id="contact" title="10. Contact">
      <p>
        IELTS Ai Pro is a product of QuantByte Tech. Refund support:{' '}
        <a href="mailto:mail@ieltsai.pro">mail@ieltsai.pro</a> or{' '}
        <a href="tel:+8801776662444">01776662444</a>.
      </p>
    </LegalSection>
  </>
);

const BanglaTerms = () => (
  <>
    <LegalSection id="business" title="১. ব্যবসায়িক পরিচয়">
      <BusinessIdentity language="bn" includeLicence />
    </LegalSection>
    <LegalSection id="scope" title="২. প্রযোজ্যতা ও সম্মতি">
      <p>
        বাংলাদেশে IELTS Ai Pro ব্যবহারকারী এবং বাংলাদেশি টাকায় কোনো প্ল্যান কেনা গ্রাহকদের জন্য এই
        শর্তাবলি প্রযোজ্য।
      </p>
      <p>
        অ্যাকাউন্ট তৈরি, প্ল্যান কেনা বা কোনো পেইড সুবিধা ব্যবহারের মাধ্যমে আপনি এই শর্তাবলি,
        বাংলাদেশ গোপনীয়তা বিজ্ঞপ্তি এবং বাংলাদেশ রিফান্ড ও বাতিলকরণ নীতিতে সম্মতি দিচ্ছেন।
      </p>
    </LegalSection>
    <LegalSection id="service" title="৩. সেবা ও এআই সুবিধা">
      <p>
        IELTS Ai Pro একটি সফটওয়্যার-অ্যাজ-এ-সার্ভিস (SaaS) প্ল্যাটফর্ম। এখানে IELTS প্রস্তুতির
        অনুশীলন, শেখার উপকরণ, অগ্রগতি পর্যবেক্ষণ এবং স্বয়ংক্রিয় ফিডব্যাক দেওয়া হয়। এআই-তৈরি স্কোর,
        সংশোধন, পরামর্শ ও উত্তর শিক্ষামূলক অনুমান; এগুলোতে ভুল থাকতে পারে।
      </p>
      <LegalNote title="এটি অফিসিয়াল IELTS ফল নয়">
        এআই ফিডব্যাক পরীক্ষকের সিদ্ধান্ত, অফিসিয়াল IELTS স্কোর, ভর্তি বা অভিবাসনসংক্রান্ত পরামর্শ
        কিংবা নির্দিষ্ট ফলাফলের নিশ্চয়তা নয়।
      </LegalNote>
    </LegalSection>
    <LegalSection id="accounts" title="৪. অ্যাকাউন্ট ও ব্যবহারকারীর যোগ্যতা">
      <LegalList
        items={[
          'সঠিক তথ্য দিন এবং লগইন তথ্য নিরাপদ রাখুন।',
          'QuantByte Tech লিখিতভাবে অনুমতি না দিলে একটি ব্যক্তিগত অ্যাকাউন্টই ব্যবহার করুন।',
          '১৮ বছরের কম বয়সী ব্যবহারকারীকে পিতা-মাতা বা আইনগত অভিভাবকের অনুমতি ও তত্ত্বাবধানে সেবা ব্যবহার করতে হবে।',
          'অননুমোদিত অ্যাকাউন্ট বা লেনদেনের সন্দেহ হলে দ্রুত আমাদের জানান।',
        ]}
      />
    </LegalSection>
    <LegalSection id="subscriptions" title="৫. প্ল্যান, সাবস্ক্রিপশন ও মূল্য পরিশোধ">
      <p>
        কেনার আগে চেকআউটে প্ল্যান, টাকায় মোট মূল্য, ব্যবহারের মেয়াদ, অন্তর্ভুক্ত সুবিধা ও
        ব্যবহারসীমা, গুরুত্বপূর্ণ সীমাবদ্ধতা এবং সাবস্ক্রিপশন স্বয়ংক্রিয়ভাবে নবায়ন হবে কি
        না—স্পষ্টভাবে দেখানো হবে। চেকআউটে উপলভ্য পেমেন্ট সেবাদাতা দেখানো হয়; তাদের নিজস্ব
        গ্রাহক-শর্তও প্রযোজ্য হতে পারে।
      </p>
      <p>
        গ্রাহকের স্পষ্ট অনুমোদন ছাড়া কোনো পুনরাবৃত্ত চার্জ নেওয়া হবে না। অটো-রিনিউ সুবিধা থাকলে
        চার্জের সময়সূচি ও বাতিলের পদ্ধতি কেনার আগেই জানানো হবে। আগে একবার মূল্য পরিশোধ করেছেন—শুধু এ
        কারণে ভবিষ্যতে স্বয়ংক্রিয় চার্জ নেওয়া হবে না।
      </p>
    </LegalSection>
    <LegalSection id="credits" title="৬. এআই ক্রেডিট ও ন্যায্য ব্যবহার">
      <p>
        এআই ক্রেডিট হলো নির্দিষ্ট প্ল্যান-মেয়াদে নির্ধারিত ডিজিটাল সেবা ব্যবহারের সীমিত অনুমতি। এটি
        টাকা নয়, হস্তান্তর বা নগদে রূপান্তর করা যায় না এবং প্ল্যানে স্পষ্টভাবে উল্লেখ না থাকলে পরের
        মেয়াদে যোগ হয় না। কোনো অনুরোধ প্রক্রিয়া হয়ে ব্যবহারযোগ্য ফল পাওয়া গেলে সাধারণত ক্রেডিট বা
        ব্যবহারসীমা থেকে তা কেটে নেওয়া হয়।
      </p>
      <p>
        স্বয়ংক্রিয়, শেয়ার করা, প্রতারণামূলক, অপব্যবহারমূলক বা প্রযুক্তিগতভাবে ক্ষতিকর ব্যবহার সীমিত
        বা বন্ধ করা হতে পারে। কোনো অনুরোধ ব্যর্থ হয়ে ব্যবহারযোগ্য ফল না দিলে পেইড ব্যবহার কাটা উচিত
        নয়; রেকর্ড ভুল মনে হলে সহায়তা টিমকে জানান।
      </p>
    </LegalSection>
    <LegalSection id="cancellation" title="৭. সাবস্ক্রিপশন বাতিল ও রিফান্ড">
      <p>
        অটো-রিনিউ প্রযোজ্য হলে সাবস্ক্রিপশন বাতিল করলে ভবিষ্যৎ নবায়ন বন্ধ হয়; চলতি মেয়াদের মূল্য
        স্বয়ংক্রিয়ভাবে ফেরত আসে না। পেইড প্রবেশাধিকার বা কোনো পেইড সুবিধা চালু হওয়ার সঙ্গে ডিজিটাল
        সেবা সরবরাহ শুরু হয়। স্বেচ্ছামূলক রিফান্ড কেবল বাংলাদেশ রিফান্ড ও বাতিলকরণ নীতি অনুযায়ী
        পাওয়া যাবে। সাত দিনের সময়সীমা শুধু সম্পূর্ণ অব্যবহৃত ক্রয়ের জন্য; কোনো পেইড সুবিধা বা এআই
        ক্রেডিট ব্যবহার করলেই সেই স্বেচ্ছামূলক রিফান্ডের সুযোগ শেষ হবে।
      </p>
    </LegalSection>
    <LegalSection id="acceptable-use" title="৮. গ্রহণযোগ্য ব্যবহারের নিয়ম">
      <LegalList
        items={[
          'সেবা বা ফিডব্যাক শেয়ার, বিক্রি, স্ক্র্যাপ, বাল্ক ডাউনলোড, রিভার্স ইঞ্জিনিয়ার বা বাণিজ্যিকভাবে পুনর্বিতরণ করবেন না।',
          'অ্যাকাউন্ট, ক্রেডিট, নিরাপত্তা বা পেমেন্ট-নিয়ন্ত্রণ পাশ কাটানোর চেষ্টা করবেন না।',
          'বেআইনি, অপমানজনক, অন্যের অধিকার লঙ্ঘনকারী বা ক্ষতিকর কনটেন্ট আপলোড করবেন না।',
          'এআই ফিডব্যাককে অফিসিয়াল IELTS স্কোর বা পরীক্ষকের রিপোর্ট হিসেবে উপস্থাপন করবেন না।',
        ]}
      />
    </LegalSection>
    <LegalSection id="availability" title="৯. সেবার প্রাপ্যতা ও দায়সীমা">
      <p>
        রক্ষণাবেক্ষণ, মেরামত বা উন্নয়নের জন্য কোনো সুবিধা পরিবর্তন বা সাময়িক বন্ধ করা হতে পারে।
        গুরুত্বপূর্ণ পেইড সেবা সরবরাহ করা না গেলে ব্যবহার ফেরত, মেয়াদ বাড়ানো, যুক্তিসংগত বিকল্প অথবা
        রিফান্ড নীতি ও বাংলাদেশের আইন অনুযায়ী প্রতিকার দেওয়া হতে পারে। আইন যতটুকু অনুমতি দেয়, ততটুকু
        সীমায় আমরা নির্দিষ্ট ব্যান্ড স্কোর, পরীক্ষার ফল, ভর্তি, ভিসা বা নিরবচ্ছিন্ন সেবার নিশ্চয়তা
        দিই না। আইনগতভাবে বাদ দেওয়া যায় না—এমন কোনো অধিকার বা দায় এই শর্তে বাদ পড়ে না।
      </p>
    </LegalSection>
    <LegalSection id="complaints" title="১০. অভিযোগ, প্রযোজ্য আইন ও যোগাযোগ">
      <p>
        প্রযোজ্য ক্ষেত্রে বাংলাদেশের আইন কার্যকর হবে। সহায়তা বা অভিযোগের জন্য{' '}
        <a href="tel:+8801776662444">01776662444</a> নম্বরে কল করুন অথবা{' '}
        <a href="mailto:mail@ieltsai.pro">mail@ieltsai.pro</a>-এ ইমেইল করুন। অ্যাকাউন্ট ইমেইল ও
        প্রাসঙ্গিক অর্ডার বা লেনদেন নম্বর দিন; পাসওয়ার্ড, PIN বা OTP কখনো দেবেন না। সম্পূর্ণ অভিযোগ
        পাওয়ার ৭২ ঘণ্টার মধ্যে প্রাপ্তিস্বীকার জানাতে আমরা সচেষ্ট থাকি।
      </p>
    </LegalSection>
  </>
);

const BanglaPrivacy = () => (
  <>
    <LegalSection id="business" title="১. আপনার তথ্যের জন্য দায়ী প্রতিষ্ঠান">
      <p>
        QuantByte Tech, IELTS Ai Pro পরিচালনা করে এবং এই বিজ্ঞপ্তিতে বর্ণিত তথ্য প্রক্রিয়াকরণের জন্য
        দায়ী।
      </p>
      <BusinessIdentity language="bn" />
    </LegalSection>
    <LegalSection id="scope" title="২. প্রযোজ্যতা">
      <p>
        বাংলাদেশের ব্যবহারকারীদের অ্যাকাউন্ট, সাবস্ক্রিপশন, শেখার কার্যক্রম ও এআই সুবিধাসংক্রান্ত
        ব্যক্তিগত তথ্য IELTS Ai Pro কীভাবে ব্যবহার করে, এই বিজ্ঞপ্তিতে তা ব্যাখ্যা করা হয়েছে। এটি
        সাধারণ গোপনীয়তা নীতির পরিপূরক।
      </p>
    </LegalSection>
    <LegalSection id="data" title="৩. আমরা যেসব তথ্য সংগ্রহ করি">
      <LegalDefinitions
        items={[
          {
            term: 'অ্যাকাউন্ট ও যোগাযোগ',
            description:
              'নাম, ইমেইল, অ্যাকাউন্ট শনাক্তকারী, পছন্দ, প্রযোজ্য ক্ষেত্রে বয়স বা অভিভাবকের তথ্য এবং সহায়তা-সংক্রান্ত বার্তা।',
          },
          {
            term: 'সাবস্ক্রিপশন ও বিলিং',
            description:
              'প্ল্যান, মূল্য, মুদ্রা, ইনভয়েস বা লেনদেন নম্বর, পেমেন্টের অবস্থা, সময়, নবায়নের অবস্থা, সম্মতির রেকর্ড ও রিফান্ডের ইতিহাস। পেমেন্টের গোপন তথ্য সেবাদাতা পরিচালনা করে; আপনার PIN বা OTP আমাদের প্রয়োজন নেই।',
          },
          {
            term: 'শেখা ও এআই',
            description:
              'উত্তর, রচনা, রেকর্ডিং, ট্রান্সক্রিপ্ট, আপলোড করা কনটেন্ট, অগ্রগতি, আনুমানিক স্কোর, ফিডব্যাক, এআই আউটপুট ও সুবিধা ব্যবহারের রেকর্ড।',
          },
          {
            term: 'ডিভাইস ও কার্যকলাপ',
            description:
              'IP ঠিকানা, আনুমানিক দেশ, ব্রাউজার, ডিভাইস, কুকি, নিরাপত্তা ঘটনা, পেজ ব্যবহারের তথ্য ও কারিগরি ত্রুটির তথ্য।',
          },
        ]}
      />
    </LegalSection>
    <LegalSection id="use" title="৪. কেন তথ্য ব্যবহার করি">
      <LegalList
        items={[
          'অ্যাকাউন্ট তৈরি ও নিরাপদ রাখা এবং অনুরোধকৃত SaaS সুবিধা দেওয়া।',
          'সাবস্ক্রিপশন পরিচালনা, পেমেন্টের অবস্থা নিশ্চিত, প্রাপ্য সুবিধা চালু, ডুপ্লিকেট চার্জ প্রতিরোধ এবং রিফান্ড প্রক্রিয়া করা।',
          'আপনার অনুরোধে এআই ফিডব্যাক তৈরি এবং সংশ্লিষ্ট ব্যবহার হিসাব করা।',
          'ত্রুটি শনাক্ত, প্রতারণা ও অপব্যবহার প্রতিরোধ, ব্যবহারসীমা কার্যকর এবং ব্যবহারকারী ও সেবা সুরক্ষিত রাখা।',
          'সহায়তার অনুরোধের উত্তর, জরুরি সেবা-বার্তা, আইন পালন এবং আইনগত দাবি প্রতিষ্ঠা বা প্রতিরক্ষা করা।',
          'সম্মতি বা অন্য বৈধ ভিত্তি থাকলে সেবা উন্নয়নে অ্যানালিটিক্স ব্যবহার করা।',
        ]}
      />
    </LegalSection>
    <LegalSection id="ai" title="৫. এআই-ভিত্তিক তথ্য প্রক্রিয়াকরণ">
      <p>
        এআই বা স্পিচ সুবিধায় দেওয়া কনটেন্ট অনুরোধকৃত ফল তৈরির জন্য চুক্তিবদ্ধ সেবাদাতার কাছে পাঠানো
        হয়। সংশ্লিষ্ট সুবিধার জন্য যুক্তিসংগতভাবে যতটুকু প্রয়োজন, আমরা তথ্য ততটুকুতেই সীমিত রাখি এবং
        সেবাদাতাকে কেবল চুক্তিবদ্ধ উদ্দেশ্যে তা ব্যবহারের নির্দেশ দিই। অনুমতি ছাড়া গোপন তথ্য বা অন্য
        ব্যক্তির তথ্য আপলোড করবেন না।
      </p>
    </LegalSection>
    <LegalSection id="sharing" title="৬. সেবাদাতা ও তথ্য প্রকাশ">
      <p>
        ডাটাবেস, লগইন, হোস্টিং, ইমেইল, অ্যানালিটিক্স, গ্রাহক সহায়তা, প্রতারণা প্রতিরোধ, এআই, স্পিচ ও
        পেমেন্ট সেবাদাতাকে কাজের জন্য প্রয়োজনীয় তথ্য দেওয়া হয়। পেমেন্ট সেবাদাতা তার নিজস্ব গোপনীয়তা
        নীতি অনুযায়ী পেমেন্টের গোপন তথ্য পরিচালনা করে। আইনগত বাধ্যবাধকতা, অধিকার ও নিরাপত্তা রক্ষা,
        অথবা উপযুক্ত সুরক্ষাসহ ব্যবসা হস্তান্তরের প্রয়োজনে তথ্য প্রকাশ হতে পারে। আমরা ব্যক্তিগত তথ্য
        বিক্রি করি না।
      </p>
    </LegalSection>
    <LegalSection id="transfers" title="৭. বাংলাদেশের বাইরে তথ্য প্রক্রিয়াকরণ">
      <p>
        কিছু সেবাদাতা বাংলাদেশের বাইরে তথ্য প্রক্রিয়া করে। প্রযোজ্য ক্ষেত্রে আমরা চুক্তিভিত্তিক,
        সাংগঠনিক ও প্রযুক্তিগত সুরক্ষা ব্যবহার করি এবং প্রয়োজনীয় তথ্যেই স্থানান্তর সীমিত রাখি।
      </p>
    </LegalSection>
    <LegalSection id="retention" title="৮. তথ্য সংরক্ষণ ও নিরাপত্তা">
      <LegalList
        items={[
          'সাবস্ক্রিপশন, লেনদেন, সম্মতি, বিরোধ ও রিফান্ডের প্রমাণ সাধারণত কমপক্ষে ছয় বছর রাখা হয়; আইন বা চলমান বিরোধে প্রয়োজন হলে আরও বেশি সময় রাখা হতে পারে।',
          'অ্যাকাউন্টের জন্য প্রয়োজন থাকা পর্যন্ত শেখার কনটেন্ট রাখা হয়। বৈধ মুছে ফেলার অনুরোধের পর আইন, নিরাপত্তা, প্রতারণা ও বিরোধের জন্য প্রয়োজনীয় রেকর্ড ছাড়া তা মুছে ফেলা বা পরিচয়বিহীন করা হয়।',
          'সক্রিয় সিস্টেম থেকে মুছে ফেলার পর ব্যাকআপে সর্বোচ্চ ৯০ দিন তথ্য থাকতে পারে।',
          'আমরা প্রবেশ নিয়ন্ত্রণ, পরিবহনের সময় এনক্রিপশন, নজরদারি এবং প্রয়োজনসীমিত প্রবেশাধিকার ব্যবহার করি; তবে কোনো অনলাইন ব্যবস্থা সম্পূর্ণ ঝুঁকিমুক্ত নয়।',
        ]}
      />
    </LegalSection>
    <LegalSection id="rights" title="৯. আপনার অধিকার">
      <p>
        বাংলাদেশের আইনসাপেক্ষে আপনি ব্যক্তিগত তথ্য দেখা, সংশোধন, হালনাগাদ বা মুছে ফেলা; তথ্য কীভাবে
        প্রক্রিয়া হয় তা জানা; সম্মতিনির্ভর প্রক্রিয়ায় সম্মতি প্রত্যাহার; এবং নির্দিষ্ট প্রক্রিয়াকরণে
        আপত্তি বা অভিযোগ করতে পারেন। বিলিং, প্রতারণা, কর, নিরাপত্তা ও বিরোধের কিছু রেকর্ড সংরক্ষণ
        করতে হয়। অনুরোধ কার্যকর করার আগে পরিচয় যাচাই করা হতে পারে।
      </p>
    </LegalSection>
    <LegalSection id="children" title="১০. অপ্রাপ্তবয়স্ক ব্যবহারকারী, যোগাযোগ ও পরিবর্তন">
      <p>
        ১৮ বছরের কম বয়সী ব্যবহারকারীকে পিতা-মাতা বা আইনগত অভিভাবকের অনুমতি ও তত্ত্বাবধানে সেবা
        ব্যবহার করতে হবে। অপ্রাপ্তবয়স্কদের তথ্য জেনে-শুনে লক্ষ্যভিত্তিক বিজ্ঞাপনে ব্যবহার করি না।
        গোপনীয়তাসংক্রান্ত অনুরোধে <a href="tel:+8801776662444">01776662444</a> নম্বরে কল করুন অথবা{' '}
        <a href="mailto:mail@ieltsai.pro">mail@ieltsai.pro</a>-এ ইমেইল করুন। গুরুত্বপূর্ণ পরিবর্তন
        নতুন তারিখসহ এবং প্রয়োজন হলে অতিরিক্ত নোটিশ বা সম্মতি নিয়ে প্রকাশ করা হবে।
      </p>
    </LegalSection>
  </>
);

const BanglaRefund = () => (
  <>
    <LegalSection id="business" title="১. ব্যবসায়িক পরিচয়">
      <BusinessIdentity language="bn" />
    </LegalSection>
    <LegalSection id="scope" title="২. প্রযোজ্যতা ও আইনগত অধিকার">
      <p>
        বাংলাদেশি টাকায় IELTS Ai Pro থেকে কেনা প্ল্যানের ক্ষেত্রে এই নীতি প্রযোজ্য। অব্যবহৃত ক্রয়ের
        জন্য নিচে দেওয়া রিফান্ড একটি স্বেচ্ছামূলক সুবিধা। ভুল বা ডুপ্লিকেট চার্জ, সেবা সরবরাহ না
        হওয়া অথবা গুরুতর ত্রুটিপূর্ণ সেবার ক্ষেত্রে বাংলাদেশের আইন অনুযায়ী যে প্রতিকার বাদ দেওয়া যায়
        না, এই নীতি তা সীমিত করে না।
      </p>
    </LegalSection>
    <LegalSection id="unused" title="৩. অব্যবহৃত ক্রয়ের জন্য সাত দিনের সময়সীমা">
      <p>
        প্রথম পেইড প্ল্যান চালু হওয়ার সাত ক্যালেন্ডার দিনের মধ্যে পূর্ণ রিফান্ডের আবেদন করা যাবে—তবে
        শুধু তখনই, যখন কেনা সেবা একেবারেই ব্যবহার করা হয়নি। “অব্যবহৃত” বলতে বোঝায়: কোনো পেইড-অনলি
        সুবিধা খোলা বা ব্যবহার করা হয়নি, পেইড এআই অনুরোধ পাঠানো হয়নি, কোনো এআই ক্রেডিট বা
        ব্যবহারসীমা খরচ হয়নি, পেইড টেস্ট বা মূল্যায়ন শুরু হয়নি এবং পেইড-অনলি উপকরণ ডাউনলোড করা হয়নি।
      </p>
      <LegalNote title="সাত দিন আবেদন করার সময়—বিনামূল্যের ট্রায়াল নয়">
        কোনো পেইড সুবিধা বা এআই ক্রেডিট ব্যবহার করার সঙ্গে সঙ্গে স্বেচ্ছামূলক রিফান্ডের সুযোগ শেষ
        হয়ে যাবে—কেনার কয়েক মিনিটের মধ্যেও ব্যবহার করা হলে এবং সাত দিন শেষ না হলেও একই নিয়ম
        প্রযোজ্য।
      </LegalNote>
    </LegalSection>
    <LegalSection id="used" title="৪. সেবা ব্যবহার করা হলে">
      <p>
        এআই মূল্যায়ন ও অন্যান্য ডিজিটাল SaaS সেবা ব্যবহার করার সঙ্গে সঙ্গে সরবরাহ হয় এবং কম্পিউটিং
        ব্যয় সৃষ্টি করে। তাই যেকোনো পেইড ব্যবহার সম্পন্ন হওয়ার পর মত পরিবর্তন, এআই ফিডব্যাকে
        অসন্তোষ, প্ল্যানের বাকি সময় ব্যবহার না করা বা নিয়মিত ব্যবহার চালিয়ে না যাওয়ার কারণে
        স্বেচ্ছামূলক রিফান্ড দেওয়া হয় না। সব অন্তর্ভুক্ত ক্রেডিট ব্যবহারকারী অব্যবহৃত ক্রয়ের রিফান্ড
        পাবেন না।
      </p>
      <p>
        কেনার আগে সাধারণ উপযোগিতা যাচাই করতে বিনামূল্যের প্ল্যান ও প্রকাশিত পণ্যের তথ্য ব্যবহার
        করুন। এআই ফিডব্যাক একটি অনুমান; এটি কোনো IELTS স্কোর বা ফলাফলের নিশ্চয়তা নয়।
      </p>
    </LegalSection>
    <LegalSection id="exceptions" title="৫. বিলিং ও সেবাজনিত ব্যতিক্রম">
      <p>পেইড সুবিধা ব্যবহার করা হলেও নিচের বিষয়গুলো আমরা তদন্ত করে উপযুক্ত প্রতিকার দেব:</p>
      <LegalList
        items={[
          'যাচাইকৃত ডুপ্লিকেট বা ভুল চার্জ;',
          'সম্পূর্ণ ও সঠিক লেনদেন তথ্য পাওয়ার পরও ঘোষিত সময়ের মধ্যে কেনা সেবা সরবরাহ না হওয়া;',
          'মূল পেইড সেবা ব্যবহার অসম্ভব করে দেওয়া নিশ্চিত গুরুতর প্ল্যাটফর্ম-ত্রুটি, যা ব্যবহার ফেরত, মেয়াদ বাড়ানো বা অন্য উপযুক্ত ব্যবস্থায় যুক্তিসংগতভাবে সমাধান করা যায়নি;',
          'দ্রুত জানানো অননুমোদিত লেনদেন—পেমেন্ট সেবাদাতা ও আইনগত তদন্তসাপেক্ষে; অথবা',
          'বাংলাদেশের প্রযোজ্য আইন অনুযায়ী বাধ্যতামূলক অন্য কোনো রিফান্ড বা প্রতিকার।',
        ]}
      />
    </LegalSection>
    <LegalSection id="not-refundable" title="৬. যেসব ক্ষেত্রে রিফান্ড প্রযোজ্য নয়">
      <LegalNote title="পেইড সেবা ব্যবহার করলে স্বেচ্ছামূলক রিফান্ড পাওয়া যাবে না" tone="warning">
        কোনো পেইড সুবিধা বা এআই ক্রেডিট একবারও ব্যবহার করলে সাত দিনের অব্যবহৃত-ক্রয় রিফান্ড আর
        প্রযোজ্য হবে না। তবে ডুপ্লিকেট চার্জ, সেবা সরবরাহ না হওয়া বা বাংলাদেশের আইন অনুযায়ী প্রাপ্য
        প্রতিকারের অধিকার এতে বাতিল হয় না।
      </LegalNote>
      <LegalList
        items={[
          'কোনো পেইড সুবিধা, এআই ক্রেডিট, টেস্ট, মূল্যায়ন, চ্যাটবট অনুরোধ বা পেইড-অনলি উপকরণ ব্যবহার করা হয়েছে।',
          'অব্যবহৃত ক্রয়ের সাত দিনের সময়সীমা শেষ হয়েছে।',
          'আইনে বাধ্যতামূলক না হলে আবেদনটি নবায়ন, পুনরায় ক্রয়, প্রচারমূলক ক্রেডিট বা বিনামূল্যের সুবিধাসংক্রান্ত।',
          'সমস্যা ব্যবহারকারীর ডিভাইস, ইন্টারনেট, অসমর্থিত সফটওয়্যার বা প্রকাশিত নির্দেশনা না মানার কারণে হয়েছে।',
          'অ্যাকাউন্ট শেয়ার বা বিক্রি, স্বয়ংক্রিয় ব্যবহার, ব্যবহারসীমা পাশ কাটানো অথবা গুরুতর শর্তভঙ্গের কারণে স্থগিত হয়েছে।',
          'ব্যবহারকারী নিশ্চিত ব্যান্ড স্কোর, পরীক্ষার ফল, ভর্তি বা ভিসার ফলাফল আশা করেছিলেন।',
        ]}
      />
    </LegalSection>
    <LegalSection id="cancellation" title="৭. সাবস্ক্রিপশন বাতিল">
      <p>
        কোনো প্ল্যান অটো-রিনিউ না হলে মেয়াদ শেষে সেটি শেষ হবে এবং আবার চার্জ নেওয়া হবে না।
        পুনরাবৃত্ত বিলিং স্পষ্টভাবে প্রস্তাব ও অনুমোদিত হলে বাতিল করার মাধ্যমে ভবিষ্যৎ নবায়ন বন্ধ
        করা যাবে এবং সাধারণত চলতি পরিশোধিত মেয়াদ শেষ হওয়া পর্যন্ত প্রবেশাধিকার থাকবে। সাবস্ক্রিপশন
        বাতিল বা অ্যাকাউন্ট মুছে ফেললেই চলতি মেয়াদের মূল্য ফেরত পাওয়ার অধিকার তৈরি হয় না।
      </p>
    </LegalSection>
    <LegalSection id="request" title="৮. আবেদন, যাচাই ও রিফান্ডের সময়">
      <p>
        অ্যাকাউন্ট ইমেইল থেকে <a href="mailto:mail@ieltsai.pro">mail@ieltsai.pro</a>-এ ইমেইল করুন
        অথবা <a href="tel:+8801776662444">01776662444</a> নম্বরে কল করুন। অ্যাকাউন্ট ইমেইল, প্ল্যান,
        মূল্য, পেমেন্টের তারিখ, লেনদেন নম্বর, কারণ ও প্রাসঙ্গিক প্রমাণ দিন। পাসওয়ার্ড, PIN বা OTP
        কখনো দেবেন না।
      </p>
      <p>
        সম্পূর্ণ আবেদন পাওয়ার ৭২ ঘণ্টার মধ্যে প্রাপ্তিস্বীকার জানাতে আমরা সচেষ্ট থাকি। রিফান্ড
        অনুমোদিত হলে প্রয়োজনীয় সব তথ্য সম্পূর্ণ হওয়ার পর ১০ দিনের মধ্যে প্রযুক্তিগতভাবে সম্ভব হলে
        মূল পেমেন্ট মাধ্যমে রিফান্ড শুরু করা হবে। পেমেন্ট সেবাদাতার অতিরিক্ত সময় লাগতে পারে। পূর্ণ
        রিফান্ড অনুমোদিত হলে সংশ্লিষ্ট প্রবেশাধিকার ও অব্যবহৃত সুবিধা শেষ হবে।
      </p>
    </LegalSection>
    <LegalSection id="disputes" title="৯. ব্যবহারের রেকর্ড ও আপত্তি">
      <p>
        রিফান্ডের যোগ্যতা নির্ধারণে সাবস্ক্রিপশন, প্রবেশাধিকার, সেবা-ত্রুটি ও সুবিধা ব্যবহারের
        রেকর্ড পর্যালোচনা করা হয়। কোনো রেকর্ড ভুল মনে হলে কারণ ও প্রমাণ দিন; একজন দায়িত্বপ্রাপ্ত
        ব্যক্তি তা পর্যালোচনা করবেন। ব্যবহারযোগ্য ফল না দেওয়া ব্যর্থ অনুরোধকে খরচ হওয়া ব্যবহার
        হিসেবে ধরা উচিত নয়। এই প্রক্রিয়া পেমেন্ট সেবাদাতা বা নিয়ন্ত্রক সংস্থায় অভিযোগের অধিকার সীমিত
        করে না।
      </p>
    </LegalSection>
    <LegalSection id="contact" title="১০. যোগাযোগ">
      <p>
        IELTS Ai Pro, QuantByte Tech-এর একটি পণ্য। রিফান্ড-সংক্রান্ত সহায়তা:{' '}
        <a href="mailto:mail@ieltsai.pro">mail@ieltsai.pro</a> অথবা{' '}
        <a href="tel:+8801776662444">01776662444</a>।
      </p>
    </LegalSection>
  </>
);

const CONTENT = {
  en: { terms: EnglishTerms, privacy: EnglishPrivacy, refund: EnglishRefund },
  bn: { terms: BanglaTerms, privacy: BanglaPrivacy, refund: BanglaRefund },
};

const META = {
  en: {
    terms: {
      title: 'Bangladesh Terms & Conditions',
      description: 'Terms for Bangladesh subscriptions, AI credits, billing, and account use.',
      summary:
        'These Bangladesh terms explain the SaaS service, subscriptions, AI credits, cancellation, customer responsibilities, and complaint process.',
    },
    privacy: {
      title: 'Bangladesh Privacy Notice',
      description:
        'How QuantByte Tech handles subscription, account, learning, and AI data for IELTS Ai Pro.',
      summary:
        'This notice explains what IELTS Ai Pro collects, why it is used, who processes it, how long it is kept, and the rights available to Bangladesh users.',
    },
    refund: {
      title: 'Bangladesh Refund & Cancellation Policy',
      description:
        'Refund rules for IELTS Ai Pro subscriptions and consumed AI services in Bangladesh.',
      summary:
        'An unused first purchase may be reviewed within seven days. Any paid-feature or AI-credit use ends that voluntary refund option, while billing errors and legal remedies remain protected.',
    },
  },
  bn: {
    terms: {
      title: 'বাংলাদেশের জন্য সেবার শর্তাবলি',
      description: 'বাংলাদেশি সাবস্ক্রিপশন, এআই ক্রেডিট, বিলিং ও অ্যাকাউন্ট ব্যবহারের শর্তাবলি।',
      summary:
        'এই নথিতে SaaS সেবা, সাবস্ক্রিপশন, এআই ক্রেডিট, বাতিলকরণ, ব্যবহারকারীর দায়িত্ব এবং অভিযোগের পদ্ধতি ব্যাখ্যা করা হয়েছে।',
    },
    privacy: {
      title: 'বাংলাদেশ গোপনীয়তা বিজ্ঞপ্তি',
      description:
        'IELTS Ai Pro-এর সাবস্ক্রিপশন, অ্যাকাউন্ট, শেখা ও এআই-সংক্রান্ত তথ্য QuantByte Tech কীভাবে পরিচালনা করে।',
      summary:
        'IELTS Ai Pro কী তথ্য সংগ্রহ করে, কেন ব্যবহার করে, কারা প্রক্রিয়া করে, কত দিন সংরক্ষণ করে এবং বাংলাদেশের ব্যবহারকারীর কী অধিকার আছে—এখানে তা ব্যাখ্যা করা হয়েছে।',
    },
    refund: {
      title: 'বাংলাদেশ রিফান্ড ও সাবস্ক্রিপশন বাতিল নীতি',
      description: 'বাংলাদেশে IELTS Ai Pro সাবস্ক্রিপশন ও ব্যবহৃত এআই সেবার রিফান্ডের নিয়ম।',
      summary:
        'সম্পূর্ণ অব্যবহৃত প্রথম ক্রয়ের জন্য সাত দিনের মধ্যে আবেদন করা যায়। কোনো পেইড সুবিধা বা এআই ক্রেডিট ব্যবহার করলেই সেই স্বেচ্ছামূলক রিফান্ডের সুযোগ শেষ হবে; তবে বিলিং ত্রুটি ও আইনগত অধিকার অক্ষুণ্ন থাকবে।',
    },
  },
};

export default function BangladeshLegalPage({ documentType, language = 'en' }) {
  const type = ['terms', 'privacy', 'refund'].includes(documentType) ? documentType : 'terms';
  const lang = language === 'bn' ? 'bn' : 'en';
  const [country, setCountry] = React.useState(null);
  const meta = META[lang][type];
  const Content = CONTENT[lang][type];

  React.useEffect(() => {
    let cancelled = false;
    detectLocation()
      .then((detectedCountry) => {
        if (!cancelled) setCountry((detectedCountry || '').toUpperCase());
      })
      .catch(() => {
        if (!cancelled) setCountry('');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (country === null) {
    return (
      <main className="min-h-screen bg-[#fcfdff] px-5 pt-28 text-center dark:bg-[#08080a]">
        <p role="status" className="text-sm text-muted-foreground">
          Checking regional availability…
        </p>
      </main>
    );
  }

  if (country !== 'BD') {
    return <Navigate to={GLOBAL_ROUTES[type]} replace />;
  }

  return (
    <>
      <DocumentHead
        title={`${meta.title} | IELTS Ai Pro`}
        description={meta.description}
        noIndex
        noFollow
      />
      <LegalPageLayout
        title={meta.title}
        updatedAt={LAST_UPDATED[lang]}
        summary={meta.summary}
        sections={getSections(type, lang)}
        eyebrow={lang === 'bn' ? 'বাংলাদেশের আইনগত নথি' : 'Bangladesh legal'}
        updatedLabel={lang === 'bn' ? 'সর্বশেষ হালনাগাদ' : 'Last updated'}
        contentsLabel={lang === 'bn' ? 'এই পাতায় যা আছে' : 'On this page'}
        documentLang={lang}
        languageLinks={
          country === 'BD'
            ? [
                { href: ROUTES[type].en, label: 'English', lang: 'en', active: lang === 'en' },
                { href: ROUTES[type].bn, label: 'বাংলা', lang: 'bn', active: lang === 'bn' },
              ]
            : []
        }
      >
        <Content />
      </LegalPageLayout>
    </>
  );
}
