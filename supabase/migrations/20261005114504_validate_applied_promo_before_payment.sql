CREATE FUNCTION public.get_applied_subscription_promo() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT jsonb_build_object('code',p.code,'discount_type',p.discount_type,'discount_value',p.discount_value,'applicable_plans',p.applicable_plans,'expires_at',p.offer_expires_at)
  FROM public.users u JOIN public.promo_codes p ON p.code=u.promo_discount->>'code'
  WHERE u.auth_id=auth.uid() AND auth.uid() IS NOT NULL AND p.is_active AND NOT p.is_signup_offer_template
    AND (p.assigned_user_id IS NULL OR p.assigned_user_id=u.id)
    AND (p.valid_from IS NULL OR p.valid_from<=(now() AT TIME ZONE 'UTC')::date)
    AND (p.valid_until IS NULL OR p.valid_until>=(now() AT TIME ZONE 'UTC')::date)
    AND (p.offer_expires_at IS NULL OR p.offer_expires_at>now())
    AND p.id::text=ANY(COALESCE(u.used_promo_codes,'{}'::text[]))
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_applied_subscription_promo() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_applied_subscription_promo() TO authenticated,service_role;
