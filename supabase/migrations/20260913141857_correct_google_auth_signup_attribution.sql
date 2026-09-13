-- Google OAuth returns to /login from accounts.google.com. Before the client
-- fix, that authentication hop was mistaken for organic Google Search when a
-- browser had no earlier acquisition signal. Only correct rows with the exact
-- false-positive fingerprint; preserve any row carrying marketing evidence.
UPDATE public.users
SET
  signup_channel = 'direct',
  signup_referrer = NULL,
  signup_landing_page = NULL
WHERE signup_channel = 'organic_search'
  AND signup_referrer ~* '^https?://accounts\.google\.com(?:[/:?#]|$)'
  AND NULLIF(BTRIM(signup_utm_source), '') IS NULL
  AND NULLIF(BTRIM(signup_utm_medium), '') IS NULL
  AND NULLIF(BTRIM(signup_utm_campaign), '') IS NULL
  AND NULLIF(BTRIM(signup_utm_content), '') IS NULL
  AND NULLIF(BTRIM(signup_utm_term), '') IS NULL
  AND NULLIF(BTRIM(signup_gclid), '') IS NULL
  AND NULLIF(BTRIM(signup_fbclid), '') IS NULL;
