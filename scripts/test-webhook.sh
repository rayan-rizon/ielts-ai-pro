#!/bin/bash

USER_ID="db6f5c88-6622-4806-8c46-ea96b014781d"
BYPASS_SECRET="local_test_secret_123"
URL="http://localhost:54321/functions/v1/stripe-webhook"

# Mock Stripe Event for checkout.session.completed
PAYLOAD=$(cat <<EOF
{
  "id": "evt_test_$(date +%s)",
  "object": "event",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_$(date +%s)",
      "customer": "cus_test_123",
      "subscription": "sub_test_123",
      "status": "complete",
      "amount_total": 2999,
      "currency": "usd",
      "metadata": {
        "supabase_user_id": "$USER_ID",
        "supabase_auth_id": "$USER_ID",
        "tier": "pro",
        "interval": "monthly"
      }
    }
  }
}
EOF
)

SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

curl -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "stripe-signature: dummy" \
  -H "x-webhook-bypass-secret: $BYPASS_SECRET" \
  -d "$PAYLOAD"
