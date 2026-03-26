---
description: Identify slow components using React Profiler
---

# React Profiler - Performance Analysis Workflow

## 1. Install DevTools

- Install [React Developer Tools](https://react.dev/learn/react-developer-tools) extension for Chrome/Firefox.

## 2. Record Session

- Open DevTools → **Profiler** tab.
- Click the **Record** circle (⏺).
- Interact with your app (perform the slow action).
- Click **Stop** recording.

## 3. Analyze Results

- Look for **yellow/red bars** in the flamegraph (slow renders).
- Check **"Why did this render?"** to find unnecessary re-renders.
- Hover over components to see render times in milliseconds.

## 4. Common Fixes

```jsx
// ❌ Bad: Creates new object every render
<Child style={{ color: 'red' }} />;

// ✅ Good: Memoize or move outside component
const style = useMemo(() => ({ color: 'red' }), []);
<Child style={style} />;
```

```jsx
// ❌ Bad: Re-renders on every parent update
function Child({ data }) { ... }

// ✅ Good: Only re-renders when props change
const Child = React.memo(function Child({ data }) { ... });
```

## 5. Pro Tips

- Enable **"Highlight updates when components render"** in React DevTools settings → visualizes re-renders in real-time.
- Use `React.memo()` for expensive pure components.
- Use `useMemo()` for expensive calculations.
- Use `useCallback()` for functions passed as props.
- Check if context providers are causing cascading re-renders.
