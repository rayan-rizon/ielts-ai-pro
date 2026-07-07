import React from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import { DetailedSkillBreakdown } from './DetailedSkillBreakdown';
import { SectionCard } from './SectionCard';
import { AnimatedScoreRing } from './AnimatedScoreRing';
import { PremiumUnlockOverlay } from './PremiumUnlockOverlay';
import { TimeEfficiencyCard } from '../TimeEfficiencyCard';
import { SkillGapRadar } from '../SkillGapRadar';
import { CognitiveInsightsCard } from '../CognitiveInsightsCard';
import { AnswerJourneyCard } from '../AnswerJourneyCard';
import { ActionableInsightsCard } from '../ActionableInsightsCard';

// Subcomponent for the left analysis column to reduce complexity
const LeftAnalysisColumn = React.memo(
  ({ testResults, isPremium, onUpgrade, testType, totalTimeSeconds }) => (
    <div className="lg:col-span-7 space-y-6" data-oid="4zfd52b">
      <section
        className="p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm"
        data-oid=".d:.-74"
      >
        <DetailedSkillBreakdown
          typeStats={testResults.typeStats}
          sectionStats={testResults.sectionStats}
          testType={testType}
          totalQuestions={testResults.totalQuestions}
          correctAnswers={testResults.correctAnswers}
          bandScore={testResults.bandScore}
          isLocked={!isPremium}
          onUpgrade={onUpgrade}
          data-oid="s-rhgwt"
        />
      </section>

      {isPremium && (
        <AnswerJourneyCard
          answerTimestamps={testResults.answerTimestamps || null}
          totalQuestions={testResults.totalQuestions}
          totalTimeSeconds={totalTimeSeconds}
          testType={testType}
          data-oid="e2e7xvj"
        />
      )}

      <section data-oid="212x9pg">
        <div className="flex items-center justify-between mb-4" data-oid="6.k7dgn">
          <h3
            className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"
            data-oid="188gbpz"
          >
            {testType === 'listening' ? 'Part Performance' : 'Passage Performance'}
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-oid="zz75uo9">
          {testResults.sectionStats?.map((stat, idx) => (
            <SectionCard
              key={idx}
              index={idx}
              title={testType === 'listening' ? `Part ${idx + 1}` : `Passage ${idx + 1}`}
              {...stat}
              data-oid="fx-d5k7"
            />
          ))}
        </div>
      </section>

      {isPremium && (
        <CognitiveInsightsCard
          errorPatterns={testResults.errorPatterns || null}
          totalQuestions={testResults.totalQuestions}
          data-oid="t1zzzp2"
        />
      )}
    </div>
  )
);

LeftAnalysisColumn.displayName = 'LeftAnalysisColumn';

// Subcomponent for the Accuracy Analysis card
const AccuracyAnalysisCard = React.memo(({ testResults }) => (
  <section
    className="w-full p-6 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden flex flex-col items-center group"
    data-oid="6xblymw"
  >
    {/* Decorative Background Elements */}
    <div
      className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 blur-[50px] rounded-full -ml-16 -mt-16 pointer-events-none group-hover:bg-indigo-500/10 transition-all duration-700"
      data-oid="2zjdyht"
    />

    <div
      className="absolute bottom-0 right-0 w-48 h-48 bg-purple-500/5 blur-[60px] rounded-full -mr-20 -mb-20 pointer-events-none group-hover:bg-purple-500/10 transition-all duration-700"
      data-oid=":47r7z0"
    />

    <div className="flex items-center justify-between mb-5 relative z-10 w-full" data-oid="1q-rmk9">
      <div className="flex items-center gap-3" data-oid="r2a36y5">
        <div
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 transform group-hover:scale-110 transition-transform duration-500"
          data-oid="uwqho4b"
        >
          <Target className="w-5 h-5 text-white" data-oid="yghb32l" />
        </div>
        <div data-oid="w3g48.g">
          <h3
            className="text-base font-black text-slate-900 dark:text-white tracking-tight"
            data-oid="kl6k-5e"
          >
            Accuracy Analysis
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5" data-oid="3re07i4">
            <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" data-oid="s:cebde" />

            <p
              className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]"
              data-oid="imnajz5"
            >
              Performance Metric
            </p>
          </div>
        </div>
      </div>
    </div>

    <div
      className="relative py-4 transform group-hover:scale-105 transition-transform duration-500 z-10"
      data-oid="m.qv1m2"
    >
      <AnimatedScoreRing
        percentage={testResults.percentage}
        score={testResults.bandScore}
        size={200}
        data-oid="zhf325e"
      />
    </div>

    <div
      className="w-full mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80 relative z-10"
      data-oid="m7476qk"
    >
      <div className="grid grid-cols-2 gap-3" data-oid="uqi9v.x">
        <div
          className="flex flex-col items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-900 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-1"
          data-oid="y7bovti"
        >
          <p
            className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-1"
            data-oid="e:5vdvt"
          >
            {testResults.percentage}%
          </p>
          <p
            className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider"
            data-oid="9de9wkh"
          >
            Accuracy
          </p>
        </div>
        <div
          className="flex flex-col items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-900 hover:shadow-lg hover:shadow-purple-500/5 hover:-translate-y-1"
          data-oid="mqkv-3u"
        >
          <p
            className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-1"
            data-oid="al93d61"
          >
            {testResults.bandScore}
          </p>
          <p
            className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider"
            data-oid="zppvvx1"
          >
            Band Score
          </p>
        </div>
      </div>
    </div>
  </section>
));

AccuracyAnalysisCard.displayName = 'AccuracyAnalysisCard';

// Subcomponent for the right analysis column to reduce complexity
const RightAnalysisColumn = React.memo(
  ({ testResults, isPremium, onUpgrade, testType, totalTimeSeconds }) => (
    <div className="lg:col-span-5 space-y-6 flex flex-col items-stretch" data-oid="m88c8bd">
      <AccuracyAnalysisCard testResults={testResults} />

      {isPremium ? (
        <>
          <SkillGapRadar
            skillGaps={testResults.skillGaps || null}
            typeStats={testResults.typeStats}
            testType={testType}
            data-oid="_g58.9_"
          />

          <TimeEfficiencyCard
            timeMetrics={testResults.timeMetrics || null}
            passageProficiency={testResults.passageProficiency || null}
            totalQuestions={testResults.totalQuestions}
            testType={testType}
            data-oid="1x.ninl"
          />

          <ActionableInsightsCard
            sectionStats={testResults.sectionStats || null}
            timePerQuestionSeconds={testResults.timePerQuestionSeconds || null}
            correctAnswersMap={testResults.correctAnswersMap || null}
            totalTimeSeconds={totalTimeSeconds}
            testType={testType}
            data-oid="-xlq3d7"
          />
        </>
      ) : (
        <div
          className="relative h-[280px] w-full overflow-hidden rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50"
          data-oid="ejm9-ow"
        >
          <PremiumUnlockOverlay
            onUpgrade={onUpgrade}
            title="Unlock Pro Analysis"
            message="Get detailed breakdown, time tracking, and cognitive insights."
            data-oid="o7w.0-0"
          />
        </div>
      )}
    </div>
  )
);

RightAnalysisColumn.displayName = 'RightAnalysisColumn';

export const DetailedAnalysisTab = ({
  testResults,
  _isLocked,
  onUpgrade,
  isPremium,
  testType,
  totalTimeSeconds,
}) => (
  <motion.div
    key="analysis"
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 10 }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
    className="p-5 lg:p-7 space-y-6"
    data-oid="22y_iv."
  >
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" data-oid="458146t">
      <LeftAnalysisColumn
        testResults={testResults}
        isPremium={isPremium}
        onUpgrade={onUpgrade}
        testType={testType}
        totalTimeSeconds={totalTimeSeconds}
      />

      <RightAnalysisColumn
        testResults={testResults}
        isPremium={isPremium}
        onUpgrade={onUpgrade}
        testType={testType}
        totalTimeSeconds={totalTimeSeconds}
      />
    </div>
  </motion.div>
);
