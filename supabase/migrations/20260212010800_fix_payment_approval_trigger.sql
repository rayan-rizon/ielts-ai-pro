-- Fix: The handle_payment_approval trigger runs as SECURITY DEFINER (postgres) but
-- current_setting('role') still returns 'authenticated' (session role).
-- This causes protect_sensitive_user_columns to block the subscription_tier update.
--
-- Solution: Use a session-level flag that trusted SECURITY DEFINER functions set
-- before modifying protected columns, and have the guard check for it.

-- 1. Update the guard to also check for a trusted-trigger bypass flag
CREATE OR REPLACE FUNCTION public.protect_sensitive_user_columns() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
AS $$
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

  RETURN NEW;
END;
$$;

-- 2. Update handle_payment_approval to set the bypass flag before updating users
CREATE OR REPLACE FUNCTION public.handle_payment_approval() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
AS $$
BEGIN
    IF (OLD.status = 'pending' AND NEW.status = 'approved') THEN
        -- Set bypass flag so protect_sensitive_user_columns allows this update
        PERFORM set_config('app.bypass_column_protection', 'on', true);

        UPDATE public.users
        SET 
            subscription_tier = NEW.tier,
            billing_interval  = NEW.interval,
            subscription_start_date = NOW(),
            updated_at = NOW()
        WHERE auth_id = NEW.auth_id;

        -- Clear bypass flag immediately
        PERFORM set_config('app.bypass_column_protection', '', true);
    END IF;
    RETURN NEW;
END;
$$;
