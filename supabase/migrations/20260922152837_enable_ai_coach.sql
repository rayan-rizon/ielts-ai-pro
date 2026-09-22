-- Enable the AI Coach after its database, Edge Function, budget, quota, and UI checks.
update ai_coach_private.settings
set enabled = true
where id = true;
