-- Add payment_failed_at column to users table for in-app dunning notifications.
-- This timestamp is set by the stripe-webhook when invoice.payment_failed fires,
-- and cleared (set to NULL) when a subsequent invoice.paid is received.
-- The frontend can check this field to show a "Please update your payment method" banner.

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS payment_failed_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.users.payment_failed_at IS 'Set by Stripe webhook on payment failure, cleared on successful payment. Used for in-app dunning notifications.';
