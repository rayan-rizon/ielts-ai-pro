---
description: Identify and fix memory leaks causing app slowdowns and crashes
---

# Memory Leak Debugging Workflow

## 1. Take Heap Snapshots

- Open Chrome DevTools → Memory tab.
- Take a snapshot, interact with your app, take another snapshot.
- Click "Comparison" to see what objects are being retained.

## 2. Common Culprits

### Event Listeners (Not removed in cleanup)

```tsx
useEffect(() => {
  const handler = () => console.log('resize');
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler); // ✅ Cleanup
}, []);
```

### Timers (`setInterval` not cleared)

```tsx
useEffect(() => {
  const id = setInterval(() => {}, 1000);
  return () => clearInterval(id); // ✅ Cleanup
}, []);
```

### Subscriptions (WebSocket/Observable not closed)

```tsx
useEffect(() => {
  const subscription = observable.subscribe(handler);
  return () => subscription.unsubscribe(); // ✅ Cleanup
}, []);
```

## 3. Use React DevTools Profiler

- Enable "Record why each component rendered".
- Look for components that never unmount or re-render excessively.

## 4. Check for Detached DOM

- In Memory tab, filter by "Detached".
- These are DOM nodes removed from the page but still in memory.

## 5. Pro Tips

- Use `useEffect` cleanup functions religiously.
- Avoid storing large objects in state unnecessarily.
- Use React's built-in `AbortController` for fetch cleanup:

```tsx
useEffect(() => {
  const controller = new AbortController();
  fetch(url, { signal: controller.signal })
    .then((res) => res.json())
    .then(setData)
    .catch((err) => {
      if (err.name !== 'AbortError') console.error(err);
    });
  return () => controller.abort(); // ✅ Cleanup
}, [url]);
```

- Test with React Strict Mode enabled (mounts/unmounts twice).

## 6. Automated Code Scan

Look for these patterns in your codebase:

- `useEffect` without return statement
- `setInterval` / `setTimeout` without cleanup
- `addEventListener` without corresponding `removeEventListener`
- Supabase subscriptions without `.unsubscribe()`
- WebSocket connections without `.close()`
