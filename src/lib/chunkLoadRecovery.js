/**
 * Returns true only for stale dynamic-import failures after a deployment.
 *
 * Do not treat a generic runtime TypeError as a chunk failure. Reloading on
 * every application error hides the actual problem and can create a reload
 * loop while a route is trying to render.
 */
export function isChunkLoadError(error) {
  const errorString = error?.toString?.() || '';

  return (
    errorString.includes('Failed to fetch dynamically imported module') ||
    errorString.includes('Importing a module script failed') ||
    errorString.includes('error loading dynamically imported module')
  );
}
