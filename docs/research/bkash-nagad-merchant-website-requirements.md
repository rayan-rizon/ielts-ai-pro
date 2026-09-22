# bKash and Nagad merchant/payment-gateway requirements for IELTS AI Pro

**Research date:** 22 September 2026
**Scope:** A Bangladesh-based website selling digital IELTS subscriptions/services.
**Evidence standard:** Provider, regulator, government gazette, and official laws only. Where a provider does not publish a requirement, it is labelled **sales confirmation required** rather than inferred from blogs or third-party gateway libraries.

> This is an implementation and onboarding research note, not a substitute for advice from a Bangladesh-qualified lawyer or tax adviser. The Personal Data Protection Act is new, and some detailed procedures still depend on rules/regulations or later commencement notices.

## Executive decision

1. Apply to **bKash Online Business/Payment Gateway**, not only for a shop QR merchant account. bKash publicly asks for the business identity, contact details, NID availability, a valid trade licence and expiry, bank-account availability, business address/type, and the website/app URL. Its developer documentation says production access follows KYC, an agreement, and completed onboarding.
2. Apply through Nagad's official **Be a Merchant** route, but request an “online payment gateway for a digital subscription/service website” in writing. Nagad's current public form does **not** publish a complete documentary checklist, fees, sandbox terms, or current API guide. Do not treat third-party Nagad SDKs as onboarding authority.
3. Publish checkout-related terms in **Bangla**. Clause 3.1.17 of the Digital Commerce Operation Guidelines 2021 requires purchase/sale, refund, return/exchange, delivery, and other terms to be clearly displayed in Bangla; another language may be added. A separate Bangla URL is not expressly required, but a real Bangla version or language toggle is the cleanest implementation.
4. Maintain both:
   - `/terms` and `/privacy` in English; and
   - `/bn/terms` and `/bn/privacy` (recommended), or an equivalent persistent Bangla toggle.

   The Bangla Terms must include the commercial/refund/cancellation text. A Bangla Privacy Notice is strongly recommended to make consent informed and provable, particularly because the site processes learner content and may serve people under 18.

5. Before applying, make the public website reviewable: legal business name and contact details, trade-licence/registration identifier, clear BDT pricing, plan duration and features, payment/cancellation/refund terms, privacy notice, complaint channel, and a working checkout flow (sandbox or clearly labelled preview).

## 1. Confirmed official requirements

### 1.1 bKash merchant and online-payment onboarding

The official bKash **Online Business** application asks for:

- business name;
- contact person's name, phone, and email;
- business address and business type;
- whether the applicant has an NID;
- whether it has a valid trade licence, plus licence number and expiry date;
- whether it has a bank account; and
- website/Facebook/mobile-app URL.

The general **Merchant** form similarly makes NID, valid trade licence, licence number/expiry, and bank account explicit. The Online Business route is the more relevant route for this website. Sources: [bKash Online Business](https://www.bkash.com/en/business/online-business), [bKash Merchant](https://www.bkash.com/en/business/merchant).

bKash's developer documentation adds these confirmed stages:

1. complete merchant onboarding, provide required KYC documents, and sign the agreement;
2. develop and test against the bKash sandbox (the documentation says the sandbox is open even before onboarding completes);
3. receive production credentials after official onboarding; and
4. move live only after the application and relevant REST API calls have been tested.

Source: [bKash Product Overview](https://developer.bka.sh/docs/product-overview).

For Checkout URL, the merchant server obtains an access token, creates a payment, redirects the customer to bKash's hosted page, receives success/failure/cancel callbacks, and then executes or queries the payment before treating it as paid. The API uses BDT, a unique merchant invoice number, and callback URLs; bKash says the normal API timeout should be 30 seconds. Sources: [Checkout URL Process](https://developer.bka.sh/docs/checkout-url-process-overview), [Create Payment](https://developer.bka.sh/docs/create-payment-2), [Grant Token](https://developer.bka.sh/docs/grant-token-2).

bKash officially lists **subscription payments** as available after one-time customer authorization. Tokenized checkout creates an agreement tied to the merchant's customer ID; the merchant stores the agreement ID for subsequent payments. bKash also exposes an agreement-cancellation operation. This is the correct capability to ask the bKash account manager to enable if IELTS AI Pro will auto-renew subscriptions. Sources: [Product Overview](https://developer.bka.sh/docs/product-overview), [Tokenized Checkout Process](https://developer.bka.sh/docs/tokenized-checkout-process), [Cancel Agreement](https://developer.bka.sh/docs/cancel-agreement).

**Not publicly fixed:** bKash does not publish a universal Payment Gateway merchant fee/MDR, settlement schedule, reserve, minimum volume, or final KYC pack on the above pages. Its PGW customer terms say an additional fee may apply based on the understanding between bKash and the merchant. Get the commercial schedule in the signed offer/agreement. Source: [bKash PGW Terms](https://www.bkash.com/en/page/tokenized_checkout).

### 1.2 Nagad merchant and online-payment onboarding

Nagad provides an official bilingual **Be a Merchant** application route and identifies it as the merchant signup route. The public merchant form confirms the basic eligibility/document signals of **NID, a valid trade licence, and a bank account**. Source: [Nagad Be a Merchant](https://nagad.com.bd/en/forms/?form=be-a-merchant).

However, as of the research date, those three form checks are **not a complete online-gateway onboarding checklist**. Nagad's public site does **not** expose a complete, verifiable document list for an online merchant/payment gateway, current API documentation, sandbox/live credential process, production whitelisting requirements, commercial fees, settlement timing, or recurring-subscription capability. Those items therefore remain **sales confirmation required**; nothing further should be inferred from unofficial SDKs or reseller pages.

Do not submit a general form and assume QR/counter merchant approval includes website API access. In the application/contact request, explicitly ask for:

> Online Payment Gateway/API merchant onboarding for a Bangladesh-based digital education subscription service, including sandbox credentials, production activation requirements, refund API/process, settlement schedule, and whether recurring/tokenized payments are supported.

The provider-specific document pack below is a preparation recommendation, not a claim that Nagad currently requires every item.

### 1.3 Bangladesh-wide digital-commerce requirements affecting the website

The official gazetted **Digital Commerce Operation Guidelines 2021** cover both goods and services and apply throughout Bangladesh. The Ministry of Commerce hosts the [official page](https://mincom.gov.bd/pages/static-pages/694032dc35ce18e1c0563903) and [gazette PDF](https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-mincom/2024/12/756676ad7c3b4b5a9c5eefb7d180bca2.pdf).

Relevant clauses for this service website are:

| Clause              | Confirmed requirement                                                                                                                                                                                                                                | Website consequence                                                                                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.1.2               | Clearly state all product/service descriptions and conditions, including refund, change, and supply timing.                                                                                                                                          | Plan pages and checkout must state the exact service, access start, duration, limits, cancellation and refund rules.                                                   |
| 3.1.6               | Tell the buyer in advance about special software or cookies on the website.                                                                                                                                                                          | Provide a meaningful cookie notice/settings link, not only a vague banner.                                                                                             |
| 3.1.7               | Before collecting personal data, tell the buyer what is collected, where it is stored, how it will be used and processed, and obtain prior permission; a checkbox/consent mechanism may be used to show the terms were seen.                         | Put a clear privacy summary and unchecked acceptance mechanism at account/checkout where consent is the legal basis; record the notice version and timestamp.          |
| 3.1.12              | A digital-commerce operator must obtain at least one listed business identifier (trade licence, VAT registration, TIN, UBID or PRA) and display it on the marketplace/social page.                                                                   | Show the legal operator and applicable registration identifier(s) in the footer/legal/contact area.                                                                    |
| 3.1.14              | Preserve business transaction information for at least six years and supply it to an authorized government agency on request.                                                                                                                        | Retain invoices, transaction/refund status, consent/terms version and audit evidence for six years, with access control and minimization.                              |
| 3.1.17              | Purchase/sale, refund, return/exchange, delivery method/time and other conditions must be clearly written in **Bangla**. They may additionally appear in another language and cannot conflict with Bangladesh law.                                   | A Bangla commercial Terms/Refund/Cancellation version is required. English-only terms are not enough.                                                                  |
| 3.1.19, 3.2.1–3.2.2 | Do not charge above the declared price; clearly describe the service, price and all other charges, service type/method and measurable scope where applicable.                                                                                        | Show the full BDT amount, tax/fees if any, renewal interval, included AI/test usage, and material limitations before payment.                                          |
| 3.4.1               | Provide clear complaint contact channels and appoint a compliance officer who can coordinate with consumer authorities.                                                                                                                              | Publish email/phone/contact route and assign an accountable internal owner.                                                                                            |
| 3.4.2               | Record complaints, arrange resolution within 72 hours, and notify the customer by phone/email/SMS.                                                                                                                                                   | Add ticket logging, acknowledgement, owner, deadline and outcome notification.                                                                                         |
| 3.5.1               | If advance payment was taken and supply fails on time, return the full amount through the original payment method within at most 10 days, excluding the payment medium's own processing time; the seller bears refund charges and informs the buyer. | Refund to bKash/Nagad, not wallet credit; log initiation and notify the customer. Have counsel map this product-delivery wording to each digital-service failure case. |

The Guidelines also prohibit unlawful/prohibited goods/services, MLM/network business, gambling/betting, unauthorized money business, and certain unapproved wallet/voucher-like instruments (clauses 3.1.3–3.1.4 and 3.1.8–3.1.10). IELTS AI Pro should not create a cash-like wallet or transferable stored value without regulatory review.

Consumers can contact the Directorate of National Consumer Rights Protection; its official hotline is **16121**. Source: [DNCRP hotline](https://dncrp.gov.bd/pages/static-pages/6922dda6933eb65569e15bf5).

### 1.4 Data/privacy requirements now in force

The **Personal Data Protection Act 2026 (Act No. 63 of 2026)** was enacted on 10 April 2026. Most of it is deemed effective from 6 November 2025; sections 23 and 31–35 require a later commencement after the stated 18-month period. Source: [official Laws of Bangladesh text, sections 1–2](https://bdlaws.minlaw.gov.bd/act-print-1692.html).

For the privacy notice and system design, the currently relevant official requirements include:

- consent must be voluntary, specific, clear, withdrawable, and preceded by information about purpose, retention period, transfers and withdrawal (section 5);
- processing may also rely on limited statutory bases such as performing a contract, but must remain necessary and proportionate (section 5);
- the business is responsible for processors acting on its behalf (section 8)—important for Supabase, hosting, email, analytics, AI/STT vendors and payment providers;
- processing children's data requires parental/legal-guardian consent, protection of the child's interests, and no child-specific tracking/profiling/targeted advertising (section 9);
- users have access, correction/update, withdrawal/objection and deletion rights subject to legal exceptions (sections 11–13);
- transparency information includes data classes/methods, purposes, risk-sensitive categories, rights/contact method, complaint path, transfers, and the identity/contact method of the data fiduciary (section 15);
- use or disclosure for another purpose requires an appropriate legal basis/consent (section 16);
- suitable organizational and technical security controls are required, including encryption/pseudonymization where appropriate, resilience, recovery, periodic risk evaluation/testing and updates (section 17);
- retain personal data only as permitted/needed, while maintaining processing records for at least five years unless another provision specifies otherwise (sections 18–19); and
- material data breaches must be reported to the authority under the form, method and timing to be set by regulation (section 20).

Sources: [official Act, sections 5–9](https://bdlaws.minlaw.gov.bd/act-print-1692.html), [official Act, sections 15–20](https://bdlaws.minlaw.gov.bd/act-print-1692.html).

Bangladesh Bank's MFS Regulations 2022 separately require MFS providers to comply with AML/CFT and KYC rules and to maintain confidentiality, integrity, authorization, non-repudiation, authenticated transactions, and secure infrastructure. Those duties explain why bKash/Nagad can request further KYC and technical controls beyond their public signup forms. Source: [Bangladesh Mobile Financial Services Regulations 2022](https://www.bb.org.bd/aboutus/regulationguideline/psd/mfs_regulations_2022.pdf).

## 2. Document pack to prepare

### Confirmed from bKash public onboarding

- valid trade licence with number and expiry date;
- NID availability for the proprietor/authorized person;
- business bank-account availability;
- legal/business name, address and business type;
- contact person's name, phone and email; and
- production website/app URL.

### Confirmed basic checks from Nagad's public merchant form

- NID;
- valid trade licence; and
- bank account.

These are entry-level form checks only, not evidence that Nagad requires no other KYC or gateway documents.

### Prepare for both providers, but confirm the exact required form/certification

- NID copies and recent photo of proprietor/directors/authorized signatory;
- e-TIN certificate;
- BIN/VAT certificate if registered/applicable;
- bank statement or cancelled cheque/account certificate in the matching legal name;
- certificate of incorporation, memorandum/articles, Form XII/returns, and board resolution for a company; partnership deed for a partnership; or equivalent ownership proof for a proprietorship;
- beneficial-owner/director details and authorization letter;
- office address proof and business contact details;
- website URL plus screenshots/links for pricing, Terms, Bangla Terms, Privacy, Bangla Privacy, Refund/Cancellation and Contact;
- product/service description, expected monthly transaction count/value, average ticket and refund rate;
- settlement-account and authorized technical/contact people;
- production domain, backend/callback URLs, and fixed outbound IP only if the provider specifically requests it; and
- security/architecture summary showing credentials remain server-side and customers enter wallet number/PIN/OTP only on the provider-hosted payment experience.

Name consistency matters: trade licence, TIN/BIN, bank account, website legal operator and provider agreement should use the same legal business identity or have documented authority explaining differences.

## 3. Required and recommended website changes

### Before merchant review

1. **Business identity block** — legal operator name, address, support email/phone, trade-licence or applicable displayed registration identifier, and compliance/contact owner.
2. **Plan disclosures** — BDT price, billing interval, access period, exact included features/usage, tax/fees, activation time, and material limitations.
3. **Bangla commercial terms** — purchase, renewal, cancellation, refund, failed payment and service-availability terms in clear Bangla; English may be shown alongside.
4. **Privacy notice** — cover the Act 2026 disclosures and name each important processor category, overseas transfer where applicable, learner-content/AI processing, retention and user rights.
5. **Complaint flow** — a visible support route, ticket number, audit log, 72-hour internal resolution target and outcome notification.
6. **Refund operations** — original-method refunds, provider reference IDs, status tracking, user notification and escalation/reconciliation.

### Checkout and subscription UX

- Show the plan, BDT total, billing period and whether it renews **immediately before** the pay button.
- For recurring billing, clearly show: authorization, amount or method of determining it, frequency, first charge, renewal date, how to cancel, when cancellation takes effect, failed-payment/grace rules and refund consequences.
- Require an unchecked box such as: “I agree to the Terms, Subscription & Cancellation Policy, and Refund Policy,” linking to Bangla and English versions. Log policy version, timestamp, account/order and locale.
- Keep optional marketing/analytics consent separate from contract/payment acceptance.
- Redirect to the provider-hosted flow. Never ask for or store a bKash/Nagad PIN or OTP.
- Treat callbacks as notifications, not final truth: verify/execute/query server-to-server according to the provider contract before granting paid access.
- Make payment creation idempotent; use unique invoice/order IDs; prevent duplicate access/charges; preserve gateway payment/trx/reference IDs.
- Provide explicit paid, failed, cancelled, pending and refunded states. A browser redirect alone is not proof of payment.
- Provide an account-level “Manage subscription / Cancel renewal” control. If bKash agreement-based billing is enabled, cancellation must also revoke/cancel the provider agreement rather than only hiding the subscription locally.
- Send a receipt/invoice with legal seller, plan, amount/currency, date, invoice number, provider, transaction reference and support/refund instructions.

## 4. Privacy and Terms page structure

### Terms / Subscription & Cancellation

Include:

1. legal business identity and eligibility/age;
2. service description and learner responsibility;
3. account security;
4. prices in BDT, taxes/fees and price-change notice;
5. one-time versus auto-renewing plans;
6. customer authorization for recurring payments;
7. trial, renewal, failed payment and grace-period rules;
8. cancellation method, cut-off, effect and access end date;
9. refund eligibility, exclusions, original-method refund, timing, charges and notice;
10. service availability and what happens when paid service cannot be provided;
11. fair-use/abuse rules and prohibited conduct;
12. intellectual property and lawful use of content;
13. suspension/termination and data/export consequences;
14. complaint route and 72-hour response process;
15. governing law/dispute process in Bangladesh; and
16. policy version, effective date and change notice.

Avoid a blanket “all payments are non-refundable” term. It may conflict with the 2021 Guidelines where paid service is not supplied, duplicate/erroneous charging occurs, or another legal remedy applies. Define consumed digital-service cases precisely and have Bangladesh counsel validate them.

### Privacy Notice

Include:

1. legal operator/data-fiduciary identity and privacy contact;
2. data collected: account/contact, authentication, age/guardian evidence where applicable, billing and gateway metadata, device/security logs, cookies/analytics, learning progress, test answers, writing, voice/audio/transcripts, support messages and AI outputs;
3. collection source and purpose for each category;
4. legal basis: contract, legal obligation, security/legitimate interest where allowed, and consent where relied upon;
5. payment boundary: the provider handles wallet credentials; IELTS AI Pro stores only necessary order/reference/status metadata and never the wallet PIN/OTP;
6. processors/recipients: payment providers, Supabase/database/auth, hosting, email, analytics, AI and speech providers, support vendors and legally authorized authorities;
7. location/cross-border transfer and safeguards/contract basis;
8. specific retention periods by category, including the six-year digital-commerce transaction record rule;
9. security controls in accurate, non-absolute language;
10. user rights and a workable access/correction/deletion/withdrawal/objection request route;
11. child data and verified guardian consent; no child-specific profiling/targeted advertising;
12. cookie categories and controls;
13. breach/complaint process and regulator route; and
14. effective date/change notice.

The notice must describe the real system. Do not say “we never share data” if payment, hosting, analytics, AI, email, or speech vendors process it. Do not promise immediate deletion where transaction/tax/security records must legally be retained; explain the exception and restrict/archive the data instead.

## 5. Bangla-page decision

**Yes—create Bangla versions.** The careful distinction is:

- **Mandatory in substance:** Clause 3.1.17 requires the commercial purchase/refund/return/delivery/other terms to be written and clearly displayed in Bangla. English can be additional.
- **Not expressly mandated as a separate route:** the Guidelines do not say the Bangla text must live on a separate webpage.
- **Recommended implementation:** `/bn/terms`, `/bn/privacy`, and preferably `/bn/refund-cancellation`, with a persistent language switch and matching version/effective date. This is clearer for users, merchant reviewers, consent evidence and maintenance.
- **Privacy:** the 2021 Guidelines require advance disclosure and permission for collection/use/processing/storage, while the 2026 Act requires informed, specific, clear and withdrawable consent when consent is the basis. A Bangla Privacy Notice is the safest way to show that a Bangla-speaking user was properly informed, even though the cited provisions do not explicitly require a separate Bangla privacy URL.
- If translations differ, do not silently make the English version control consumer rights. Have counsel choose and state the governing text in a manner consistent with mandatory Bangladesh law; keep both versions synchronized.

## 6. Questions to send to bKash and Nagad sales before signing

Ask both providers for written answers and the current merchant agreement/schedule:

1. Is direct Payment Gateway/API onboarding available for this legal entity and digital education subscription model?
2. What exact KYC documents, certification/notarization, physical verification and beneficial-owner information are required?
3. Are one-time checkout, tokenized checkout and automatic recurring subscription charges separately approved products?
4. What exact customer authorization and cancellation wording/UI do you require for recurring payments?
5. What are MDR/fees, VAT on fees, settlement timing, minimums, reserve/hold, refund fees and chargeback/dispute rules?
6. Are partial and full refunds supported by API/dashboard? What is the deadline and reconciliation process?
7. What sandbox credentials/test wallets, test cases and certification/UAT evidence are required?
8. What production credentials, callback domains, IP whitelisting, TLS/security review and go-live sign-off are required?
9. What logo/button/brand rules and mandatory checkout disclosures apply?
10. What transaction limits and prohibited/restricted business categories apply to AI education subscriptions?
11. Can customers cancel the payment agreement from the provider app, and how is the merchant notified?
12. What support/escalation contacts and SLA apply to pending/duplicate/failed/refund transactions?

Do not rely on verbal fee or approval promises. Attach the final commercial/KYC/security schedules to the signed agreement and implement against the provider-issued current API guide.

## 7. Recommended sequence

1. Confirm the exact legal entity and align its trade licence, TIN/BIN, bank account and website identity.
2. Publish and internally approve English and Bangla Terms, Refund/Cancellation, Privacy, Pricing and Contact pages.
3. Implement consent/version logging, complaint tracking and refund/reconciliation operations.
4. Submit bKash Online Business and Nagad Be a Merchant applications with the document pack and the explicit gateway/subscription request.
5. Obtain written commercial terms and official current integration packs.
6. Integrate server-side in sandbox; test success, failure, cancellation, timeout/pending, duplicate callback, retry, refund and subscription-cancellation cases.
7. Complete provider UAT/security review and receive production credentials.
8. Run a low-value controlled live transaction and original-method refund; independently verify provider status, local entitlement, receipt, settlement and refund before wider launch.
