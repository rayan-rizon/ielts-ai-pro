import React from 'react';
import QuickAddCard from './QuickAddCard';
import SimulationHub from './SimulationHub';
import NeuralProgress from './NeuralProgress';
import { playableWords } from '@/features/vocabulary/hooks/useVocabularyGames';
import UpcomingReviewsWidget from './UpcomingReviewsWidget';

export default function VocabularySidebar({
  user,
  allVocabularyCount = 0,
  isAdding,
  onAddWord,
  onShowAlert,
  onSuccess,
  onStartSpeedQuiz,
  onStartMatchPairs,
  onStartReview,
  retentionRefreshKey,
  dueForReview = [],
  allVocabulary = [],
}) {
  return (
    <div className="space-y-5">
      {/* Quick Add Word Card */}
      <div className="hidden lg:block">
        <QuickAddCard
          onAddWord={onAddWord}
          isAdding={isAdding}
          user={user}
          allVocabularyCount={allVocabularyCount}
          onShowAlert={onShowAlert}
          onSuccess={onSuccess}
        />
      </div>

      {/* Retention Progress & Weekly Active Days Tracker */}
      <NeuralProgress user={user} refreshKey={retentionRefreshKey} />

      {/* Upcoming Review Timeline */}
      <UpcomingReviewsWidget
        dueForReview={dueForReview}
        allVocabulary={allVocabulary}
        onStartReview={onStartReview}
      />

      {/* Practice Arena Games */}
      <SimulationHub
        onStartSpeedQuiz={onStartSpeedQuiz}
        onStartMatchPairs={onStartMatchPairs}
        wordCount={playableWords(allVocabulary).length}
      />
    </div>
  );
}
