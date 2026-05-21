-- The application uses Supabase REST/RPC APIs and has no GraphQL client usage.
-- Disabling pg_graphql removes the public /graphql/v1 schema exposure reported
-- by Supabase security advisors without changing the app's REST API behavior.

DROP EXTENSION IF EXISTS pg_graphql;
