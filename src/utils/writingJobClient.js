/** Pending identifiers survive a refresh; essays and reports are never stored here. */
export async function waitForWritingJob({
  start,
  getStatus,
  storage,
  key,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now = Date.now,
  timeoutMs = 10 * 60 * 1000,
}) {
  let job = null;
  try {
    const saved = JSON.parse(storage?.getItem(key) || 'null');
    if (saved?.jobId && now() - saved.createdAt < 86400000) job = saved;
  } catch {
    /* Storage can be unavailable in private mode. */
  }
  const remember = (value) => {
    try {
      storage?.setItem(key, JSON.stringify(value));
    } catch {
      /* Optional persistence. */
    }
  };
  const clear = () => {
    try {
      storage?.removeItem(key);
    } catch {
      /* Optional persistence. */
    }
  };
  if (!job) {
    const result = await start();
    if (!result.pending) return result;
    if (!result.jobId) throw new Error('The review service did not return a job identifier.');
    job = { jobId: result.jobId, createdAt: now() };
    remember(job);
  }
  const deadline = now() + timeoutMs;
  let failures = 0;
  let polls = 0;
  while (now() < deadline) {
    await sleep(Math.min(5000, 500 + polls * 500));
    let status;
    try {
      status = await getStatus(job.jobId);
      failures = 0;
    } catch (error) {
      // A deleted/expired job is safe to resubmit: the server recovers the
      // completed quota result or denies duplicate provider work.
      if (error?.code === '42501') {
        clear();
        return waitForWritingJob({
          start,
          getStatus,
          storage,
          key,
          sleep,
          now,
          timeoutMs: Math.max(0, deadline - now()),
        });
      }
      if (++failures >= 5) throw error;
      polls += 1;
      continue;
    }
    if (status?.state === 'completed' && status.response?.success === true) {
      clear();
      return status.response;
    }
    if (status?.state === 'failed') {
      clear();
      const error = new Error(
        status.response?.error || 'The review could not finish. Please retry.'
      );
      error.status = status.responseStatus;
      if (error.status === 429) error.name = 'RateLimitError';
      error.details = status.response;
      error.rateLimitType = status.response?.rateLimitType;
      error.quotaInfo = status.response;
      throw error;
    }
    polls += 1;
  }
  const error = new Error(
    'Your review is still running. Check again shortly to recover the result.'
  );
  error.name = 'WritingPendingError';
  throw error;
}
