-- Payment alert badges in the admin sidebar were dismissed by writing a
-- "seen at" timestamp to localStorage, so opening the alert cleared it in that
-- browser only and every other browser kept showing the same payment.
-- The marker belongs to the admin, not to the browser, so it lives here.

CREATE TABLE IF NOT EXISTS public.admin_payment_alert_reads (
  admin_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.admin_payment_alert_reads IS
  'Per-admin marker for the last time payment alerts were opened. Reached only through get_admin_payment_alert_seen_at()/mark_admin_payment_alerts_seen().';

ALTER TABLE public.admin_payment_alert_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_payment_alert_reads FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.admin_payment_alert_reads FROM PUBLIC;
REVOKE ALL ON TABLE public.admin_payment_alert_reads FROM anon;
REVOKE ALL ON TABLE public.admin_payment_alert_reads FROM authenticated;
GRANT ALL ON TABLE public.admin_payment_alert_reads TO service_role;

-- Reads the caller's marker, creating it at "now" the first time so a brand new
-- admin session is not flooded with every historical payment.
CREATE OR REPLACE FUNCTION public.get_admin_payment_alert_seen_at()
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_admin uuid := (SELECT auth.uid());
  v_seen_at timestamptz;
BEGIN
  IF v_admin IS NULL OR NOT public.is_admin() THEN
    RETURN NULL;
  END IF;

  SELECT seen_at INTO v_seen_at
  FROM public.admin_payment_alert_reads
  WHERE admin_id = v_admin;

  IF v_seen_at IS NULL THEN
    INSERT INTO public.admin_payment_alert_reads (admin_id, seen_at, updated_at)
    VALUES (v_admin, now(), now())
    ON CONFLICT (admin_id) DO UPDATE SET seen_at = public.admin_payment_alert_reads.seen_at
    RETURNING seen_at INTO v_seen_at;
  END IF;

  RETURN v_seen_at;
END;
$$;

-- Marks every payment alert as seen for this admin, in every browser.
CREATE OR REPLACE FUNCTION public.mark_admin_payment_alerts_seen()
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_admin uuid := (SELECT auth.uid());
  v_seen_at timestamptz;
BEGIN
  IF v_admin IS NULL OR NOT public.is_admin() THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.admin_payment_alert_reads (admin_id, seen_at, updated_at)
  VALUES (v_admin, now(), now())
  ON CONFLICT (admin_id) DO UPDATE
    SET seen_at = now(), updated_at = now()
  RETURNING seen_at INTO v_seen_at;

  RETURN v_seen_at;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_payment_alert_seen_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_admin_payment_alerts_seen() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_payment_alert_seen_at() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_admin_payment_alerts_seen() TO authenticated;
