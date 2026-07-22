import React, { memo } from 'react';
import MatchingFeaturesParagraphMode from './MatchingFeaturesParagraphMode';
import MatchingFeaturesQuestionsMode from './MatchingFeaturesQuestionsMode';
import { getFeatureLabel } from './helpers';

function FeaturesBox({ matchingFeatures }) {
  const options = matchingFeatures?.options;
  if (!options?.some((opt) => opt?.trim())) return null;
  const boxTitle = matchingFeatures.box_title;
  const style = matchingFeatures.style;

  return (
    <div
      className="border border-slate-200 dark:border-slate-800 py-4 px-6 bg-white dark:bg-slate-900/40 mb-6 rounded-xl shadow-sm w-full max-w-3xl mx-auto relative overflow-hidden"
      data-oid="9j48.ng"
    >
      {boxTitle !== '' && (
        <h4
          className="font-bold text-center mb-3 text-foreground text-lg tracking-tight border-b border-slate-100 dark:border-slate-800 pb-2 uppercase"
          data-oid="tk5xf46"
        >
          {boxTitle || 'List of Features'}
        </h4>
      )}
      <div className="flex justify-center" data-oid="n541t:0">
        <div className="inline-block space-y-0" data-oid="75:0-jn">
          {options.map((opt, idx) => {
            const label = getFeatureLabel(idx, style);
            return (
              <div key={idx} className="flex gap-4 items-baseline px-4 py-0.5" data-oid="i:xgxfb">
                <span
                  className="font-bold text-blue-600 dark:text-blue-400 min-w-[1.5rem] text-[15px] text-right"
                  data-oid="z25a8kq"
                >
                  {label}.
                </span>
                <span className="text-foreground leading-relaxed text-[15px]" data-oid="0v50ild">
                  {opt}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const MatchingFeaturesRenderer = memo(function MatchingFeaturesRenderer(props) {
  const { question } = props;
  const isParagraphMode = question.matching_features?.mode === 'paragraph';

  return (
    <div className="space-y-4" data-oid="1lv1gjz">
      <FeaturesBox matchingFeatures={question.matching_features} />
      {isParagraphMode ? (
        <MatchingFeaturesParagraphMode {...props} />
      ) : (
        <MatchingFeaturesQuestionsMode {...props} />
      )}
    </div>
  );
});

export default MatchingFeaturesRenderer;
