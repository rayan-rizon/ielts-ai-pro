import { callEdgeFunction } from '@/utils/api';

// One answer per request for this visit: switching tabs must not ask twice.
const answers = new Map();

export const forgetReportAssist = () => answers.clear();

const KNOWN_CODES = ['rate_limited', 'no_comparable_paragraph', 'credit_required', 'no_credit'];

function assistError(cause) {
  const code = KNOWN_CODES.includes(cause?.details?.code)
    ? cause.details.code
    : cause?.status === 429
      ? 'rate_limited'
      : 'unavailable';
  return Object.assign(new Error(cause?.message || 'Report extras are unavailable'), { code });
}

/** `writing-report-assist`: translated explanations or Band 7/8 paragraphs. */
export function requestReportAssist(request) {
  const key = JSON.stringify(request);
  if (!answers.has(key)) {
    const answer = (async () => {
      try {
        const reply = await callEdgeFunction('writing-report-assist', request);
        if (!reply?.data) throw new Error('Empty answer');
        return reply.data;
      } catch (error) {
        answers.delete(key);
        throw assistError(error);
      }
    })();
    answers.set(key, answer);
  }
  return answers.get(key);
}
