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
      className="rounded-lg border border-[#ebeaf7] bg-[#fbfbfe] dark:border-white/8 dark:bg-white/3 py-3.5 px-5 mb-3 w-full max-w-3xl mx-auto"
      data-oid="9j48.ng"
    >
      {boxTitle !== '' && (
        <h4
          className="font-bold text-center mb-2.5 text-foreground text-sm tracking-tight border-b border-[#ebeaf7] dark:border-white/8 pb-2 uppercase"
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
                  className="font-bold text-[#5a63df] dark:text-[#a9afff] min-w-6 text-[15px] text-right"
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
