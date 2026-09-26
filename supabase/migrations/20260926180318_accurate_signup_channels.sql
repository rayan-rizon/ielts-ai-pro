-- Apply before the frontend release. No inferred historical sources are written here.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS signup_attribution_recorded_at timestamptz;
COMMENT ON COLUMN public.users.signup_attribution_recorded_at IS
  'Time signup attribution was finalized, including no-signal visits. Later logins must not replace it.';

CREATE OR REPLACE FUNCTION public.link_auth_user_to_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_channel text := CASE
    WHEN NEW.raw_user_meta_data->>'signup_channel' IN (
      'paid_search', 'paid_social', 'organic_search', 'organic_social',
      'email', 'referral', 'direct', 'other', 'ai_referral', 'social'
    ) THEN NEW.raw_user_meta_data->>'signup_channel'
    ELSE 'direct'
  END;
  v_landing_page text := CASE
    WHEN NEW.raw_user_meta_data->>'signup_landing_page'
      ~* '[?&](token_hash|code|access_token|refresh_token|error_description)='
      THEN split_part(NEW.raw_user_meta_data->>'signup_landing_page', '?', 1)
    ELSE NULLIF(NEW.raw_user_meta_data->>'signup_landing_page', '')
  END;
BEGIN
  UPDATE public.users
  SET
    auth_id = NEW.id,
    updated_at = now()
  -- Linking an existing profile is not a new acquisition event.
  WHERE email = NEW.email AND auth_id IS NULL;

  IF NOT FOUND AND NEW.email != 'hex.ron07@gmail.com' THEN
    INSERT INTO public.users (
      auth_id, email, full_name, signup_channel, signup_attribution_recorded_at,
      signup_utm_source, signup_utm_medium, signup_utm_campaign,
      signup_utm_content, signup_utm_term, signup_referrer,
      signup_landing_page, signup_gclid, signup_fbclid, created_at, updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
      v_channel,
      CASE WHEN NEW.raw_user_meta_data ? 'signup_attribution_recorded_at' THEN now() END,
      NULLIF(NEW.raw_user_meta_data->>'signup_utm_source', ''),
      NULLIF(NEW.raw_user_meta_data->>'signup_utm_medium', ''),
      NULLIF(NEW.raw_user_meta_data->>'signup_utm_campaign', ''),
      NULLIF(NEW.raw_user_meta_data->>'signup_utm_content', ''),
      NULLIF(NEW.raw_user_meta_data->>'signup_utm_term', ''),
      NULLIF(NEW.raw_user_meta_data->>'signup_referrer', ''),
      v_landing_page,
      NULLIF(NEW.raw_user_meta_data->>'signup_gclid', ''),
      NULLIF(NEW.raw_user_meta_data->>'signup_fbclid', ''),
      now(),
      now()
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in link_auth_user_to_profile: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Trigger-only entry point; never expose it as a callable public RPC.
REVOKE ALL ON FUNCTION public.link_auth_user_to_profile() FROM PUBLIC, anon, authenticated;

-- Enforce immutability for learner requests too, including cached older clients.
-- Service-role evidence corrections remain possible with a private backup.
CREATE OR REPLACE FUNCTION public.preserve_finalized_signup_attribution()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO ''
AS $function$
BEGIN
  IF current_user IN ('anon', 'authenticated') OR
     COALESCE(NULLIF(current_setting('request.jwt.claims', true), ''), '{}')::jsonb->>'role' IN ('anon', 'authenticated') THEN
    IF OLD.signup_attribution_recorded_at IS NOT NULL OR OLD.created_at < now() - interval '10 minutes' THEN
      NEW.signup_channel := OLD.signup_channel;
      NEW.signup_utm_source := OLD.signup_utm_source;
      NEW.signup_utm_medium := OLD.signup_utm_medium;
      NEW.signup_utm_campaign := OLD.signup_utm_campaign;
      NEW.signup_utm_content := OLD.signup_utm_content;
      NEW.signup_utm_term := OLD.signup_utm_term;
      NEW.signup_referrer := OLD.signup_referrer;
      NEW.signup_landing_page := OLD.signup_landing_page;
      NEW.signup_gclid := OLD.signup_gclid;
      NEW.signup_fbclid := OLD.signup_fbclid;
      NEW.signup_attribution_recorded_at := OLD.signup_attribution_recorded_at;
    ELSIF ROW(NEW.signup_channel, NEW.signup_utm_source, NEW.signup_utm_medium,
      NEW.signup_utm_campaign, NEW.signup_utm_content, NEW.signup_utm_term,
      NEW.signup_referrer, NEW.signup_landing_page, NEW.signup_gclid,
      NEW.signup_fbclid, NEW.signup_attribution_recorded_at)
      IS DISTINCT FROM ROW(OLD.signup_channel, OLD.signup_utm_source, OLD.signup_utm_medium,
      OLD.signup_utm_campaign, OLD.signup_utm_content, OLD.signup_utm_term,
      OLD.signup_referrer, OLD.signup_landing_page, OLD.signup_gclid,
      OLD.signup_fbclid, OLD.signup_attribution_recorded_at) THEN
      NEW.signup_attribution_recorded_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.preserve_finalized_signup_attribution() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS preserve_finalized_signup_attribution ON public.users;
CREATE TRIGGER preserve_finalized_signup_attribution
BEFORE UPDATE ON public.users FOR EACH ROW
EXECUTE FUNCTION public.preserve_finalized_signup_attribution();
