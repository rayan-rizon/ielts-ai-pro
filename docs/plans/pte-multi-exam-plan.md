# PTE (pteai.pro) — Multi-exam পরিকল্পনা

> অবস্থা: খসড়া, মালিকের সিদ্ধান্তের অপেক্ষায় · তারিখ: 2026-10-06
> ল্যান্ডিং পেজ আর মার্কেটিং ওয়েবসাইট এই পরিকল্পনার বাইরে — ওগুলো পরে আলাদাভাবে হবে।

## এক লাইনে

একই কোড, একই Supabase ডাটাবেস, একই অ্যাডমিন প্যানেল। `ieltsai.pro` আর `pteai.pro` দুটো
আলাদা Vercel প্রজেক্ট, কিন্তু দুটোই এই একই repo থেকে build হবে — শুধু `VITE_EXAM=ielts`
বা `VITE_EXAM=pte` বদলে। প্রজেক্ট ফোল্ডার কপি করা হবে না।

```
                 ┌──────────── একই GitHub repo ────────────┐
                 │                                          │
   Vercel: ieltsai.pro (VITE_EXAM=ielts)     Vercel: pteai.pro (VITE_EXAM=pte)
                 │                                          │
                 └──────────► একই Supabase প্রজেক্ট ◄───────┘
                     (users, payments, admin, AI, email)
```

---

## মালিকের সিদ্ধান্ত (2026-10-06)

| বিষয়            | সিদ্ধান্ত                                              | কীভাবে হবে                                      |
| ---------------- | ------------------------------------------------------ | ----------------------------------------------- |
| সাবস্ক্রিপশন     | **আলাদা** — IELTS আর PTE আলাদা কেনা হবে                | `exam_entitlements` টেবিল (ধাপ ৩)               |
| প্রাইসিং প্ল্যান | **আলাদা** — দাম, মেয়াদ, ডিসকাউন্ট আলাদা               | প্রাইস বুক পরীক্ষাভিত্তিক (ধাপ ৩)               |
| প্রশ্ন / কনটেন্ট | **আলাদা**                                              | সব কনটেন্ট টেবিলে `exam_code` (ধাপ ২)           |
| Google লগইন      | **আলাদা** — PTE ইউজার Google-এ PTE-র নাম আর লোগো দেখবে | আলাদা GCP প্রজেক্ট + আলাদা OAuth client (ধাপ ৫) |
| অ্যাডমিন প্যানেল | একটাই, `ieltsai.pro/admin`-এ (প্রস্তাব)                | `pteai.pro`-তে অ্যাডমিন রুট বন্ধ                |

**এখনো খোলা প্রশ্ন:** একই Gmail দিয়ে কেউ দুই সাইটে ঢুকলে সে কি একই অ্যাকাউন্ট (ভেতরে একটা user,
দুটো আলাদা সাবস্ক্রিপশন), নাকি সম্পূর্ণ আলাদা দুটো অ্যাকাউন্ট?
সুপারিশ: **ভেতরে একই অ্যাকাউন্ট** — ইউজার এটা টের পাবে না, কারণ ব্র্যান্ড, লগইন স্ক্রিন, প্ল্যান সব আলাদা।
সম্পূর্ণ আলাদা অ্যাকাউন্ট চাইলে দ্বিতীয় Supabase প্রজেক্ট লাগবে, আর তখন অ্যাডমিন, পেমেন্ট,
মার্কেটিং সব দুই জায়গায় চালাতে হবে — এই পরিকল্পনার বেশিরভাগ লাভ চলে যাবে।

---

## এখনকার কোডে কী পেয়েছি (কেন কাজটা দরকার)

- `users.subscription_tier` — একজন ইউজারের **একটাই** প্ল্যান। পরীক্ষাভিত্তিক প্ল্যানের জায়গা নেই।
  এটা src-এর ৭৯টা ফাইল, ২১টা edge function আর ৩৪টা migration-এ ব্যবহার হয়। **এটাই সবচেয়ে বড় কাজ।**
- `test_sessions.band_score` হলো `numeric(2,1)` — সর্বোচ্চ 9.9 রাখা যায়। PTE-র 10–90 স্কোর রাখা যাবে না।
- `users.exam_type` আগে থেকেই আছে, কিন্তু এর মানে IELTS **Academic / General**। তাই নতুন কলামের নাম
  হবে `exam_code` (ielts / pte) — দুটো গুলিয়ে ফেলা যাবে না।
- `passages.test_type`, `test_sessions.test_type` — reading/listening ইত্যাদি, কোন পরীক্ষার সেটা নেই।
- `_shared/originValidation.ts`-এ শুধু ieltsai.pro অনুমোদিত — pteai.pro থেকে API কল ব্লক হবে।
- AI Coach-এর prompt-এ সরাসরি "IELTS AI Coach in IELTS Ai Pro" লেখা।
- R2 bucket (`ielts-ai-media`), ইমেইল sender, লোগো — সব IELTS ব্র্যান্ডে।

---

## ধাপসমূহ

প্রতিটা ধাপ আলাদা PR। **ধাপ ১–৩ শেষ হলেও IELTS সাইটে ইউজার কোনো পরিবর্তন দেখবে না** —
সব নতুন কলামের default `ielts`।

### ধাপ ০ — PTE স্পিকিং স্কোরিং যাচাই (সমান্তরালে, ১ সপ্তাহ)

সবচেয়ে ঝুঁকিপূর্ণ জিনিস আগে পরীক্ষা করা। Read Aloud আর Repeat Sentence-এর জন্য
উচ্চারণ যাচাইয়ের সার্ভিস (Azure Pronunciation Assessment / Speechace) দিয়ে একটা ছোট script।
১০–২০ জনের আসল PTE স্কোরের সাথে মিলিয়ে দেখা। **মিল ভালো না হলে বাকি PTE কাজ শুরু না করাই ভালো।**
এটা `npm run ai:bench`-এর মতো একটা আলাদা script — প্রোডাকশন কোডে হাত দেবে না।

### ধাপ ১ — পরীক্ষার কনফিগ (`src/exams/`)

```
src/exams/
  index.js        // VITE_EXAM পড়ে সক্রিয় পরীক্ষা দেয়: getActiveExam()
  ielts/config.js // নাম, ডোমেইন, রঙ, সেকশন, স্কোর স্কেল (0–9, 0.5 ধাপ), লোগো
  pte/config.js   // স্কোর স্কেল (10–90), সেকশন, প্রশ্নের ধরনের তালিকা
```

UI-তে যেখানে "IELTS", "band", 0–9 সরাসরি লেখা, সেখানে ধীরে ধীরে কনফিগ থেকে পড়া হবে।
শুরুতে শুধু শেয়ার্ড অংশে (ড্যাশবোর্ড, সেটিংস, সাবস্ক্রিপশন, ইমেইল) — IELTS-এর নিজস্ব টেস্ট পেজে নয়।

### ধাপ ২ — ডাটাবেস: `exam_code` আর সাধারণ স্কোর

একটা migration:

- এই টেবিলগুলোতে `exam_code text not null default 'ielts' check (exam_code in ('ielts','pte'))`:
  `test_sessions`, `passages`, `questions`, `resources`, `learning_paths`, `skill_proficiency`,
  `payment_requests`, `promo_codes`, `marketing_campaigns`, `ai_api_usage`, `vocabulary_items`
  (যেটা দুই পরীক্ষাতেই চলে সেটা পরে `null` = সবার জন্য করা যাবে)।
- `users.target_exam_code` — ইউজার এখন কোন পরীক্ষার প্রস্তুতি নিচ্ছে।
- `test_sessions.exam_score numeric(5,1)` — যেকোনো স্কেলের স্কোর। পুরনো `band_score` থাকবে,
  backfill: `exam_score = band_score`।
- দরকারি index: `(exam_code, created_at)` ইত্যাদি, যাতে অ্যাডমিন ফিল্টার ধীর না হয়।
- RLS policy আগের মতোই, শুধু পরীক্ষা অনুযায়ী কনটেন্ট দেখানোর শর্ত যোগ।

### ধাপ ৩ — পরীক্ষাভিত্তিক সাবস্ক্রিপশন (সবচেয়ে বড় ধাপ)

নতুন টেবিল:

```
exam_entitlements(user_id, exam_code, tier, starts_at, ends_at, source, payment_ref)
```

আর একটা SQL ফাংশন `get_exam_tier(user_id, exam_code)` — "এই ইউজার এই পরীক্ষায় free/pro/premium?"
এর একমাত্র উত্তরদাতা।

রূপান্তর নিরাপদে করার জন্য তিন ভাগে:

1. টেবিল বানানো, বর্তমান সব IELTS সাবস্ক্রিপশন সেখানে কপি। পেমেন্ট webhook (Stripe, bKash) দুই
   জায়গাতেই লিখবে। `users.subscription_tier` IELTS-এর জন্য আগের মতোই কাজ করবে।
2. ১৩৪টা জায়গা (src + functions + RLS) এক এক করে `get_exam_tier()`-এ সরানো — feature অনুযায়ী
   ছোট ছোট PR।
3. সব সরানো হলে `users.subscription_tier` শুধু "IELTS-এর mirror" হিসেবে থাকবে, পরে বাদ।

Exam Pass, রিফান্ড (`payment_refunds`), প্রোমো কোড — সবকিছুতে `exam_code` থাকবে।

**আলাদা প্রাইসিং:** এখন `_shared/planPricing.ts`-এর `resolvePriceBook()` একটা `pricingTiers`
সেটিং থেকে tier আর দেশ অনুযায়ী দাম বের করে। এটাকে `pricingTiers[exam_code][tier]` করা হবে —
তাই PTE-র দাম, দেশভিত্তিক দাম (যেমন BDT), মেয়াদ সব আলাদা সেট করা যাবে, কিন্তু হিসাবের কোড
(whole-taka rounding, প্রোমো, Exam Pass) একটাই থাকবে। অ্যাডমিন Settings-এ পরীক্ষা বেছে দাম বসানো যাবে।
Stripe-এ PTE-র জন্য আলাদা product।

### ধাপ ৪ — অ্যাডমিন প্যানেলে পরীক্ষা সুইচ

- উপরে **All / IELTS / PTE** সুইচ, বাছাই থাকবে URL-এ (`?exam=pte`)।
- প্রতিটা ট্যাব সেই ফিল্টার মানবে: Overview, Users (ব্যাজ), Tests/Resources (পরীক্ষা বাছাই বাধ্যতামূলক),
  Payments, Marketing/Promos, AI Usage, Institutions।
- PTE চালু না হওয়া পর্যন্ত সুইচে শুধু IELTS দেখাবে।

### ধাপ ৫ — দুই ডোমেইনের প্লাম্বিং

| কী                                  | কী করতে হবে                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vercel                              | একই repo থেকে দ্বিতীয় প্রজেক্ট `pteai.pro`, env `VITE_EXAM=pte`                                                                                                                                                                                                                                                                                                      |
| Edge function CORS                  | `originValidation.ts` আর `pairedRequestOrigin.ts`-এ pteai.pro যোগ                                                                                                                                                                                                                                                                                                     |
| Supabase Auth                       | Redirect URL-এ pteai.pro যোগ; ইমেইল টেমপ্লেটে ব্র্যান্ড পরীক্ষা অনুযায়ী                                                                                                                                                                                                                                                                                              |
| Google লগইন (আলাদা)                 | নতুন GCP প্রজেক্ট "PTE Ai Pro" → নিজস্ব consent screen (নাম, লোগো, privacy URL) আর নতুন Web OAuth client, origin `https://pteai.pro`। pteai.pro-র Vercel env-এ `VITE_GOOGLE_CLIENT_ID` = এই নতুন client। Supabase → Auth → Google provider-এর client ID তালিকায় নতুন ID যোগ। অ্যাপ এখনই `signInWithIdToken` ব্যবহার করে (`User.ts:391`), তাই লগইন কোড বদলাতে হবে না। |
| Auth ইমেইল (verify, password reset) | Supabase-এর টেমপ্লেট একটাই — Send Email Hook দিয়ে নিজেরা পাঠানো, যাতে PTE ইউজার PTE ব্র্যান্ডের ইমেইল পায়                                                                                                                                                                                                                                                           |
| ইমেইল (Resend)                      | `pteai.pro` ডোমেইন verify, sender `noreply@pteai.pro`, PTE লোগো                                                                                                                                                                                                                                                                                                       |
| পেমেন্ট                             | Stripe-এ PTE product/price; success/cancel URL ডোমেইন অনুযায়ী; bKash একই                                                                                                                                                                                                                                                                                             |
| R2 মিডিয়া                          | একই bucket, `pte/` prefix — নতুন bucket লাগবে না                                                                                                                                                                                                                                                                                                                      |
| CSP (`vercel.json`)                 | দুই প্রজেক্টে আলাদা CSP লাগলে build-time-এ বানানো। Meta Open Bridge-এর নিয়ম বদলাবে না                                                                                                                                                                                                                                                                                |
| Analytics                           | PTE-র আলাদা GA4 property আর (দরকার হলে) আলাদা Meta pixel; সাইনআপ attribution-এ `exam_code`                                                                                                                                                                                                                                                                            |
| SEO                                 | `generate-public-seo-pages.mjs` সক্রিয় পরীক্ষা অনুযায়ী আলাদা sitemap/পেজ বানাবে                                                                                                                                                                                                                                                                                     |
| AI                                  | `aiModelRegistry.ts`-এ PTE route যোগ; AI Coach-এর prompt পরীক্ষা অনুযায়ী                                                                                                                                                                                                                                                                                             |

### ধাপ ৬ — PTE অ্যাপ নিজেই

- **প্রশ্নের ধরন যোগ করার ব্যবস্থা**: `src/exams/pte/items/` — প্রতিটা ধরন (Read Aloud, Repeat Sentence,
  Describe Image, Retell Lecture, Answer Short Question, Summarize Written Text, Write Essay,
  Fill in the Blanks, Re-order Paragraphs, Highlight Incorrect Words, Write from Dictation ...)
  একটা ছোট component + timer নিয়ম + স্কোরিং ফাংশন।
- **প্র্যাকটিস মোড আগে, তারপর sectional, তারপর full mock।**
- **স্কোরিং**: নতুন edge function `pte-scoring` — objective প্রশ্ন সার্ভারে নিয়ম দিয়ে,
  স্পিকিং উচ্চারণ সার্ভিস দিয়ে, লেখা AI দিয়ে। এক উত্তর একাধিক skill-এ নম্বর দেবে।
- **কনটেন্ট**: অ্যাডমিনের Tests/Resources ট্যাব দিয়ে PTE প্রশ্ন আপলোড। নিজস্ব মৌলিক কনটেন্ট —
  Alfa বা Pearson থেকে কপি নয়।
- শেয়ার্ড জিনিস সরাসরি কাজ করবে: ড্যাশবোর্ড, লিডারবোর্ড, ভোকাবুলারি, গ্রামার, AI Coach, ইনস্টিটিউশন।

### ধাপ ৭ — বিটা

ল্যান্ডিং পেজ (আপনি বানাবেন) + অল্প কিছু ইউজার দিয়ে বিটা, তারপর পেমেন্ট চালু।

---

## যা করা হবে না

- প্রজেক্ট ফোল্ডার কপি বা দ্বিতীয় Supabase প্রজেক্ট।
- IELTS-এর টেস্ট রানার (reading/listening/writing/speaking) নতুন করে লেখা — ওগুলো যেমন আছে থাকবে।
- এই পর্বে TOEFL — তবে কনফিগ এমনভাবে হবে যাতে পরে `src/exams/toefl/` যোগ করা যায়।

## ঝুঁকি

| ঝুঁকি                                                        | সমাধান                                                                                |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| সাবস্ক্রিপশন রূপান্তরে কেউ ভুল করে প্রিমিয়াম হারায় বা পায় | ধাপ ৩-এ কিছু সময় দুই জায়গায় লেখা, প্রতিদিন দুটো মিলিয়ে দেখার SQL check            |
| PTE স্পিকিং স্কোর বিশ্বাসযোগ্য না                            | ধাপ ০ আগে; ভালো না হলে PTE থামানো                                                     |
| IELTS-এর কাজ (BD পেমেন্ট, retention) পিছিয়ে যায়            | ধাপ ১–৪ এমনভাবে যে IELTS-এরও উপকার হয় (অ্যাডমিন পরিষ্কার হয়); PTE কনটেন্ট/রানার পরে |
| ১৩৪টা subscription_tier জায়গার কোনোটা বাদ পড়ে              | `get_exam_tier()`-এর বাইরে `subscription_tier` পড়া ধরতে lint/grep check CI-তে        |

## ক্রম সংক্ষেপে

```
ধাপ ০ (স্কোরিং যাচাই) ──────────────┐
ধাপ ১ কনফিগ → ধাপ ২ DB → ধাপ ৩ সাবস্ক্রিপশন → ধাপ ৪ অ্যাডমিন
                                               └→ ধাপ ৫ ডোমেইন → ধাপ ৬ PTE অ্যাপ → ধাপ ৭ বিটা
```
