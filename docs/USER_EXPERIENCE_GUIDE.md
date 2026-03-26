# IELTS AI Pro: User Dashboard & Experience Guide

## 1. Overview
**IELTS AI Pro** is a premium, AI-powered preparation platform designed to help students achieve their target IELTS band scores. The application combines official Cambridge-style testing with advanced AI insights, personalized study routines, and real-time performance analytics.

This document serves as the **Single Source of Truth** for the user experience, detailing every major flow, logic gate, and interaction within the platform.

---

## 2. Core User Dashboard (Mission Control)

The dashboard is designed for high-frequency use, offering a "Bento-style" layout that prioritizes snackable data and quick actions.

### 2.1. Hero & Stats Bar
*   **Personalized Greeting**: Dynamic "Good Morning/Afternoon/Evening" based on local time.
*   **Goal Indicator**: Visual feedback showing the distance between the current predicted score and the User's `target_band_score`.
*   **Smart Resume Button**: An intelligent call-to-action that deep-links to:
    *   The next incomplete task in the `LearningPath`.
    *   OR a "Need Improvement" module if recent performance dropped.
*   **Live Metrics**:
    *   **Streak**: Consecutive days of study. Logic: Increments if at least one activity is completed in a 24h UTC window.
    *   **XP/Level**: Gamification elements. XP is awarded for passing tests (e.g., +50xp) or completing daily goals (+20xp).
    *   **Efficiency**: A calculated metric: `(Completed Tasks / Scheduled Tasks) * 100`.

### 2.2. Training Launchpad
Four primary modules allow users to enter focused practice sessions:
*   **Reading**: Access to full-length Cambridge tests.
*   **Listening**: Audio-based testing with integrated controls.
*   **Writing**: Task 1 (Graph/Letter) & Task 2 (Essay) editors with AI grading.
*   **Speaking**: Real-time voice interaction with an AI Examiner.

### 2.3. Analytics & Progress
*   **Weekly Momentum**: A bar chart tracking study time and test frequency over the last 7 days.
*   **Skill Radar (Spider Chart)**: Visualizes balance across Refading, Writing, Listening, and Speaking. Use this to spot imbalances (e.g., Strong Reader, Weak Speaker).
*   **Engagement Heatmap**: A "GitHub-style" contribution graph showing long-term consistency over the year.
*   **Score Forecast**: AI prediction of the next official band score based on a weighted average of the last 5 tests.

---

## 3. Product Flows & Journeys

### 3.1. The Auth Flow
The entry point for all users.
1.  **Landing**: User arrives and clicks "Get Started".
2.  **Auth Selection**:
    *   **Google OAuth**: One-click sign-up using Supabase Auth.
    *   **Email/Password**: Standard sign-up with email confirmation requirement.
3.  **Role Check**:
    *   **Admin**: Redirects to `/admin` panel.
    *   **User**: Checks `onboarding_completed` flag.
        *   If `false` → Redirect to `/onboarding`.
        *   If `true` → Redirect to `/dashboard`.

### 3.2. The Onboarding Flow
Critical for personalizing the AI engine.
1.  **Welcome**: Introduction to the platform's value proposition.
2.  **Target Setting**: User selects their goal (e.g., Band 7.5).
3.  **Exam Timeline**: User inputs their test date. Logic: Used to calculate urgency and daily intensity.
4.  **Availability**: User sets "Weekly Study Hours". Logic: Determines how many tasks are generated per day in the Learning Path.
5.  **Weakness Identification**: User selects focus areas (e.g., "Writing").
6.  **Generation**: System calls `generateAdaptiveLearningPath` to build the initial schedule.

### 3.3. The Reading Test Journey
A full simulation of the official computer-delivered IELTS Reading test.
1.  **Initialization**:
    *   User selects a test (e.g., "Cambridge 18, Test 1").
    *   System loads `ReadingTest.jsx`. Data is fetched via `useReadingTestLogic`.
2.  **The Interface (Split Screen)**:
    *   **Left Panel**: Scrollable Passage text.
    *   **Right Panel**: Questions (Multiple Choice, Gap Fill, Matching Headings).
    *   **Tools**:
        *   **Highlighting**: Select text -> Click color in floating menu.
        *   **Dictionary**: Double-click any word -> Popup definition + "Add to Vocab" button.
        *   **Notes**: Slide-over panel to jot down thoughts per question.
3.  **In-Test Logic**:
    *   **Timer**: 60-minute countdown. Auto-submits at 0:00.
    *   **Navigation**: "Review later" flag for doubtful answers.
    *   **Resizer**: User can drag the center divider to adjust panel width.
4.  **Submission**:
    *   **Validation**: Warns about unanswered questions.
    *   **Analytics**: Tracks time spent per passage (Time-Waster metrics).
5.  **Results**:
    *   Instant Band Score calculation (e.g., 35/40 = Band 8.0).
    *   **Review Mode**: User can re-enter the test in "Read-only" mode to see correct answers and explanations.

### 3.4. The Speaking Test Journey
A technically complex flow simulating a live Zoom interview with an examiner.
1.  **Setup**:
    *   **Microphone Permission**: Browser request triggered immediately.
    *   **Voice Load**: Chrome TTS voices are preloaded.
    *   **Start**: User clicks "Start Test" (Required user gesture for audio).
2.  **Part 1 (The Interview)**:
    *   **AI Speaker**: "Hello, let's talk about [Topic]..."
    *   **User Action**: Speeds freely.
    *   **Silence Detection**: The visualizer monitors audio levels. If silence > 2s, the system auto-submits the chunk.
    *   **Processing**: Audio sent to Edge Function -> STT (Speech-to-Text) -> AI Response generation -> TTS (Text-to-Speech) playback.
3.  **Part 2 (The Long Turn)**:
    *   **Prep Phase**: 1-minute strict timer. User sees a "Cue Card" (Topic + bullet points).
    *   **Performance**: 2-minute recording window. User must speak continuously.
4.  **Part 3 (Discussion)**: Deep dive questions based on Part 2.
5.  **Evaluation**:
    *   Post-test, the AI aggregates all 3 parts.
    *   **Grading**: Provides Fluency, Lexical Resource, Grammatical Range, and Pronunciation scores (0-9).
    *   **Feedback**: Specific tips on how to improve (e.g., "Use more complex connectors").

### 3.5. The AI Learning Path Flow
The "Brain" of the operation.
1.  **Daily Schedule**:
    *   The `LearningPath.jsx` page renders a 7-day calendar.
    *   Each day contains 2-4 tasks (e.g., "Action: Complete Reading Test 4").
2.  **Task Execution**:
    *   Internal Tasks: Link directly to app modules.
    *   External Tasks: Checkbox for "I read an article". User self-reports time spent.
3.  **Update Strategy**:
    *   Button available on the path UI.
    *   **Logic**: Scans the user's `test_sessions` and `skill_map` from the last 7 days.
    *   **Outcome**: Regenerates the future schedule. If Writing score dropped, adds more Writing tasks next week.

### 3.6. The Subscription Flow
1.  **Access Control**:
    *   Free Tier: Restricted to 1 test per day. No AI feedback.
    *   Pro Tier: Unlimited tests. Basic AI.
    *   Premium Tier: Full AI Learning Path + Predictive Analytics.
2.  **Pricing Page**:
    *   **Geo-Location**: IP detection determines if user is in "Tier 2" country (e.g., Bangladesh).
    *   **Currency**: Toggles between USD ($) and Local (BDT ৳).
3.  **Payment**:
    *   **Stripe**: Standard global checkout session.
    *   **Manual (Bangladesh)**: Modal showing bKash/Nagad numbers -> User uploads Transaction ID -> Admin approves manually.

---

## 4. Key Technical Logic

### 4.1. Lazy Loading Strategy
To maintain a "Premium" feel (LCP < 1.0s), heavy components are lazy-loaded:
*   `ReadingTest.jsx`: The entire test engine is split. `ReadingTestQuestionsSidebar` and `ReadingTestSheet` load only when the route is active.
*   **Result Modals**: `TestResultsModal` and `ConfettiCelebration` are downloaded only upon test submission.

### 4.2. Edge Function Orchestration
We move complex logic out of the browser to Supabase Edge Functions:
*   `processSpeakingSession`: Handles the heavy lifting of OpenAI Audio API calls + Prompt engineering for the examiner persona.
*   `generateAdaptiveLearningPath`: Runs the complex algorithm that weighs user history to prescribe future tasks.

### 4.3. State Management
*   **React Query**: Used for all server state (User profile, Dashboard stats). Stale times are tuned (e.g., Stats: 2 mins, Path: 30 mins).
*   **Context API**: Used for "Session" state. `ReadingTestContext` holds the transient state of 40 answers + flags to prevent prop drilling.
*   **Local Storage**: Used for "pessimistic" backups. If the browser crashes mid-test, answers are recovered from `localStorage`.

---

## 5. Admin & Management Flows

### 5.1. Content Management
Admins can upload Cambridge tests via JSON/CSV import.
*   **Validators**: Ensure every reading passage has exactly 13-14 questions and unique IDs.

### 5.2. User Management
*   **Manual Upgrades**: Admin can override a user's subscription tier (useful for manual payment verification).
*   **Impersonation**: Admin can "View as User" to debug specific account issues.

---

## 6. Future Considerations
*   **Offline Mode**: Caching test content for PWA capabilities.
*   **Mobile App**: React Native adaptation of the Speaking interface.
*   **Tutor Mode**: Connecting real human tutors for "Premium Plus" users.
