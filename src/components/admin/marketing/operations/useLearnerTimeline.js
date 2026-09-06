import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { report } from './operationsConstants';

function getItemChannel(item) {
  if (item.channel) return item.channel;
  if (item.recommended_channel) return item.recommended_channel;
  if (item.kind === 'emails') return 'email';
  return 'other';
}

function filterTimelineItems(items, channel) {
  if (channel === 'all') return items;
  return items.filter((item) => getItemChannel(item) === channel);
}

function useLearnerSearch(requestRef, onResetTimeline) {
  const [search, setSearch] = useState('');
  const [learners, setLearners] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const searchUsers = useCallback(
    async (event) => {
      event.preventDefault();
      const version = ++requestRef.current;
      setBusy(true);
      setError('');
      setLearners([]);
      onResetTimeline();

      try {
        const value = await report('admin_learners', { search });
        if (version === requestRef.current) {
          setLearners(value?.learners || []);
        }
      } catch (err) {
        if (version === requestRef.current) {
          setError(err.message);
        }
      } finally {
        if (version === requestRef.current) {
          setBusy(false);
        }
      }
    },
    [search, requestRef, onResetTimeline]
  );

  return { search, setSearch, learners, setLearners, busy, error, searchUsers };
}

function useTimelineLoader(requestRef, onResetSearch) {
  const [user, setUser] = useState(null);
  const [days, setDays] = useState(30);
  const [timeline, setTimeline] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (selected, windowDays) => {
      const version = ++requestRef.current;
      setUser(selected);
      setDays(windowDays);
      setTimeline(null);
      setBusy(true);
      setError('');
      onResetSearch();

      try {
        const result = await report('admin_timeline', {
          user_id: selected.id,
          days: windowDays,
        });
        if (version === requestRef.current) {
          setTimeline(result);
        }
      } catch (err) {
        if (version === requestRef.current) {
          setError(err.message);
        }
      } finally {
        if (version === requestRef.current) {
          setBusy(false);
        }
      }
    },
    [requestRef, onResetSearch]
  );

  const resetTimeline = useCallback(() => {
    setUser(null);
    setTimeline(null);
  }, []);

  return { user, setUser, days, setDays, timeline, busy, error, load, resetTimeline };
}

export function useLearnerTimeline() {
  const request = useRef(0);
  const [channel, setChannel] = useState('all');
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    return () => {
      request.current += 1;
    };
  }, []);

  const timelineLoader = useTimelineLoader(request, () => setPreview(null));
  const searchHandler = useLearnerSearch(request, () => {
    timelineLoader.resetTimeline();
    setPreview(null);
  });

  const timelineItems = timelineLoader.timeline?.items;
  const filteredItems = useMemo(
    () => filterTimelineItems(timelineItems || [], channel),
    [timelineItems, channel]
  );

  return {
    search: searchHandler.search,
    setSearch: searchHandler.setSearch,
    learners: searchHandler.learners,
    user: timelineLoader.user,
    days: timelineLoader.days,
    timeline: timelineLoader.timeline,
    busy: searchHandler.busy || timelineLoader.busy,
    error: searchHandler.error || timelineLoader.error,
    channel,
    setChannel,
    preview,
    setPreview,
    searchUsers: searchHandler.searchUsers,
    load: timelineLoader.load,
    filteredItems,
  };
}
