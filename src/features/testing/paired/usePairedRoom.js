import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { pairedRequest } from './pairedApi';

export function usePairedRoom(id) {
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const [connected, setConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const roomRef = useRef(null);
  const revision = useRef(null);
  const snapshot = useRef(null);
  const released = useRef(false);
  const conflicted = useRef(false);
  const queue = useRef(Promise.resolve());
  const clock = useRef({ server: Date.now(), mono: performance.now() });
  const now = useCallback(() => clock.current.server + performance.now() - clock.current.mono, []);
  const act = useCallback(
    (action, data = {}) => {
      const work = queue.current
        .catch(() => {})
        .then(async () => {
          if (conflicted.current && ['save', 'submit'].includes(action))
            throw new Error('Answers changed in another tab. Reload before continuing.');
          let result = await pairedRequest(action, id, {
            ...data,
            ...(['save', 'submit'].includes(action) ? { revision: revision.current } : {}),
            include_snapshot: !snapshot.current,
          });
          if (result.state === 'complete' && !released.current && !result.snapshot)
            result = await pairedRequest('get', id, { include_snapshot: true });
          if (result.snapshot) {
            snapshot.current = result.snapshot;
            released.current = result.state === 'complete';
          }
          result.snapshot = snapshot.current;
          if (
            action === 'get' &&
            revision.current !== null &&
            result.own.revision !== revision.current
          ) {
            conflicted.current = true;
            setConflict(true);
          }
          if (revision.current === null || ['save', 'submit'].includes(action))
            revision.current = result.own.revision;
          clock.current = { server: Date.parse(result.server_now), mono: performance.now() };
          roomRef.current = result;
          setRoom(result);
          setError('');
          return result;
        })
        .catch((err) => {
          if (err.message.includes('another tab')) {
            conflicted.current = true;
            setConflict(true);
          }
          setError(err.message);
          throw err;
        });
      queue.current = work;
      return work;
    },
    [id]
  );
  useEffect(() => {
    if (!id) return;
    let disposed = false;
    const refresh = () => {
      if (!disposed) act('get').catch(() => {});
    };
    refresh();
    let timer;
    const poll = () => {
      if (disposed) return;
      refresh();
      timer = setTimeout(poll, roomRef.current?.state === 'lobby' ? 2000 : 10000);
    };
    timer = setTimeout(poll, 2000);
    window.addEventListener('online', refresh);
    const visibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', visibility);
    const channel = supabase.channel(`paired:${id}`, {
      config: { private: true, presence: { key: crypto.randomUUID() } },
    });
    channel
      .on('broadcast', { event: 'changed' }, refresh)
      .on('presence', { event: 'sync' }, () => {
        const users = new Set(
          Object.values(channel.presenceState())
            .flat()
            .map((p) => p.user_id)
            .filter((id) => roomRef.current?.members.some((m) => m.user_id === id))
        );
        setOnlineCount(users.size);
      })
      .subscribe(async (status) => {
        if (disposed) return;
        setConnected(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') {
          const result = await act('get').catch(() => null);
          if (result && !disposed) await channel.track({ user_id: result.actor_id });
        }
      });
    return () => {
      disposed = true;
      clearTimeout(timer);
      window.removeEventListener('online', refresh);
      document.removeEventListener('visibilitychange', visibility);
      supabase.removeChannel(channel);
    };
  }, [id, act]);
  return { room, error, conflict, connected, onlineCount, act, now };
}
