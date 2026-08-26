import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const AUTOSAVE_INTERVAL_MS = 30000;
const MIN_SAVE_GAP_MS = 5000; // Minimum gap between saves to avoid rate limiting

/**
 * Sleep utility
 */
const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * User response format for Writing tests
 */
export interface WritingResponse {
  response?: string;
  task1_response?: string;
  task2_response?: string;
  word_count?: number;
  [key: string]: unknown;
}

/**
 * Generic answers type - can be array (Writing) or object (Reading/Listening)
 */
export type Answers = WritingResponse[] | Record<string, unknown>;

/**
 * Content data stored with the session
 */
export interface ContentData {
  last_saved_at?: string;
  [key: string]: unknown;
}

/**
 * Test session object for autosave
 */
export interface AutosaveSession {
  id: string;
  user_responses?: WritingResponse[];
  content_data?: ContentData;
  [key: string]: unknown;
}

/**
 * Queued save item for retry
 */
interface QueuedSave {
  answers: Answers;
  contentData: ContentData;
  timestamp: number;
}

/**
 * Options for useAutosave hook
 */
export interface UseAutosaveOptions {
  /** Current test session */
  session: AutosaveSession | null;
  /** Function to get current answers */
  getAnswers: () => Answers | null;
  /** Function to get extra content_data (time, audio position, etc.) */
  getExtraData?: () => Record<string, unknown>;
  /** Whether test is finished */
  isFinished: boolean;
  /** Optional callback on successful save */
  onSaveSuccess?: () => void;
  /** Optional callback on failed save (after all retries) */
  onSaveError?: (error: Error) => void;
}

/**
 * Return type for useAutosave hook
 */
export interface UseAutosaveResult {
  /** Trigger a manual save */
  saveNow: () => Promise<boolean>;
  /** Whether a save is in progress */
  isSaving: boolean;
  /** Timestamp of last successful save */
  lastSaved: Date | null;
  /** Whether there are saves waiting to retry */
  hasQueuedSaves: boolean;
}

/**
 * Normalized answer format for comparison
 */
interface NormalizedAnswers {
  task1?: string;
  task2?: string;
  response?: string;
  raw?: string;
}

const getMeaningfulText = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Extract comparable content from different answer formats
 * Handles both Writing test format (array with task1/task2 responses) and object format
 */
export const normalizeAnswersForComparison = (
  answers: Answers | null
): NormalizedAnswers | null => {
  if (!answers) return null;

  // Handle array format (used by Writing test autosave)
  if (Array.isArray(answers) && answers.length > 0) {
    const item = answers[0];
    if (typeof item === 'object' && item !== null) {
      // Extract task responses for comparison
      return {
        task1: (item as WritingResponse).task1_response || '',
        task2: (item as WritingResponse).task2_response || '',
        response: (item as WritingResponse).response || '',
      };
    }
    return { raw: JSON.stringify(answers) };
  }

  // Handle object format (could be drafts object {'Task 1': '...', 'Task 2': '...'})
  if (typeof answers === 'object') {
    const obj = answers as Record<string, unknown>;
    const isWritingAnswer =
      'Task 1' in obj ||
      'Task 2' in obj ||
      'task1_response' in obj ||
      'task2_response' in obj ||
      'response' in obj;
    if (isWritingAnswer) {
      return {
        task1: (obj['Task 1'] as string) || (obj.task1_response as string) || '',
        task2: (obj['Task 2'] as string) || (obj.task2_response as string) || '',
        response: (obj.response as string) || '',
      };
    }

    return {
      raw: JSON.stringify(Object.entries(obj).sort(([left], [right]) => left.localeCompare(right))),
    };
  }

  return { raw: String(answers) };
};

/**
 * Deep equality check for answers (handles both array and object formats)
 */
const hasChanges = (current: Answers | null, previous: Answers | null): boolean => {
  const normalizedCurrent = normalizeAnswersForComparison(current);
  const normalizedPrevious = normalizeAnswersForComparison(previous);

  if (!normalizedCurrent && !normalizedPrevious) return false;
  if (!normalizedCurrent || !normalizedPrevious) return true;

  // Compare normalized structures
  return JSON.stringify(normalizedCurrent) !== JSON.stringify(normalizedPrevious);
};

/**
 * useAutosave Hook
 *
 * Provides automatic saving of test progress with:
 * - Periodic autosave every 30 seconds
 * - Save on tab switch/visibility change
 * - Retry with exponential backoff
 * - Queue for offline saves
 */
export function useAutosave({
  session,
  getAnswers,
  getExtraData,
  isFinished,
  onSaveSuccess,
  onSaveError,
}: UseAutosaveOptions): UseAutosaveResult {
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const lastSavedRef = useRef<Answers>({});
  const lastSaveTimeRef = useRef<number>(0);
  const retryQueueRef = useRef<QueuedSave[]>([]);
  const isSavingRef = useRef<boolean>(false);
  const activeSavePromiseRef = useRef<Promise<boolean> | null>(null);
  const isFinishedRef = useRef<boolean>(isFinished);

  const getAnswersRef = useRef(getAnswers);
  const getExtraDataRef = useRef(getExtraData);

  // Keep refs up to date
  useEffect(() => {
    getAnswersRef.current = getAnswers;
    getExtraDataRef.current = getExtraData;
  });

  useEffect(() => {
    isFinishedRef.current = isFinished;
    if (isFinished) retryQueueRef.current = [];
  }, [isFinished]);

  // Initialize lastSaved from session
  useEffect(() => {
    if (session?.content_data?.last_saved_at && !lastSaved) {
      setLastSaved(new Date(session.content_data.last_saved_at));
    }
    // Initialize the answers ref in the SAME format that getAnswers() returns
    // This ensures consistent comparison in hasChanges()
    if (session?.user_responses?.[0]) {
      const resp = session.user_responses[0];
      // Store in the same array format used by getAnswers()
      lastSavedRef.current = [
        {
          response: resp.response || '',
          task1_response: resp.task1_response || '',
          task2_response: resp.task2_response || '',
          word_count: resp.word_count || 0,
        },
      ];
    } else {
    }
  }, [session, lastSaved]);

  const saveWithRetry = useCallback(
    async (
      answers: Answers,
      contentData: ContentData,
      retryCount: number = 0,
      skipThrottle: boolean = false
    ): Promise<boolean> => {
      if (!session?.id || isFinishedRef.current) return false;

      // Throttle: Check if we saved recently
      const now = Date.now();
      if (!skipThrottle && !retryCount && now - lastSaveTimeRef.current < MIN_SAVE_GAP_MS) {
        return false;
      }

      try {
        const { error } = await supabase
          .from('test_sessions')
          .update({
            user_responses: answers,
            content_data: contentData,
          })
          .eq('id', session.id)
          .eq('is_completed', false);

        if (error) throw error;

        lastSavedRef.current = Array.isArray(answers) ? [...answers] : { ...answers };
        lastSaveTimeRef.current = Date.now();
        setLastSaved(new Date());
        onSaveSuccess?.();
        return true;
      } catch (err) {
        if (retryCount < MAX_RETRIES) {
          const backoffDelay = BASE_DELAY_MS * Math.pow(2, retryCount);
          await delay(backoffDelay);
          if (isFinishedRef.current) return false;
          return saveWithRetry(answers, contentData, retryCount + 1, skipThrottle);
        }

        retryQueueRef.current.push({
          answers: Array.isArray(answers) ? [...answers] : { ...answers },
          contentData: { ...contentData },
          timestamp: Date.now(),
        });
        // Cap queue to prevent unbounded growth during extended offline periods
        if (retryQueueRef.current.length > 5) {
          retryQueueRef.current = retryQueueRef.current.slice(-5);
        }
        onSaveError?.(err instanceof Error ? err : new Error(String(err)));
        return false;
      }
    },
    [session?.id, onSaveSuccess, onSaveError]
  );

  const runSave = useCallback(
    async (answers: Answers, contentData: ContentData, forced: boolean): Promise<boolean> => {
      setIsSaving(true);
      isSavingRef.current = true;
      const savePromise = saveWithRetry(answers, contentData, 0, forced);
      activeSavePromiseRef.current = savePromise;

      try {
        return await savePromise;
      } finally {
        if (activeSavePromiseRef.current === savePromise) {
          activeSavePromiseRef.current = null;
          isSavingRef.current = false;
          setIsSaving(false);
        }
      }
    },
    [saveWithRetry]
  );

  const processQueue = useCallback(async (): Promise<void> => {
    if (!session?.id || isFinishedRef.current || retryQueueRef.current.length === 0) return;
    const latestQueued = retryQueueRef.current.pop();
    retryQueueRef.current = [];
    if (latestQueued) {
      await saveWithRetry(latestQueued.answers, latestQueued.contentData, 0, true);
    }
  }, [session?.id, saveWithRetry]);

  /**
   * Main logic for performing a save check
   */
  const performSaveCheck = useCallback(
    async (forced: boolean = false): Promise<boolean> => {
      if (!session || isFinished || isSavingRef.current) {
        return false;
      }

      const currentAnswers = getAnswersRef.current();
      if (!currentAnswers) {
        return false;
      }

      const isEmpty = Array.isArray(currentAnswers)
        ? currentAnswers.length === 0
        : Object.keys(currentAnswers).length === 0;
      if (isEmpty) {
        return false;
      }

      // Check for actual content - for Writing tests, verify drafts have text
      const hasContent = Array.isArray(currentAnswers)
        ? currentAnswers.some((item) => {
            if (typeof item === 'object' && item !== null) {
              const typedItem = item as WritingResponse;
              const task1 = typedItem.task1_response || '';
              const task2 = typedItem.task2_response || '';
              return getMeaningfulText(task1).length > 0 || getMeaningfulText(task2).length > 0;
            }
            return true; // Non-writing formats - assume has content
          })
        : Object.values(currentAnswers).some((v) => getMeaningfulText(v).length > 0);

      if (!hasContent) {
        return false;
      }

      // When forced (tab switch, navigate away), bypass the changes check - just save
      if (!forced) {
        const changed = hasChanges(currentAnswers, lastSavedRef.current);

        if (!changed) {
          return false;
        }
      } else {
      }

      const extraData = getExtraDataRef.current?.() || {};
      const contentData: ContentData = {
        ...(session.content_data || {}),
        ...extraData,
        last_saved_at: new Date().toISOString(),
      };

      return runSave(currentAnswers, contentData, forced);
    },
    [session, isFinished, runSave]
  );

  // Autosave interval
  useEffect(() => {
    if (!session || isFinished) {
      return;
    }

    const saveInterval = setInterval(() => performSaveCheck(), AUTOSAVE_INTERVAL_MS);
    return () => {
      clearInterval(saveInterval);
    };
  }, [session, isFinished, performSaveCheck]);

  // Visibility Change / Tab Switching Safety
  useEffect(() => {
    const handleVisibilityChange = (): void => {
      if (document.visibilityState === 'hidden') {
        performSaveCheck(true);
      }
    };

    const handleBeforeUnload = (): void => {
      // Small attempt for last second save, though browsers often kill async here
      performSaveCheck(true);
    };

    const handlePageHide = (): void => {
      performSaveCheck(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [performSaveCheck]);

  // Online status listener
  useEffect(() => {
    const handleOnline = (): void => {
      processQueue();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [processQueue]);

  /**
   * Manual save trigger (for passage changes, etc.)
   */
  const saveNow = useCallback(async (): Promise<boolean> => {
    if (!session?.id || isFinishedRef.current) return false;

    // A manual flush is used before navigation, evaluation, and submission.
    // Wait for any older snapshot, then persist the latest answers instead of
    // returning early and letting the caller navigate with unsaved edits.
    while (activeSavePromiseRef.current) {
      await activeSavePromiseRef.current.catch(() => false);
      if (isFinishedRef.current) return false;
    }

    // CRITICAL: Use refs to avoid stale closures when called from event handlers
    const currentAnswers = getAnswersRef.current();
    const isEmpty =
      !currentAnswers ||
      (Array.isArray(currentAnswers)
        ? currentAnswers.length === 0
        : Object.keys(currentAnswers).length === 0);
    if (isEmpty) {
      return false;
    }

    // Use ref to get latest extra data (time remaining, etc.)
    const extraData = getExtraDataRef.current?.() || {};
    const contentData: ContentData = {
      ...session.content_data,
      ...extraData,
      last_saved_at: new Date().toISOString(),
    };

    return runSave(currentAnswers, contentData, true);
  }, [session, runSave]);

  return {
    saveNow,
    isSaving,
    lastSaved,
    hasQueuedSaves: retryQueueRef.current.length > 0,
  };
}

export default useAutosave;
