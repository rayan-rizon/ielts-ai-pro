export const ADMIN_READ_RPC_OPTIONS = { get: true };

const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [250, 750];

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const isTransientTransportError = (error) => {
  const message = String(error?.message || error || '').toLowerCase();

  return (
    !error?.code &&
    /(load failed|failed to fetch|networkerror|network request failed|fetcherror)/.test(message)
  );
};

/** Retry only safe, read-only RPC work after a dropped browser-to-Supabase connection. */
export async function readAdminRpc(supabase, name, args) {
  let lastError;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      const { data, error } = await supabase.rpc(name, args, ADMIN_READ_RPC_OPTIONS);
      if (error) throw error;
      return data;
    } catch (error) {
      lastError = error;
      if (!isTransientTransportError(error) || attempt === MAX_ATTEMPTS - 1) throw error;
      await wait(RETRY_DELAYS_MS[attempt]);
    }
  }

  throw lastError;
}
