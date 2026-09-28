// Stand-in for std/http serve() when Edge Functions run under the local
// server: instead of opening a port per function, hand the handler to
// scripts/local-edge/server.ts, which routes /functions/v1/<name> to it.
type Handler = (request: Request) => Response | Promise<Response>;

export function serve(handler: Handler) {
  const register = (globalThis as any).__registerLocalEdgeHandler;
  if (typeof register !== 'function') {
    throw new Error('serveShim is only for scripts/local-edge/server.ts');
  }
  register(handler);
}
