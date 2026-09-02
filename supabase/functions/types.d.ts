// Type definitions for Deno environment to silence IDE errors
declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    toObject(): { [key: string]: string };
  }
  export const env: Env;
}
