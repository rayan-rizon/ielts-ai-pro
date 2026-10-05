CREATE OR REPLACE FUNCTION public.handle_payment_approval()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid;
  v_period_start timestamptz;
  v_end_date timestamptz;
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
    SELECT id, greatest(now(), COALESCE(subscription_end_date, now()))
    INTO v_user_id, v_period_start
    FROM public.users
    WHERE auth_id = NEW.auth_id
    FOR UPDATE;
    IF v_user_id IS NULL THEN
      RAISE EXCEPTION 'User profile not found' USING ERRCODE = 'P0002';
    END IF;

    v_end_date := v_period_start + CASE
      WHEN lower(COALESCE(NEW.interval, 'monthly')) = 'quarterly' THEN interval '3 months'
      ELSE interval '1 month'
    END;

    PERFORM set_config('app.bypass_column_protection', 'on', true);
    UPDATE public.users
    SET subscription_tier = NEW.tier,
        billing_interval = NEW.interval,
        subscription_start_date = v_period_start,
        subscription_end_date = v_end_date,
        subscription_amount = NEW.amount,
        subscription_currency = COALESCE(NEW.currency, 'BDT'),
        promo_discount = NULL,
        updated_at = now()
    WHERE id = v_user_id;
    PERFORM set_config('app.bypass_column_protection', 'off', true);

    INSERT INTO public.billing_history (
      user_id, auth_id, amount, currency, payment_method, transaction_id,
      status, tier, billing_interval
    ) VALUES (
      v_user_id, NEW.auth_id, NEW.amount, COALESCE(NEW.currency, 'BDT'),
      COALESCE(NEW.payment_method, 'manual'), NEW.transaction_id, 'paid',
      NEW.tier, NEW.interval
    ) ON CONFLICT (transaction_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$
