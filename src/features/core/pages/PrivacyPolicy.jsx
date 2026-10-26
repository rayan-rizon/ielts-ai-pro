import React from 'react';
import DocumentHead from '@/components/shared/DocumentHead';
import {
  LegalPageLayout,
  LegalSection,
  LegalList,
  LegalDefinitions,
  LegalNote,
  LegalSubheading,
  LegalTable,
} from '@/features/core/components/legal/LegalPageLayout';

const LAST_UPDATED = 'September 23, 2026';

const SECTIONS = [
  { id: 'information-collection', title: 'Information collection' },
  { id: 'lawful-basis', title: 'Lawful basis for processing' },
  { id: 'data-we-process', title: 'Data we process' },
  { id: 'security', title: 'Security and encryption' },
  { id: 'your-rights', title: 'Your rights' },
  { id: 'account-deletion', title: 'Account deletion' },
  { id: 'breach-notification', title: 'Breach notification' },
  { id: 'international-transfers', title: 'International transfers' },
  { id: 'retention', title: 'Data retention' },
  { id: 'california', title: 'California residents' },
  { id: 'consent', title: 'Your consent' },
  { id: 'contact', title: 'Contact' },
];

export default function PrivacyPolicy() {
  return (
    <>
      <DocumentHead
        title="Privacy Policy & Data Security | IELTS Ai Pro"
        description="Read the IELTS Ai Pro privacy policy to understand how we collect, use, and protect your personal data in compliance with GDPR and CCPA regulations."
        canonicalUrl="https://www.ieltsai.pro/privacy"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Privacy Policy - IELTS Ai Pro',
          description:
            'GDPR and CCPA compliant privacy policy for IELTS Ai Pro AI-powered IELTS preparation platform.',
          url: 'https://www.ieltsai.pro/privacy',
          publisher: {
            '@type': 'Organization',
            name: 'IELTS Ai Pro',
          },
        }}
      />

      <LegalPageLayout
        title="Privacy Policy"
        updatedAt={LAST_UPDATED}
        summary="This policy explains how IELTS Ai Pro collects, uses, protects, and shares your personal information, in compliance with the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA)."
        sections={SECTIONS}
      >
        <LegalSection id="information-collection" title="Information collection">
          <p>
            We collect information from you when you register on our site, subscribe to our
            newsletter, respond to a survey, or fill out a form. When ordering or registering, you
            may be asked to provide:
          </p>
          <LegalList
            items={[
              'Name and email address',
              'IELTS test goals and target scores',
              'Test performance data and answers',
              'Usage analytics and interaction patterns',
              'Payment information (processed securely via Stripe)',
            ]}
          />
        </LegalSection>

        <LegalSection id="lawful-basis" title="Lawful basis for processing (GDPR Article 6)">
          <p>We process your personal data under the following legal bases:</p>
          <LegalDefinitions
            items={[
              {
                term: 'Contractual necessity',
                description:
                  'To provide you with our IELTS preparation services, process your test submissions, and deliver AI-powered feedback.',
              },
              {
                term: 'Legitimate interest',
                description:
                  'To improve our services, analyze usage patterns, and enhance user experience while maintaining appropriate safeguards.',
              },
              {
                term: 'Consent',
                description:
                  'For marketing communications and non-essential analytics cookies. You may withdraw consent at any time.',
              },
              {
                term: 'Legal obligation',
                description:
                  'To comply with applicable laws, such as tax regulations for paid subscriptions.',
              },
            ]}
          />
        </LegalSection>

        <LegalSection id="data-we-process" title="Data we process">
          <p>We process the following categories of personal data:</p>
          <LegalDefinitions
            items={[
              {
                term: 'Account data',
                description: 'Email, username, profile picture, subscription status.',
              },
              {
                term: 'Performance data',
                description: 'Test scores, answers, AI feedback, learning progress.',
              },
              {
                term: 'Technical data',
                description: 'IP address, browser type, device info, usage logs.',
              },
              {
                term: 'Payment records',
                description:
                  'Plan, amount, currency, payment method, transaction reference, refund and dispute history. For bKash or Nagad payments, the sending wallet number. Card details are handled by Stripe and never reach us.',
              },
              {
                term: 'AI usage records',
                description:
                  'Which AI feature ran, when, whether it succeeded, and its processing cost. Used to enforce plan limits, keep the service reliable, and check refund eligibility.',
              },
              {
                term: 'Consent records',
                description: 'Cookie preferences, marketing opt-ins, timestamps.',
              },
            ]}
          />
        </LegalSection>

        <LegalSection id="security" title="Data security and encryption">
          <p>We implement industry-standard security measures:</p>
          <LegalDefinitions
            items={[
              {
                term: 'Encryption in transit',
                description: 'All data transmitted via TLS 1.3 (HTTPS).',
              },
              {
                term: 'Encryption at rest',
                description: 'Database encrypted using AES-256.',
              },
              {
                term: 'Access controls',
                description:
                  'Row-Level Security (RLS) ensures users can only access their own data.',
              },
              {
                term: 'Secure authentication',
                description: 'JWT-based authentication with automatic token refresh.',
              },
              {
                term: 'Payment security',
                description: 'All payments processed via Stripe (PCI DSS compliant).',
              },
              {
                term: 'CSRF protection',
                description: 'Cross-site request forgery prevention on all API endpoints.',
              },
            ]}
          />
        </LegalSection>

        <LegalSection id="your-rights" title="Your rights (GDPR and CCPA)">
          <p>You have the following rights regarding your personal data:</p>
          <LegalDefinitions
            items={[
              {
                term: 'Right to access',
                description: 'Download all your data via Settings → Privacy → Download My Data.',
              },
              {
                term: 'Right to rectification',
                description: 'Update your profile information at any time in Settings.',
              },
              {
                term: 'Right to erasure',
                description:
                  'Delete your account permanently via Settings → Account → Delete Account.',
              },
              {
                term: 'Right to data portability',
                description: 'Export your data in machine-readable JSON format.',
              },
              {
                term: 'Right to object (CCPA)',
                description: 'Opt out of data selling. We do not sell your data.',
              },
            ]}
          />
        </LegalSection>

        <LegalSection id="account-deletion" title="Account deletion and data wiping">
          <p>When you delete your account, the following data is permanently removed:</p>
          <LegalList
            items={[
              'Your user profile and authentication credentials',
              'All test sessions, scores, and performance history',
              'AI feedback and writing/speaking submissions',
              'Vocabulary lists and learning progress',
              'Achievement records and gamification data',
              'Consent history and preference records',
            ]}
          />
          <LegalNote title="Account deletion is permanent and irreversible">
            <p>
              All data is deleted within 30 days, though some anonymized usage statistics may be
              retained for service improvement. Backup copies are purged within 90 days per our
              retention schedule.
            </p>
          </LegalNote>
          <p>
            Payment, refund, and dispute records are the exception: they are detached from the
            deleted account but kept until six months after the payment, so that refunds,
            chargebacks, and fraud checks can still be handled. They are then deleted.
          </p>
        </LegalSection>

        <LegalSection id="breach-notification" title="Data breach notification policy">
          <p>
            In compliance with GDPR Articles 33–34, we maintain a comprehensive incident response
            plan.
          </p>
          <LegalSubheading>72-hour notification</LegalSubheading>
          <p>
            In the event of a personal data breach, we will notify the relevant supervisory
            authority within 72 hours of becoming aware of the breach, unless the breach is unlikely
            to result in a risk to individuals&rsquo; rights and freedoms.
          </p>
          <LegalSubheading>User notification</LegalSubheading>
          <p>
            If a breach is likely to result in high risk to your rights and freedoms, we will
            communicate the breach to you directly via email without undue delay, including:
          </p>
          <LegalList
            items={[
              'Nature of the breach and data affected',
              'Contact details of our data protection team',
              'Likely consequences and mitigation measures',
              'Steps you can take to protect yourself',
            ]}
          />
          <LegalSubheading>Incident response team</LegalSubheading>
          <p>
            Our security team continuously monitors for potential breaches. All incidents are
            documented, investigated, and remediated according to our incident response procedures.
          </p>
        </LegalSection>

        <LegalSection id="international-transfers" title="International data transfers">
          <p>Your data may be processed in the following locations:</p>
          <LegalDefinitions
            items={[
              { term: 'Supabase', description: 'Database and authentication (US/EU regions).' },
              {
                term: 'Cloudflare',
                description: 'Website hosting and global content delivery network.',
              },
              { term: 'Stripe', description: 'Payment processing (PCI DSS compliant, EU/US).' },
              {
                term: 'Google',
                description: 'Gemini AI feedback and Text-to-Speech examiner voices (US).',
              },
              {
                term: 'OpenRouter',
                description:
                  'Routes AI feedback requests to model providers such as OpenAI, DeepSeek, and Z.ai (US).',
              },
              { term: 'DeepSeek', description: 'AI feedback and learning-plan generation.' },
              {
                term: 'Cloudflare',
                description:
                  'Speech transcription (Workers AI) and audio file storage (R2), global.',
              },
              {
                term: 'Microsoft Azure',
                description: 'Pronunciation assessment of speaking recordings.',
              },
              { term: 'Resend', description: 'Account and service email delivery (US).' },
            ]}
          />
          <p>
            For transfers outside the EEA, we rely on Standard Contractual Clauses (SCCs) and ensure
            adequate safeguards are in place to protect your data.
          </p>
        </LegalSection>

        <LegalSection id="retention" title="Data retention">
          <p>We retain your data for the following periods:</p>
          <LegalTable
            caption="Data retention periods by data type"
            columns={['Data type', 'Retention period']}
            rows={[
              ['Account and profile data', 'Until account deletion + 30 days'],
              ['Test performance data', 'Until account deletion'],
              [
                'Payment, refund, and dispute records',
                'Up to 6 months from the payment, including after account deletion',
              ],
              ['AI usage records', 'Up to 6 months, or until account deletion if sooner'],
              [
                'First payment date and refund count',
                'Until account deletion (so the 7-day refund applies only to a first purchase)',
              ],
              ['Consent records', 'Until account deletion + 3 years'],
              ['Security logs', '90 days'],
              ['Backup data', '90 days after deletion'],
            ]}
          />
        </LegalSection>

        <LegalSection id="california" title="California residents (CCPA)">
          <p>
            If you are a California resident, you have additional rights under the California
            Consumer Privacy Act:
          </p>
          <LegalDefinitions
            items={[
              {
                term: 'Do not sell',
                description: 'We do not sell your personal information to third parties.',
              },
              {
                term: 'Right to know',
                description: 'Request disclosure of data collected, used, and shared.',
              },
              {
                term: 'Right to delete',
                description: 'Request deletion of your personal information.',
              },
              {
                term: 'Non-discrimination',
                description: 'We will not discriminate against you for exercising your rights.',
              },
            ]}
          />
        </LegalSection>

        <LegalSection id="consent" title="Your consent">
          <p>
            By using our site, you consent to this privacy policy. You may withdraw consent for
            non-essential processing at any time through Settings → Privacy, or by contacting us
            directly.
          </p>
        </LegalSection>

        <LegalSection id="contact" title="Contact and Data Protection Officer">
          <p>For any privacy-related inquiries or to exercise your rights, contact us:</p>
          <LegalDefinitions
            items={[
              {
                term: 'General inquiries',
                description: (
                  <a className="text-primary hover:underline" href="mailto:mail@ieltsai.pro">
                    mail@ieltsai.pro
                  </a>
                ),
              },
              {
                term: 'Data Protection Officer',
                description: (
                  <a className="text-primary hover:underline" href="mailto:mail@ieltsai.pro">
                    mail@ieltsai.pro
                  </a>
                ),
              },
            ]}
          />
          <p>
            We will respond to all privacy requests within 30 days. If you are unsatisfied with our
            response, you have the right to lodge a complaint with your local data protection
            authority.
          </p>
        </LegalSection>
      </LegalPageLayout>
    </>
  );
}
