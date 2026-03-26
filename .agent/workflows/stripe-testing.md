---
description: How to test Stripe payments locally using Stripe CLI
---

# Stripe Payment Testing Workflow

This workflow describes how to test the Stripe payment integration locally using Stripe CLI.

// turbo-all

## Prerequisites

1. Install Stripe CLI (if not already installed):

   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. Login to Stripe:
   ```bash
   stripe login
   ```

## Step 1: Start Local Services

1. Start Supabase (if not running):

   ```bash
   supabase start
   ```

2. Start Edge Functions:

   ```bash
   supabase functions serve --env-file supabase/functions/.env
   ```

3. Start Frontend:
   ```bash
   npm run dev
   ```

## Step 2: Forward Stripe Webhooks

1. Open a new terminal and run:

   ```bash
   stripe listen --forward-to http://127.0.0.1:54321/functions/v1/stripe-webhook
   ```

2. **IMPORTANT**: Copy the webhook signing secret (starts with `whsec_`) shown in the terminal.

3. Update `supabase/functions/.env`:

   ```
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_FROM_STEP_2
   ```

4. Restart Edge Functions to pick up the new secret.

## Step 3: Test Payment Flow

1. Open browser to http://localhost:5173/pricing
2. Ensure you're logged in
3. Select "Pro" or "Premium" plan
4. Click "Get Started" button
5. Complete checkout with test card: `4242 4242 4242 4242`
   - Use any future expiry date (e.g., 12/30)
   - Use any CVC (e.g., 123)
   - Use any billing address
6. After successful payment, you should be redirected to `/subscription/success`

## Step 4: Verify Results

1. Check user's subscription tier in Supabase:
   - Open http://127.0.0.1:54323 (Supabase Studio)
   - Navigate to Table Editor → users
   - Find your user and verify `subscription_tier` is updated

2. Check billing_history table for payment record

3. Check payment_requests table for the Stripe payment

4. Check stripe_events table for recorded event

## Test Cards

| Scenario           | Card Number         |
| ------------------ | ------------------- |
| Success            | 4242 4242 4242 4242 |
| Declined           | 4000 0000 0000 0002 |
| Requires Auth      | 4000 0025 0000 3155 |
| Insufficient Funds | 4000 0000 0000 9995 |

## Trigger Test Events

To trigger test events manually:

```bash
stripe trigger checkout.session.completed
stripe trigger invoice.paid
stripe trigger customer.subscription.deleted
```

## Troubleshooting

### Webhook not receiving events

- Ensure `stripe listen` is running
- Check the webhook secret matches in `.env`
- Restart Edge Functions after changing `.env`

### Payment not updating subscription

- Check Edge Function logs: `supabase functions logs stripe-webhook`
- Verify `handle_stripe_event` RPC exists in database
- Check for errors in stripe_events table
