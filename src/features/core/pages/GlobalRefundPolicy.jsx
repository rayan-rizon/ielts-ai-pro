import React from 'react';
import { Link } from 'react-router-dom';
import DocumentHead from '@/components/shared/DocumentHead';
import {
  LegalPageLayout,
  LegalSection,
  LegalList,
  LegalNote,
} from '@/features/core/components/legal/LegalPageLayout';

const LAST_UPDATED = 'September 22, 2026';
const SECTIONS = [
  { id: 'scope', title: 'Scope and legal rights' },
  { id: 'cancellation', title: 'Canceling a subscription' },
  { id: 'unused-purchase', title: 'Seven-day unused-purchase window' },
  { id: 'non-refundable', title: 'Non-refundable situations' },
  { id: 'exceptions', title: 'Billing and service exceptions' },
  { id: 'request', title: 'How to request a refund' },
  { id: 'contact', title: 'Contact' },
];

export default function GlobalRefundPolicy() {
  return (
    <>
      <DocumentHead
        title="Refund & Cancellation Policy | IELTS Ai Pro"
        description="Understand how subscription cancellation, AI-credit use, unused-purchase refunds, and required consumer remedies work for IELTS Ai Pro purchases made through Stripe."
        canonicalUrl="https://www.ieltsai.pro/refund"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Refund and Cancellation Policy - IELTS Ai Pro',
          description:
            'Refund and subscription cancellation terms for IELTS Ai Pro purchases made through Stripe.',
          url: 'https://www.ieltsai.pro/refund',
          publisher: {
            '@type': 'Organization',
            name: 'QuantByte Tech',
          },
        }}
      />

      <LegalPageLayout
        title="Refund & Cancellation Policy"
        updatedAt={LAST_UPDATED}
        summary="This policy explains the voluntary refund window for an unused first purchase, what happens when paid SaaS features or AI credits are used, and how to stop future subscription renewals."
        sections={SECTIONS}
      >
        <LegalSection id="scope" title="1. Scope and legal rights">
          <p>
            This policy applies to paid IELTS Ai Pro purchases processed through Stripe. It should
            be read with our{' '}
            <Link className="text-primary hover:underline" to="/terms">
              Terms of Service
            </Link>
            . Nothing here excludes or limits a consumer right or remedy that cannot legally be
            excluded or limited where you live.
          </p>
          <p>
            A statutory cancellation or withdrawal right is separate from the voluntary seven-day
            offer below. If your local law gives you such a right, contact us within the applicable
            legal period. Any charge for service already provided will be handled only to the extent
            permitted by that law, including any required prior consent or acknowledgement.
          </p>
        </LegalSection>

        <LegalSection id="cancellation" title="2. Canceling a subscription">
          <p>
            You may cancel a recurring subscription from your account&apos;s subscription settings.
            Cancellation stops future renewals; it does not normally end access immediately, and
            your paid access continues until the end of the current billing period. Canceling by
            itself does not refund the current period or unused time. Where applicable law requires
            a different result, that law controls.
          </p>
          <p>
            Please cancel before the next renewal is processed to avoid the next charge. If you
            cannot access the subscription controls, contact support using the details below.
          </p>
        </LegalSection>

        <LegalSection id="unused-purchase" title="3. Seven-day unused-purchase window">
          <p>
            You may request a voluntary full refund within seven calendar days after your first paid
            subscription purchase, but only if that purchase is completely unused. A purchase is
            unused only if no paid-only feature has been accessed, no paid AI request or evaluation
            has consumed a credit or allowance, no paid test has been started, and no paid-only
            material has been downloaded.
          </p>
          <LegalNote title="Seven days is a request window, not a free trial" tone="warning">
            <p>
              The voluntary refund offer ends as soon as any paid feature or AI credit is used—even
              if only one credit is used, the use happens minutes after purchase, or the request is
              made within seven days. Using all included AI credits within that period does not
              qualify the purchase for this unused-purchase refund.
            </p>
          </LegalNote>
          <p>
            A failed AI request that produced no usable result and consumed no credit or allowance
            is not treated as completed usage for this voluntary offer. We may review account and
            service records to confirm usage.
          </p>
        </LegalSection>

        <LegalSection id="non-refundable" title="4. Non-refundable situations">
          <p>
            Except where applicable law or the exceptions below require otherwise, the following are
            not eligible for a voluntary refund:
          </p>
          <LegalList
            items={[
              'A purchase after any paid feature, AI credit, AI evaluation, paid test, or paid-only resource has been used.',
              'A renewal, repeat purchase, or upgrade after the seven-day unused-purchase window for the first paid purchase.',
              'Unused subscription time, remaining AI credits or allowances, or a decision not to continue using the service.',
              'A change of mind, dissatisfaction with an estimated AI score or feedback, or not achieving a particular IELTS score, admission, or other outcome.',
              'An issue caused by an unsupported device or software, the customer’s internet connection, or failure to follow published service requirements.',
              'An account suspended for material misuse, sharing, resale, automated abuse, or another material breach of the Terms of Service.',
            ]}
          />
          <LegalNote title="AI usage and refund eligibility" tone="warning">
            <p>
              AI processing and other paid digital features are delivered as they are used. Once a
              paid credit or feature has been consumed, the voluntary unused-purchase refund no
              longer applies. This rule does not remove a non-waivable legal right or a remedy for a
              confirmed billing or service problem.
            </p>
          </LegalNote>
        </LegalSection>

        <LegalSection id="exceptions" title="5. Billing and service exceptions">
          <p>We will review and address, as required by law and the facts, matters such as:</p>
          <LegalList
            items={[
              'a confirmed duplicate or incorrect charge;',
              'a payment taken but the paid service was not supplied;',
              'a confirmed material service failure that prevented the core paid service and was not reasonably resolved with restored usage, extended access, or another suitable remedy;',
              'a transaction reported as unauthorized, subject to appropriate verification and any payment-provider process; or',
              'another refund, cancellation, or remedy required by applicable law.',
            ]}
          />
        </LegalSection>

        <LegalSection id="request" title="6. How to request a refund">
          <p>
            Email{' '}
            <a className="text-primary hover:underline" href="mailto:mail@ieltsai.pro">
              mail@ieltsai.pro
            </a>{' '}
            from the email address on your account. Include your account email, purchase date, plan,
            amount, Stripe receipt or transaction reference, and a brief explanation. Do not send a
            password, full card number, security code, or one-time code.
          </p>
          <p>
            We will review the request and reply using the contact information provided. If a refund
            is approved, it will be submitted through Stripe to the original payment method where
            supported. Your bank or card issuer controls when the credit appears, so posting time
            may vary. A full refund ends the refunded paid access and any unused entitlements tied
            to that purchase.
          </p>
        </LegalSection>

        <LegalSection id="contact" title="7. Contact">
          <p>
            IELTS Ai Pro is a product of QuantByte Tech. For refund or cancellation support, email{' '}
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
