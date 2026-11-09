-- Safe on production: transactional fixtures are rolled back, no email is sent.
BEGIN;
INSERT INTO public.marketing_email_feedback(email,provider_message_id,occurred_at,reason,permanent)
VALUES
('bounce-once@health-check.invalid','health-check-1',now(),'MailboxFull',false),
('bounce-twice@health-check.invalid','health-check-2',now()-interval '10 days','MailboxFull',false),
('bounce-twice@health-check.invalid','health-check-3',now()-interval '8 days','MailboxFull',false),
('bounce-expired@health-check.invalid','health-check-4',now()-interval '8 days','MailboxFull',false),
('bounce-permanent@health-check.invalid','health-check-5',now()-interval '90 days','InvalidDomain',true);
DO $$ BEGIN
 ASSERT public.marketing_email_block_reason(' BOUNCE-ONCE@HEALTH-CHECK.INVALID ') = 'email_bounce_cooldown', 'First bounce must block for seven days';
 ASSERT public.marketing_email_block_reason('bounce-twice@health-check.invalid') = 'email_bounce_cooldown', 'Repeated bounce must block for thirty days';
 ASSERT public.marketing_email_block_reason('bounce-expired@health-check.invalid') IS NULL, 'Single bounce must expire after seven days';
 ASSERT public.marketing_email_block_reason('bounce-permanent@health-check.invalid') = 'email_permanently_blocked', 'Permanent block must not expire';
 ASSERT public.marketing_email_block_reason('healthy@health-check.invalid') IS NULL, 'Healthy addresses must remain eligible';
 ASSERT NOT has_function_privilege('anon','public.marketing_email_block_reason(text)','EXECUTE'), 'Anonymous must not query recipient health';
 ASSERT NOT has_table_privilege('authenticated','public.marketing_email_feedback','SELECT'), 'Feedback must remain private';
END $$;
INSERT INTO public.marketing_email_feedback(email,provider_message_id,occurred_at,reason,permanent)
VALUES ('bounce-once@health-check.invalid','health-check-1',now(),'MailboxFull',false)
ON CONFLICT DO NOTHING;
DO $$ BEGIN
 ASSERT (SELECT count(*) FROM public.marketing_email_feedback WHERE email='bounce-once@health-check.invalid')=1, 'Webhook replay must not multiply bounces';
END $$;
ROLLBACK;
