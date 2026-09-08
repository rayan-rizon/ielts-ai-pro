-- Close the isolated answer-protection preview after authenticated verification.
-- The global switch remains off until the matching frontend is deployed.
set lock_timeout='2s';
set statement_timeout='15s';
update objective_private.settings
set preview_auth_ids='{}'::uuid[]
where id;
reset lock_timeout;
reset statement_timeout;
