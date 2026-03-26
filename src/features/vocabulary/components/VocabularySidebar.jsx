import React from 'react';
import QuickAddCard from './QuickAddCard';
import SimulationHub from './SimulationHub';
import NeuralProgress from './NeuralProgress';

export default function VocabularySidebar({
  user,
  allVocabularyCount,
  isAdding,
  onAddWord,
  onShowAlert,
  onSuccess,
  onStartSpeedQuiz,
  onStartMatchPairs,
  stats,
}) {
  return (
    <div className="space-y-6">
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

      <SimulationHub onStartSpeedQuiz={onStartSpeedQuiz} onStartMatchPairs={onStartMatchPairs} />

      <NeuralProgress stats={stats} />
    </div>
  );
}
