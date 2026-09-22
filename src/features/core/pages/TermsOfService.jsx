import React from 'react';
import { Link } from 'react-router-dom';
import DocumentHead from '@/components/shared/DocumentHead';
import {
  LegalPageLayout,
  LegalSection,
  LegalList,
  LegalDefinitions,
  LegalNote,
} from '@/features/core/components/legal/LegalPageLayout';

const LAST_UPDATED = 'September 22, 2026';

const SECTIONS = [
  { id: 'acceptance', title: 'Acceptance of terms' },
  { id: 'accounts', title: 'Your account' },
  { id: 'use-license', title: 'Use license' },
  { id: 'acceptable-use', title: 'Acceptable use' },
  { id: 'ai-feedback', title: 'AI-generated feedback' },
  { id: 'subscriptions', title: 'Subscriptions and billing' },
  { id: 'disclaimer', title: 'Disclaimer' },
  { id: 'limitations', title: 'Limitations of liability' },
  { id: 'revisions', title: 'Accuracy of materials' },
  { id: 'termination', title: 'Termination' },
  { id: 'changes', title: 'Changes to these terms' },
  { id: 'contact', title: 'Contact' },
];

export default function TermsOfService() {
  return (
    <>
      <DocumentHead
        title="Terms of Service & Usage Policy | IELTS Ai Pro"
        description="Review the IELTS Ai Pro terms of service: licensing, disclaimers, and limitations of liability for our AI-powered IELTS preparation platform."
        canonicalUrl="https://www.ieltsai.pro/terms"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Terms of Service - IELTS Ai Pro',
          description:
            'Terms and conditions for using IELTS Ai Pro AI-powered IELTS preparation services.',
          url: 'https://www.ieltsai.pro/terms',
          publisher: {
            '@type': 'Organization',
            name: 'IELTS Ai Pro',
          },
        }}
      />

      <LegalPageLayout
        title="Terms of Service"
        updatedAt={LAST_UPDATED}
        summary="These terms govern your use of IELTS Ai Pro. Please read them before creating an account, subscribing to a paid plan, or using our practice and AI feedback services."
        sections={SECTIONS}
      >
        <LegalSection id="acceptance" title="1. Acceptance of terms">
          <p>
            By accessing and using this website, you accept and agree to be bound by the terms and
            provisions of this agreement. In addition, when using particular services on this
            website, you are subject to any posted guidelines or rules applicable to those services.
          </p>
          <p>If you do not agree with these terms, please do not use the site or its services.</p>
        </LegalSection>

        <LegalSection id="accounts" title="2. Your account">
          <p>
            Some features require an account. You are responsible for the accuracy of the
            information you provide, for keeping your credentials confidential, and for all activity
            that occurs under your account. Accounts are for individual use and may not be shared or
            transferred.
          </p>
          <p>
            You must be old enough to enter a binding contract in your country of residence, or have
            the consent of a parent or legal guardian.
          </p>
        </LegalSection>

        <LegalSection id="use-license" title="3. Use license">
          <p>
            Permission is granted to temporarily access the materials (information or software) on
            the IELTS Ai Pro website for personal, non-commercial use only. This is the grant of a
            license, not a transfer of title, and under this license you may not:
          </p>
          <LegalList
            items={[
              'Modify or copy the materials',
              'Use the materials for any commercial purpose, or for any public display, commercial or non-commercial',
              'Attempt to decompile or reverse engineer any software contained on the IELTS Ai Pro website',
              'Remove any copyright or other proprietary notices from the materials',
            ]}
          />
          <p>
            This license terminates automatically if you breach any of these restrictions, and may
            be terminated by us at any time.
          </p>
        </LegalSection>

        <LegalSection id="acceptable-use" title="4. Acceptable use">
          <p>When using the platform, you agree not to:</p>
          <LegalList
            items={[
              'Submit content that is unlawful, abusive, or infringes the rights of others',
              'Attempt to gain unauthorized access to accounts, systems, or data that are not yours',
              'Use automated means to scrape, bulk-download, or resell platform content or AI feedback',
              'Interfere with the operation of the service, including by overloading or probing our infrastructure',
              'Misrepresent AI-generated feedback as an official IELTS result',
            ]}
          />
        </LegalSection>

        <LegalSection id="ai-feedback" title="5. AI-generated feedback">
          <p>
            Our evaluation features use automated models to estimate band scores and generate
            written feedback against publicly available IELTS assessment criteria. This feedback is
            provided for practice and self-study purposes only.
          </p>
          <LegalNote title="AI feedback is not an official IELTS score">
            <p>
              Estimated band scores are indicative and may differ from the result awarded by a human
              examiner in a real test. They carry no official standing and cannot be used as
              evidence of English proficiency for any institution, employer, or immigration
              authority.
            </p>
          </LegalNote>
          <p>
            IELTS is a registered trademark of the British Council, IDP: IELTS Australia, and
            Cambridge University Press &amp; Assessment. IELTS Ai Pro is an independent preparation
            platform and is not affiliated with, endorsed by, or sponsored by any of these
            organizations.
          </p>
        </LegalSection>

        <LegalSection id="subscriptions" title="6. Subscriptions and billing">
          <p>
            A free plan is available without payment details. Paid plans are billed in advance
            through Stripe and renew for the billing period shown at checkout until canceled.
          </p>
          <LegalDefinitions
            items={[
              {
                term: 'Cancellation',
                description:
                  'You may cancel at any time from your account settings. Cancellation stops future renewals; access continues until the end of the period you have already paid for.',
              },
              {
                term: 'Refunds',
                description: (
                  <>
                    Refunds are governed by our{' '}
                    <Link className="text-primary hover:underline" to="/refund">
                      Refund &amp; Cancellation Policy
                    </Link>
                    . The voluntary seven-day offer applies only to a completely unused first paid
                    purchase; using any paid feature or AI credit makes it ineligible for that
                    voluntary offer. Mandatory consumer rights and remedies remain unaffected.
                  </>
                ),
              },
              {
                term: 'Price changes',
                description:
                  'We may change plan pricing. Any change applies from your next renewal, and we will give you notice before it takes effect.',
              },
              {
                term: 'Failed payments',
                description:
                  'If a payment fails, we may suspend access to paid features until the balance is settled.',
              },
            ]}
          />
        </LegalSection>

        <LegalSection id="disclaimer" title="7. Disclaimer">
          <p>
            The materials on the IELTS Ai Pro website are provided &ldquo;as is&rdquo;. IELTS Ai Pro
            makes no warranties, expressed or implied, and hereby disclaims and negates all other
            warranties, including without limitation implied warranties or conditions of
            merchantability, fitness for a particular purpose, or non-infringement of intellectual
            property or other violation of rights.
          </p>
          <p>
            We do not warrant that the service will be uninterrupted or error-free, or that using it
            will produce any particular test outcome.
          </p>
        </LegalSection>

        <LegalSection id="limitations" title="8. Limitations of liability">
          <p>
            In no event shall IELTS Ai Pro or its suppliers be liable for any damages (including,
            without limitation, damages for loss of data or profit, or due to business interruption)
            arising out of the use or inability to use the materials on the IELTS Ai Pro website,
            even if IELTS Ai Pro or an authorized representative has been notified orally or in
            writing of the possibility of such damage.
          </p>
          <p>
            Some jurisdictions do not allow limitations on implied warranties or on liability for
            consequential damages, so these limitations may not apply to you.
          </p>
        </LegalSection>

        <LegalSection id="revisions" title="9. Accuracy of materials">
          <p>
            The materials appearing on the IELTS Ai Pro website could include technical,
            typographical, or photographic errors. IELTS Ai Pro does not warrant that any of the
            materials on its website are accurate, complete, or current, and may make changes to
            them at any time without notice.
          </p>
        </LegalSection>

        <LegalSection id="termination" title="10. Termination">
          <p>
            You may stop using the service and delete your account at any time from Settings →
            Account → Delete Account. We may suspend or terminate access if you breach these terms,
            or where required to protect the service or other users. On termination, the handling of
            your data follows our{' '}
            <a className="text-primary hover:underline" href="/privacy">
              Privacy Policy
            </a>
            .
          </p>
        </LegalSection>

        <LegalSection id="changes" title="11. Changes to these terms">
          <p>
            We may update these terms from time to time. The date at the top of this page always
            reflects the current version. Where a change is material, we will give notice before it
            takes effect. Continuing to use the service after a change takes effect means you accept
            the revised terms.
          </p>
        </LegalSection>

        <LegalSection id="contact" title="12. Contact">
          <p>
            If you have any questions about these terms, contact us at{' '}
            <a className="text-primary hover:underline" href="mailto:mail@ieltsai.pro">
              mail@ieltsai.pro
            </a>
            .
          </p>
        </LegalSection>
      </LegalPageLayout>
    </>
  );
}
