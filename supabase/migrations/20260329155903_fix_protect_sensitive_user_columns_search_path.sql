set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.protect_sensitive_user_columns()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  caller_role TEXT;
  bypass_flag TEXT;
BEGIN
  -- Get the current role: 'service_role', 'authenticated', 'anon', or 'postgres'
  caller_role := current_setting('role', true);

  -- Allow service_role and postgres to modify anything
  IF caller_role IN ('service_role', 'rls_definer') THEN
    RETURN NEW;
  END IF;

  -- Allow trusted SECURITY DEFINER triggers to bypass (e.g. handle_payment_approval)
  bypass_flag := current_setting('app.bypass_column_protection', true);
  IF bypass_flag = 'on' THEN
    RETURN NEW;
  END IF;

  -- For authenticated users: block changes to protected columns
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'Cannot modify protected column: role';
  END IF;

  IF OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier THEN
    RAISE EXCEPTION 'Cannot modify protected column: subscription_tier';
  END IF;

  IF OLD.billing_interval IS DISTINCT FROM NEW.billing_interval THEN
    RAISE EXCEPTION 'Cannot modify protected column: billing_interval';
  END IF;

  IF OLD.stripe_subscription_id IS DISTINCT FROM NEW.stripe_subscription_id THEN
    RAISE EXCEPTION 'Cannot modify protected column: stripe_subscription_id';
  END IF;

  IF OLD.subscription_start_date IS DISTINCT FROM NEW.subscription_start_date THEN
    RAISE EXCEPTION 'Cannot modify protected column: subscription_start_date';
  END IF;

  IF OLD.subscription_end_date IS DISTINCT FROM NEW.subscription_end_date THEN
    RAISE EXCEPTION 'Cannot modify protected column: subscription_end_date';
  END IF;

  IF OLD.subscription_amount IS DISTINCT FROM NEW.subscription_amount THEN
    RAISE EXCEPTION 'Cannot modify protected column: subscription_amount';
  END IF;

  IF OLD.subscription_currency IS DISTINCT FROM NEW.subscription_currency THEN
    RAISE EXCEPTION 'Cannot modify protected column: subscription_currency';
  END IF;

  IF OLD.bonus_writing_credits IS DISTINCT FROM NEW.bonus_writing_credits THEN
    RAISE EXCEPTION 'Cannot modify protected column: bonus_writing_credits';
  END IF;

  IF OLD.bonus_speaking_credits IS DISTINCT FROM NEW.bonus_speaking_credits THEN
    RAISE EXCEPTION 'Cannot modify protected column: bonus_speaking_credits';
  END IF;

  IF OLD.referral_bonus_expires_at IS DISTINCT FROM NEW.referral_bonus_expires_at THEN
    RAISE EXCEPTION 'Cannot modify protected column: referral_bonus_expires_at';
  END IF;

  IF OLD.auth_id IS DISTINCT FROM NEW.auth_id THEN
    RAISE EXCEPTION 'Cannot modify protected column: auth_id';
  END IF;

  -- NEW: Protect promo discount columns from direct user modification
  IF OLD.promo_discount IS DISTINCT FROM NEW.promo_discount THEN
    RAISE EXCEPTION 'Cannot modify protected column: promo_discount';
  END IF;

  IF OLD.used_promo_codes IS DISTINCT FROM NEW.used_promo_codes THEN
    RAISE EXCEPTION 'Cannot modify protected column: used_promo_codes';
  END IF;

  RETURN NEW;
END;
$function$
;
