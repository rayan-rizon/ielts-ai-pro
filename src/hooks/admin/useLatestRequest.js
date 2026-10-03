import { useEffect, useMemo, useRef } from 'react';

/** Prevent a superseded request or an unmounted page from applying its result. */
export function useLatestRequest() {
  const generation = useRef(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      generation.current += 1;
    };
  }, []);
  return useMemo(
    () => ({
      start: () => ++generation.current,
      isCurrent: (request) => mounted.current && request === generation.current,
      invalidate: () => {
        generation.current += 1;
      },
    }),
    []
  );
}
