# Practice Lab: "একটাই পরের কাজ" (design, পথ B)

Mockup: https://claude.ai/artifact/HSByB6UGQd6rUdJSmGKtCd

## কেন

Learner যেন page খুলেই বোঝে কী করবে, আর শুরু করা set শেষ করতে পারে।

## Approaches

- A. শুধু label, list আর panel fix। দ্রুত, কিন্তু শুরুর জায়গা অনেকই থাকে।
- **B. বেছে নেওয়া হয়েছে।** একটা প্রধান card, বাকি সব ছোট। Question type card আকারেই থাকবে (user-এর সিদ্ধান্ত)।
- C. Wizard। নতুনদের জন্য সহজ, নিয়মিত user-এর বাড়তি click।

## Home (উপর থেকে নিচে)

1. Header আর "Your study plan"। ৩টা stat বাদ। দৈনিক limit থাকলে "Left today" header-এ এক লাইনে থাকবে। Completed history পাওয়া যাবে History button থেকে।
2. **Start here** card: suggested type, "x of y correct", "See those results", ৩ ধাপ (session-এর ধাপের সাথে একই নাম), test-এর নাম ও "Change", ছোট note + "What this means", **Start practice**। Limit শেষ বা paused হলে কারণ button-এর পাশে দেখাবে।
3. **Pick up where you stopped**: নতুন ২টা, "All unfinished (n)" চাপলে সব। Row: type, skill, test, "x of y answered" বা "Not started", "Started … ago"।
4. **Due for review today**: সর্বোচ্চ ৩টা, বাকি থাকলে "Show all"। প্রতিটায় skill-এর নাম। Review চাপলে নিচে সেই type-এর card-এর panel খুলে যাবে।
5. **Question type cards**: All / Reading / Listening আর History। Group: Needs work (বর্তমান "Repeated difficulty" ও "Needs work"), Getting there ("Worth practising"), Strong, Not tried yet। Group heading থাকায় card-এ status badge নেই।
   - Card: skill, কয়টা set, type-এর নাম, এক লাইনের tip, bar, "x of y correct" বা "No results yet", "Practise"।
   - Desktop ৩ column, tablet ২, mobile ১।
   - Card চাপলে সেই সারির ঠিক নিচে full-width panel খোলে (test picker, Start practice)। একবারে একটাই খোলা। আবার চাপলে বন্ধ। Focus card-এই থাকে।
   - শুরুতে কয়েকটা card, তারপর "Show all"।
6. Writing ও Speaking-এর link এক লাইনে।

Mobile: একই ক্রম, এক column। লক্ষ্য: 375×812-এ প্রথম screen-এ Start practice দেখা যাবে।

## Session

- ধাপ: See your mistake / Try the questions / Check answers। Mistake না থাকলে ওই ধাপ দেখাবে না।
- "Save and exit" (বর্তমান save behaviour-ই থাকবে)।
- নিচে sticky bar: question number (উত্তর দেওয়াগুলো ভরা, চাপলে সেখানে যায়), "x of y answered", save-এর আসল অবস্থা, Check my answers। অনেক প্রশ্নে number-গুলো আড়াআড়ি scroll করবে। ফাঁকা থাকলে প্রথম চাপে সতর্ক করবে, দ্বিতীয় চাপে submit।
- Listening audio: native `<audio controls>` উপরে sticky, mobile-এ দুই tab-এই। Tab বদলালে audio থামবে না বা শুরুতে ফিরবে না।
- Reading mobile: passage / questions tab থাকবে।
- "Directive" ও "Listening Audio Source" label বাদ।

## Non-goals

Results screen, scoring, recommendation ranking, backend/DB/edge function, mobile (Expo) app, পুরনো unfinished session মুছে ফেলা।

## Constraints ও data

- `learner-panel-design` primitives, light ও dark দুটোই।
- Backend বদল লাগবে না: dashboard-এর session row-তে `answers`, `stage`, `created_at` আসে। `updated_at` নেই, তাই "শেষ কবে করেছেন" নয়, "কবে শুরু" দেখানো হবে। মোট প্রশ্নের সংখ্যা group থেকে আসবে কিনা implementation-এর শুরুতে যাচাই; না পেলে শুধু "x answered"।
- Dashboard সর্বশেষ ১০০টা session দেয়, তাই unfinished count সেই সীমার ভেতরের।

## যাচাই

Existing skill-lab test pass, নতুন behaviour-এর test, 375px ও desktop-এ browser check, CodeScene safeguard।
