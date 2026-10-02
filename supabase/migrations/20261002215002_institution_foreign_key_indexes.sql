-- Keep institution lookups and foreign-key reconciliation efficient as seats grow.
CREATE INDEX IF NOT EXISTS billing_history_institution_idx ON public.billing_history(institution_id) WHERE institution_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS institution_audit_institution_created_idx ON public.institution_audit(institution_id, created_at DESC);
CREATE INDEX IF NOT EXISTS institution_invitations_institution_idx ON public.institution_invitations(institution_id);
CREATE INDEX IF NOT EXISTS institution_invitations_seat_idx ON public.institution_invitations(seat_id);
CREATE INDEX IF NOT EXISTS institution_orders_created_by_idx ON public.institution_orders(created_by);
CREATE INDEX IF NOT EXISTS institution_pricing_institution_idx ON public.institution_pricing(institution_id) WHERE institution_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS institution_seats_order_idx ON public.institution_seats(order_id);
