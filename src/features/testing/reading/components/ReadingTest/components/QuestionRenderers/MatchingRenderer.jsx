import React, { memo } from 'react';
import GenericMatchingRenderer from './matching/GenericMatchingRenderer';
import MatchingHeadingsRenderer from './matching/MatchingHeadingsRenderer';
import MatchingFeaturesRenderer from './matching/MatchingFeaturesRenderer';

const MatchingRenderer = memo(function MatchingRenderer(props) {
  const { question } = props;

  if (question.type === 'matching') {
    return <GenericMatchingRenderer {...props} />;
  }

  if (question.type === 'matching_headings') {
    return <MatchingHeadingsRenderer {...props} />;
  }

  if (question.type === 'matching_features') {
    return <MatchingFeaturesRenderer {...props} />;
  }

  return null;
});

export default MatchingRenderer;
