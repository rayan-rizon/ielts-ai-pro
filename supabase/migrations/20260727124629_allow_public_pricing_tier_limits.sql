-- Pricing limits are displayed before sign-in, so anonymous visitors need
-- read-only access to the customer-facing tiers. Admin limits remain private.
CREATE POLICY "public_pricing_tier_limits_select_policy"
ON public.tier_rate_limits
FOR SELECT
TO anon
USING (tier IN ('free', 'pro', 'premium'));
