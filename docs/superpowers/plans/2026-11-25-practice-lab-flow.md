# Practice Lab Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Practice Lab খুললেই learner একটা পরের কাজ দেখবে, আর শুরু করা set সহজে শেষ করতে পারবে।

**Architecture:** শুধু web frontend বদলাবে। `PracticeHome.jsx` (১৩৪৪ লাইন) ভেঙে `components/home/`-এ আলাদা section হবে, আর হিসাবগুলো pure function হিসেবে `practiceHomeModel.js`-এ যাবে। Session-এর নতুন bar আলাদা component হবে। Data fetching, autosave ও submit যেমন আছে তেমন থাকবে।

**Tech Stack:** React, Tailwind, framer-motion, TanStack Query, Vitest + Testing Library

**Spec:** `docs/superpowers/specs/2026-11-25-practice-lab-flow-design.md` · Mockup: https://claude.ai/artifact/HSByB6UGQd6rUdJSmGKtCd

## Global Constraints

- Primitives শুধু `@/features/dashboard/components/primitives.jsx` থেকে। Glassmorphism ও ভারী shadow নয়। Light ও dark দুটোই।
- Backend, DB, edge function, scoring, ranking, results screen ও Expo app বদলাবে না।
- UI copy British English: "practise" verb, "practice" noun।
- নতুন পড়ার লেখা অন্তত 11px।
- 375px-এ horizontal scroll নয়, আর 375×812-এর প্রথম screen-এ **Start practice** দেখা যাবে।
- প্রতিটা task শেষে `npx vitest run src/features/skill-lab` pass করবে। বদলানো source file-এ CodeScene `code_health_review`, আর commit-এর আগে `pre_commit_code_health_safeguard`।
- Commit করার আগে user-এর অনুমতি। `main`-এ নয়, `feat/practice-lab-flow` branch-এ।

## Review Focus

1. Session-এর `group_id` আর `data.groups`-এ নেই: row-তে "x answered" দেখাবে, "of y" বা `NaN` নয়। (Task 1)
2. Multi-select বা nested matching: answered count আসল question number অনুযায়ী হবে, y ছাড়াবে না। খালি string ও খালি array উত্তর নয়। (Task 1)
3. Learning Path থেকে আসা `focus`-এর set নেই: fallback notice থাকবে, Start চালু থাকবে। (Task 3, বিদ্যমান test রাখা)
4. ফাঁকা-সতর্কতার পরে উত্তর বদলালে সতর্কতা reset হবে, যাতে পরের চাপ হঠাৎ submit না করে। (Task 4)
5. Mobile-এ tab বদলানো বা answer দেওয়া: listening audio remount হবে না। (Task 5)

## File Structure

`src/features/skill-lab/` এর ভেতরে:

- `practiceHomeModel.js` (+ `.test.js`): status, answered count, relative date
- `components/home/StartHereCard.jsx`: প্রধান card
- `components/home/QueuePanels.jsx`: unfinished ও due review
- `components/home/TypeCards.jsx`: filter, History, group করা card, inline panel
- `components/home/SourceSetPicker.jsx`: বর্তমান picker, হুবহু সরানো
- `components/PracticeHome.jsx`: state ও সাজানো
- `components/SessionProgressBar.jsx`: sticky নিচের bar
- `pages/LibraryPracticeLab.jsx`: session label, bar, audio
- `components/ResumeList.jsx`: কাজ `QueuePanels`-এ গেলে মুছবে (অন্য import না থাকলে)

---

### Task 1: Home ও session-এর হিসাব

**Files:** Create `practiceHomeModel.js`, `practiceHomeModel.test.js`

**Interfaces (Produces):**

- `typeStatus(need) -> 'needs_work' | 'getting_there' | 'strong' | 'untried'`: `!need?.total` → untried; ratio `< 0.5` needs_work; `< 0.8` getting_there; বাকি strong
- `answeredCount(answers, total?) -> number`: array উত্তরের প্রতিটা অ-খালি item ১ করে; `null`, `''`, blank, `[]` বাদ; `total > 0` হলে clamp
- `startedAgo(createdAt, now = Date.now()) -> string`: "Started today" | "Started yesterday" | "Started 4 days ago" | `''` (invalid)
- `sessionSummary(session, group, now) -> string`: parts " · " দিয়ে: "Listening", group title, "2 of 4 answered" / "2 answered" / "Not started", startedAgo
- `questionSlots(questions, answers) -> Array<{ id: string, number: number, answered: boolean }>`: `reviewItems()` থেকে (`practiceReview.js`), number অনুযায়ী সাজানো

- [ ] **Step 1: Failing test লিখুন**

```js
expect(typeStatus(undefined)).toBe('untried');
expect(typeStatus({ correct: 0, total: 16 })).toBe('needs_work');
expect(typeStatus({ correct: 1, total: 2 })).toBe('getting_there');
expect(typeStatus({ correct: 4, total: 5 })).toBe('strong');
expect(answeredCount({ a: 'A', b: '', c: [], d: ['B', 'C'] })).toBe(3);
expect(answeredCount({ d: ['A', 'B', 'C'] }, 2)).toBe(2);
expect(sessionSummary({ focus: 'reading:x', answers: { a: 'A' } }, undefined, 0)).toBe(
  'Reading · 1 answered'
);
const slots = questionSlots(
  [
    {
      id: 'm',
      type: 'multiple_choice',
      allow_multiple: true,
      question_count: 2,
      question_number: 11,
    },
  ],
  { m: ['A'] }
);
expect(slots.map((s) => [s.number, s.answered])).toEqual([
  [11, true],
  [12, false],
]);
```

আরও যোগ করুন: nested matching-এর দুই item-এ একটা উত্তর → `[true, false]`; `startedAgo`-র চারটা ফল।

- [ ] **Step 2:** `npx vitest run src/features/skill-lab/practiceHomeModel.test.js` → FAIL
- [ ] **Step 3:** function-গুলো implement করুন। শুরুতে প্রতিটা answer key-এর shape `components/` ও testing renderer থেকে যাচাই করুন। Multi-select উত্তর `question.id`-তে array বা আলাদা `_option_N` key, যেটাই হোক, `questionSlots` সেটা ধরবে এবং test আসল shape ব্যবহার করবে।
- [ ] **Step 4:** একই command → PASS
- [ ] **Step 5:** Commit `feat(practice-lab): add home and session progress model`

### Task 2: `SourceSetPicker` আলাদা করা (behaviour বদল নয়)

**Files:** Create `components/home/SourceSetPicker.jsx`; Modify `components/PracticeHome.jsx`

**Interfaces (Produces):** default export `SourceSetPicker`, বর্তমান props অপরিবর্তিত। সাথে যাবে `SourceSetOption`, `usePickerDismiss`, `useAnchoredPosition`, `computeNextNavIndex` ও familiarity helper।

- [ ] **Step 1:** `npx vitest run src/features/skill-lab` → PASS (baseline)
- [ ] **Step 2:** code সরান, shared helper এক জায়গায় রাখুন
- [ ] **Step 3:** একই command → PASS, কোনো test না বদলে
- [ ] **Step 4:** Commit `refactor(practice-lab): extract source set picker`

### Task 3: নতুন Home

**Files:** Create `components/home/{StartHereCard,QueuePanels,TypeCards}.jsx`; Modify `components/PracticeHome.jsx`, `libraryPracticePage.test.jsx`; Delete `components/ResumeList.jsx` (grep-এ অন্য import না থাকলে)

**Interfaces:**

- Consumes: Task 1-এর `typeStatus`, `sessionSummary`; Task 2-এর picker; `PracticeHome`-এর props অপরিবর্তিত
- `StartHereCard({ focus, need, set, sets, onSetChange, canStart, blockedReason, busy, onStart })`
- `QueuePanels({ sessions, groupsById, due, onReview })`, `onReview(focus: string)`
- `TypeCards({ groups, needs, subjectFilter, onSubjectChange, openFocus, onToggle, renderPanel })`, `renderPanel(focus) -> ReactNode`

**Spec-এর fixed copy ও মান:**

- Header: "Work on the question types you get wrong, one short set at a time."; limit থাকলে "Sets left today: {remaining} / {limit}"; ৩টা Stat বাদ
- Card: "Start here", "You got {correct} of {total} correct in recent tests." (result না থাকলে বর্তমান no-result copy), "See those results", **Start practice**, "Change" (picker খোলে)
- ৩ ধাপ: "See your mistake", "Try the questions", "Check answers"
- Note: "Part of this source test will count as practised." + "What this means" disclosure-এ বর্তমান warning-এর পুরো অর্থ। Note দেখানোর বর্তমান শর্ত রাখা
- Queue: "Pick up where you stopped" নতুন ২টা (`created_at` desc), "All unfinished ({n})"; "Due for review today" ৩টা, বেশি হলে "Show all"; প্রতি row-তে skill
- Cards: heading "Choose a question type yourself"; group "Needs work", "Getting there", "Strong", "Not tried yet" (খালি group বাদ); শুরুতে এই ক্রমে ৬টা, তারপর "Show all {n} question types"
- Grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`; card-এ skill, "{n} sets", নাম, tip, bar, "{c} of {t} correct" / "No results yet", "Practise" / "Close"; status pill নেই
- Footer এক লাইন: "Writing and speaking have their own practice:" + দুই link

**Layout algorithm:** panel card-এর সারির নিচে দেখাতে JS-এ column মাপবেন না। Grid-এ খোলা card-এর পরেই `col-span-full` panel render করুন, আর grid-এ `grid-flow-row-dense` দিন, যাতে পরের card ফাঁকা জায়গা ভরে এবং panel সারির নিচে নামে। DOM order card → panel থাকবে, তাই keyboard ও screen reader order ঠিক থাকবে।

- [ ] **Step 1:** Failing test (fixture-এ দরকারি `recommendations`/`sessions` যোগ করে)

```js
// একটাই প্রধান CTA, কোনো card খোলার আগে
expect(await screen.findAllByRole('button', { name: 'Start practice' })).toHaveLength(1);
// ৩টা unfinished-এ নতুন ২টা
expect(screen.getAllByRole('link', { name: /Resume/ })).toHaveLength(2);
fireEvent.click(screen.getByRole('button', { name: 'All unfinished (3)' }));
expect(screen.getAllByRole('link', { name: /Resume/ })).toHaveLength(3);
// card খোলা ও বন্ধ
const card = screen.getByRole('button', { name: /Summary completion/ });
fireEvent.click(card);
expect(card).toHaveAttribute('aria-expanded', 'true');
expect(screen.getByRole('region', { name: 'Selected question type' })).toBeInTheDocument();
expect(card).toHaveFocus();
fireEvent.click(card);
expect(screen.queryByRole('region', { name: 'Selected question type' })).toBeNull();
```

আরও দুটো test: একই label-এর reading ও listening due row-তে আলাদা skill দেখা যায়; Review চাপলে filter-এ লুকানো বা "Show all"-এর পেছনের card-ও দেখা যায় ও খোলে (`onReview` filter `all` করবে, খোলা card সবসময় visible)।

- [ ] **Step 2:** বিদ্যমান test update করুন: "Review and practise" → "Start practice", "Sets left today" assertion, দুই-CTA test (লাইন ~515–529)। Quota, paused, unavailable focus ও request payload-এর assertion দুর্বল করবেন না। তারপর run → নতুন test FAIL
- [ ] **Step 3:** component-গুলো বানান। পুরনো auto-scroll-ও focus-সরানো effect বাদ; focus card-এ থাকবে। শুধু `onReview` থেকে খুললে সেই card-এ scroll ও focus। `start`-এ পাঠানো argument অপরিবর্তিত। বর্তমান alert ও History list রাখুন, History থাকবে toggle button-এ
- [ ] **Step 4:** `npx vitest run src/features/skill-lab` → PASS
- [ ] **Step 5:** `PracticeHome.jsx`-এর skeleton (`LibraryPracticeLab.jsx`-এর dashboard অংশ) নতুন layout-এর সাথে মেলান
- [ ] **Step 6:** CodeScene review, commit `feat(practice-lab): one-next-step home with grouped type cards`

### Task 4: Session ধাপ ও নিচের bar

**Files:** Create `components/SessionProgressBar.jsx`; Modify `pages/LibraryPracticeLab.jsx`, `libraryPracticePage.test.jsx`

**Interfaces:**

- Consumes: `questionSlots`
- `SessionProgressBar({ slots, saveState, busy, onJump, onSubmit })`, `saveState: 'idle' | 'saving' | 'saved' | 'error'`, `onJump(slot)`

**আচরণ:**

- ধাপ: "See your mistake" / "Try the questions" / "Check answers"; "Save and exit" বর্তমান `save` চালাবে
- Bar: `sticky bottom-0`, safe-area padding; number button আড়াআড়ি scroll, `aria-label="Go to question {number}, answered|blank"`; "{x} of {y} answered"
- Save লেখা আসল autosave থেকে: "Saving…", "Saved", "Not saved yet. We will try again when you change an answer."; idle হলে কিছু নয়। Request সফল হওয়ার আগে "Saved" নয়
- ফাঁকা থাকলে প্রথম চাপে submit নয়: "{n} still blank. Press Check my answers again to submit." (`role="status"`)। যেকোনো answer বদলালে reset
- Jump: mobile-এ Questions tab, তারপর সেই question-এ scroll। Renderer-এ id না থাকলে `QuestionBody`-র wrapper-এ `data-question-id` দিন; nested item-এ wrapper পর্যন্ত গেলেই চলবে
- "Directive" pill ও "Listening Audio Source" footer বাদ
- "See your mistake" ধাপের "Start practising" button অপরিবর্তিত; mistake না থাকলে ওই ধাপ নেই

- [ ] **Step 1:** Failing test

```js
expect(await screen.findByText('0 of 1 answered')).toBeInTheDocument();
fireEvent.click(screen.getByRole('button', { name: 'Check my answers' }));
expect(
  screen.getByText('1 still blank. Press Check my answers again to submit.')
).toBeInTheDocument();
expect(submitCalls()).toHaveLength(0); // helper: invoke call যেখানে action === 'submit'
fireEvent.click(screen.getByRole('button', { name: 'Check my answers' }));
await waitFor(() => expect(submitCalls()).toHaveLength(1));
```

আরও: সতর্কতার পরে উত্তর দিলে লেখা চলে যায় ও "1 of 1 answered"; autosave reject করলে "Not saved yet…" দেখা যায়, "Saved" নয়।

- [ ] **Step 2:** blank অবস্থায় এক চাপে submit ধরা বিদ্যমান test ও `Directive` assertion (লাইন ~592) update করুন → নতুন test FAIL
- [ ] **Step 3:** implement করুন; `flushAutosave` থেকে `saveState` দিন, পুরনো request-এর ফল নতুন pending change-কে "Saved" বলবে না
- [ ] **Step 4:** `npx vitest run src/features/skill-lab` → PASS
- [ ] **Step 5:** CodeScene review, commit `feat(practice-lab): show session progress and guard blank submit`

### Task 5: Listening audio সবসময় হাতের কাছে

**Files:** Modify `pages/LibraryPracticeLab.jsx`, `libraryPracticePage.test.jsx`

**আচরণ:** `module === 'listening'` হলে `Source` দুই-column grid ও mobile tab-এর বাইরে, উপরে `sticky top-0` wrapper-এ থাকবে (mobile header থাকলে তার নিচে)। Listening-এ passage/questions tab থাকবে না, questions পুরো width নেবে। Native `<audio controls>`। Review ও results-এও একই layout। Reading অপরিবর্তিত।

- [ ] **Step 1:** Failing test (listening fixture)

```js
const audio = await waitFor(() => {
  const el = document.querySelector('audio');
  expect(el).not.toBeNull();
  return el;
});
expect(screen.queryByRole('button', { name: 'Passage / audio' })).toBeNull();
fireEvent.click(screen.getByRole('button', { name: /^A/ }));
expect(document.querySelector('audio')).toBe(audio);
```

সাথে reading session-এ "Passage / audio" tab এখনো আছে।

- [ ] **Step 2:** run → FAIL
- [ ] **Step 3:** implement করুন; sticky অংশ ছোট রাখতে লম্বা instruction wrapper-এর বাইরে রাখুন
- [ ] **Step 4:** `npx vitest run src/features/skill-lab` → PASS
- [ ] **Step 5:** commit `fix(practice-lab): keep listening audio visible with the questions`

### Task 6: পুরো যাচাই

- [ ] `npx vitest run src/features/skill-lab`, `npx eslint src/features/skill-lab`, `npx vite build` → error নেই
- [ ] Browser-এ 375×812 ও 1440×900, light ও dark: `scrollWidth === innerWidth`; প্রথম screen-এ Start practice; ১, ২, ৩ column-এ card panel সারির নিচে; sticky bar শেষ প্রশ্ন ঢাকে না; audio চালু রেখে scroll। নতুন set শুরু বা submit করবেন না, কারণ আসল account-এর quota ও history বদলায়
- [ ] CodeScene `pre_commit_code_health_safeguard` pass
