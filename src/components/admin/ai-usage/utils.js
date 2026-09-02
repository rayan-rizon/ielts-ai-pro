export const formatCost = (cost) => {
  if (cost == null) return '$0.00';
  if (cost < 0.01 && cost > 0) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
};

export const formatNumber = (num) => {
  if (num == null) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// One hue family (indigo → violet), varied by shade rather than by rainbow
// hue, so the chart reads as part of the graphite instrument-panel theme
// instead of a rainbow of unrelated colors.
export const endpointColors = {
  generateDetailedFeedback: '#4f46e5', // indigo-600
  generateStudyRecommendations: '#6366f1', // indigo-500
  generateAdaptiveLearningPath: '#818cf8', // indigo-400
  processSpeakingSession: '#7c3aed', // violet-600
  transcribeAudio: '#a78bfa', // violet-400
  synthesizeSpeech: '#4338ca', // indigo-700
  evaluateSpeakingTest: '#8b7cf6', // violet-500
  SpeakingSession: '#7c3aed',
};

export const formatEndpointName = (endpoint) => {
  if (!endpoint) return '';
  const mapping = {
    generateDetailedFeedback: 'Detailed Feedback',
    generateStudyRecommendations: 'Study Recommendations',
    generateAdaptiveLearningPath: 'Adaptive Learning Path',
    processSpeakingSession: 'Speaking Session',
    transcribeAudio: 'Transcribe Audio',
    synthesizeSpeech: 'Synthesize Speech',
    evaluateSpeakingTest: 'Evaluate Speaking Test',
    SpeakingSession: 'Speaking Session',
  };
  if (mapping[endpoint]) return mapping[endpoint];
  return endpoint
    .replace(/^generate/, '')
    .replace(/^process/, '')
    .replace(/([A-Z])/g, ' $1')
    .trim();
};

export const getModelForEndpoint = (endpoint) => {
  const mapping = {
    generateDetailedFeedback: 'Gemini 2.5 Flash',
    processSpeakingSession: 'Gemini 2.5 Flash',
    transcribeAudio: 'Gemini 2.5 Flash',
    generateStudyRecommendations: 'Gemini 2.5 Flash-Lite',
    evaluateSpeakingTest: 'Gemini 2.5 Flash',
    generateAdaptiveLearningPath: 'Gemini 2.5 Flash-Lite',
    synthesizeSpeech: 'Google Cloud TTS',
    SpeakingSession: 'Gemini 2.5 Flash',
  };
  return mapping[endpoint] || 'Gemini Flash';
};
