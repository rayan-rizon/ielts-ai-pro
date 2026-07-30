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

export const endpointColors = {
  generateDetailedFeedback: '#8b5cf6',
  generateStudyRecommendations: '#06b6d4',
  generateAdaptiveLearningPath: '#3b82f6',
  processSpeakingSession: '#10b981',
  transcribeAudio: '#f59e0b',
  synthesizeSpeech: '#6366f1',
  evaluateSpeakingTest: '#ec4899',
  SpeakingSession: '#10b981',
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
