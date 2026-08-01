-- Restore learner profiles only for established Auth accounts that proved they
-- were real by confirming their email and signing in. Unconfirmed or never-used
-- historical accounts remain untouched for manual retention review.

INSERT INTO public.users (
    auth_id,
    email,
    full_name,
    created_at,
    updated_at
)
SELECT
    account.id,
    account.email,
    COALESCE(
        NULLIF(btrim(account.raw_user_meta_data->>'full_name'), ''),
        NULLIF(split_part(account.email, '@', 1), ''),
        'User'
    ),
    account.created_at,
    now()
FROM auth.users account
LEFT JOIN public.users profile ON profile.auth_id = account.id
WHERE profile.id IS NULL
  AND account.email IS NOT NULL
  AND account.email_confirmed_at IS NOT NULL
  AND account.last_sign_in_at IS NOT NULL;
