/**
 * Edge-function modules that the app or its tests import are type-checked by
 * `tsc`, which does not understand Deno's `npm:` import specifiers. Map the
 * ones those shared modules use to types tsc can resolve. Runtime is
 * unaffected: these imports are type-only, and Deno resolves them itself.
 */

declare module 'npm:@supabase/supabase-js@2' {
  export * from '@supabase/supabase-js';
}

declare module 'npm:stripe@^14.14.0' {
  // `stripe` is a Deno-only dependency and is not installed for the web app.
  // The shared modules only accept a client as a parameter, so a permissive
  // stand-in keeps them type-checkable without pulling in the Node SDK.
  interface Stripe {
    [key: string]: any;
  }
  export default Stripe;
}
