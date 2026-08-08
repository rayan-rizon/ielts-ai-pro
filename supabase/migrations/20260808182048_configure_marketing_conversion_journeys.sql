-- Ready-to-run conversion setup for the Marketing Hub. Each journey uses a
-- narrow dynamic audience and only the channels appropriate to that intent.
-- Marketing email remains consent-gated in the dispatcher; payment recovery
-- stays in-app because the existing lifecycle email is transactional.

DO $setup$
DECLARE
  spec jsonb;
  v_segment_id uuid;
  v_campaign_id uuid;
BEGIN
  FOR spec IN
    SELECT value
    FROM jsonb_array_elements(
      $$[
        {"trigger":"signup_incomplete","name":"Journey: start your first IELTS practice","objective":"activation","segment":"New learners not activated","channels":["in_app","banner"],"subject":null,"title":"Start with one IELTS practice","message":"Take a short practice today to get a clear baseline, see what to improve, and unlock a more useful learning plan.","cta_label":"Start practice","cta_url":"/tests","cooldown_hours":168},
        {"trigger":"first_practice_completed","name":"Journey: build on your first result","objective":"paid_conversion","segment":"First practice completed","channels":["in_app","email"],"subject":"Turn your first IELTS result into progress","title":"Build on your first IELTS result","message":"You have your first result. One more focused practice lets you apply the feedback while it is still fresh and build real momentum.","cta_label":"Continue practice","cta_url":"/tests","cooldown_hours":168},
        {"trigger":"low_quota","name":"Journey: keep AI feedback flowing","objective":"paid_conversion","segment":"Free learners near quota","channels":["in_app","banner","email"],"subject":"Keep your IELTS feedback flowing","title":"Keep your IELTS feedback flowing","message":"Your AI feedback quota is running low. Choose a plan when you want consistent feedback and practice support for your IELTS target.","cta_label":"View plans","cta_url":"/pricing","cooldown_hours":168},
        {"trigger":"inactivity","name":"Journey: restart your IELTS progress","objective":"retention","segment":"Inactive free learners","channels":["in_app","email"],"subject":"A small step can restart your IELTS progress","title":"Your study plan is ready when you are","message":"Ten focused minutes today is enough to restart momentum. Your saved plan and practice history are ready when you return.","cta_label":"Continue learning","cta_url":"/dashboard","cooldown_hours":336},
        {"trigger":"trial_expiry","name":"Journey: use your referral bonus","objective":"paid_conversion","segment":"Referral bonus expiring","channels":["in_app","email"],"subject":"Your referral bonus is nearly over","title":"Use your referral bonus before it ends","message":"Your referral bonus expires soon. Use the remaining time to practise with feedback and keep moving toward your IELTS target.","cta_label":"View my rewards","cta_url":"/settings?tab=referrals","cooldown_hours":168},
        {"trigger":"checkout_abandoned","name":"Journey: complete your plan choice","objective":"paid_conversion","segment":"Checkout abandoned","channels":["in_app","email"],"subject":"Your IELTS plan is still ready","title":"Your plan is still ready when you are","message":"Return when you are ready to continue with the plan you selected. Your learning goals and progress are waiting for you.","cta_label":"Return to plans","cta_url":"/pricing","cooldown_hours":168},
        {"trigger":"payment_failed","name":"Journey: restore your learning access","objective":"retention","segment":"Payment recovery","channels":["in_app"],"subject":null,"title":"Your plan needs attention","message":"We could not renew your subscription. Update your payment details to keep your learning access and feedback history uninterrupted.","cta_label":"Update payment","cta_url":"/settings?tab=subscription","cooldown_hours":72},
        {"trigger":"cancel_scheduled","name":"Journey: keep your IELTS momentum","objective":"retention","segment":"Cancellation recovery","channels":["in_app","email"],"subject":"Keep your IELTS momentum going","title":"Make the most of your IELTS momentum","message":"Before your plan ends, review your recent progress and decide whether continued feedback would help you reach your target band.","cta_label":"Review my plan","cta_url":"/settings?tab=subscription","cooldown_hours":168},
        {"trigger":"exam_upcoming","name":"Journey: focus your final IELTS practice","objective":"activation","segment":"Exam approaching","channels":["in_app","email"],"subject":"Make your next IELTS practice count","title":"Focus your final practice","message":"Your exam date is approaching. Choose one focused practice now to strengthen the area that will make the biggest difference.","cta_label":"Choose a practice","cta_url":"/tests","cooldown_hours":168}
      ]$$::jsonb
    )
  LOOP
    v_campaign_id := NULL;
    SELECT id INTO v_segment_id
    FROM public.marketing_segments
    WHERE name = spec->>'segment'
    LIMIT 1;

    IF v_segment_id IS NULL THEN
      RAISE EXCEPTION 'Marketing segment % is required before configuring journeys', spec->>'segment';
    END IF;

    UPDATE public.marketing_campaigns
    SET
      name = spec->>'name',
      objective = spec->>'objective',
      status = CASE WHEN spec->>'objective' = 'paid_conversion' THEN 'active' ELSE 'paused' END,
      segment_id = v_segment_id,
      channels = ARRAY(SELECT jsonb_array_elements_text(spec->'channels')),
      subject = NULLIF(spec->>'subject', ''),
      title = spec->>'title',
      message = spec->>'message',
      cta_label = spec->>'cta_label',
      cta_url = spec->>'cta_url',
      frequency_cap = 1,
      cooldown_hours = (spec->>'cooldown_hours')::integer,
      activated_at = CASE
        WHEN spec->>'objective' = 'paid_conversion' THEN COALESCE(activated_at, now())
        ELSE NULL
      END,
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'system_key', 'journey:' || (spec->>'trigger'),
        'configured_by', 'marketing_conversion_setup'
      ),
      updated_at = now()
    WHERE metadata->>'system_key' = 'journey:' || (spec->>'trigger')
    RETURNING id INTO v_campaign_id;

    IF v_campaign_id IS NULL THEN
      INSERT INTO public.marketing_campaigns (
        name, objective, status, segment_id, channels, subject, title, message,
        cta_label, cta_url, frequency_cap, cooldown_hours, activated_at, metadata
      ) VALUES (
        spec->>'name', spec->>'objective',
        CASE WHEN spec->>'objective' = 'paid_conversion' THEN 'active' ELSE 'paused' END,
        v_segment_id,
        ARRAY(SELECT jsonb_array_elements_text(spec->'channels')),
        NULLIF(spec->>'subject', ''), spec->>'title', spec->>'message',
        spec->>'cta_label', spec->>'cta_url', 1,
        (spec->>'cooldown_hours')::integer,
        CASE WHEN spec->>'objective' = 'paid_conversion' THEN now() ELSE NULL END,
        jsonb_build_object(
          'system_key', 'journey:' || (spec->>'trigger'),
          'configured_by', 'marketing_conversion_setup'
        )
      ) RETURNING id INTO v_campaign_id;
    END IF;

    UPDATE public.marketing_journeys
    SET
      segment_id = v_segment_id,
      campaign_id = v_campaign_id,
      is_active = spec->>'objective' = 'paid_conversion',
      cooldown_hours = (spec->>'cooldown_hours')::integer,
      updated_at = now()
    WHERE trigger_type = spec->>'trigger';
  END LOOP;
END;
$setup$;

DO $templates$
DECLARE template jsonb;
BEGIN
  FOR template IN
    SELECT value
    FROM jsonb_array_elements(
      $$[
        {"name":"Auto: first IELTS practice","description":"Use for new learners who have not completed a practice yet.","objective":"activation","channels":["in_app","banner"],"subject":null,"title":"Start with one IELTS practice","message":"Take a short practice today to get a clear baseline, see what to improve, and unlock a more useful learning plan.","cta_label":"Start practice","cta_url":"/tests"},
        {"name":"Auto: build on first result","description":"Use after the learner completes their first practice.","objective":"paid_conversion","channels":["in_app","email"],"subject":"Turn your first IELTS result into progress","title":"Build on your first IELTS result","message":"You have your first result. One more focused practice lets you apply the feedback while it is still fresh and build real momentum.","cta_label":"Continue practice","cta_url":"/tests"},
        {"name":"Auto: low feedback quota","description":"Use when a free learner is low on AI feedback quota.","objective":"paid_conversion","channels":["in_app","banner","email"],"subject":"Keep your IELTS feedback flowing","title":"Keep your IELTS feedback flowing","message":"Your AI feedback quota is running low. Choose a plan when you want consistent feedback and practice support for your IELTS target.","cta_label":"View plans","cta_url":"/pricing"},
        {"name":"Auto: return to study","description":"Use for learners inactive for at least seven days.","objective":"retention","channels":["in_app","email"],"subject":"A small step can restart your IELTS progress","title":"Your study plan is ready when you are","message":"Ten focused minutes today is enough to restart momentum. Your saved plan and practice history are ready when you return.","cta_label":"Continue learning","cta_url":"/dashboard"},
        {"name":"Auto: referral bonus expiry","description":"Use for learners with referral bonus time remaining.","objective":"paid_conversion","channels":["in_app","email"],"subject":"Your referral bonus is nearly over","title":"Use your referral bonus before it ends","message":"Your referral bonus expires soon. Use the remaining time to practise with feedback and keep moving toward your IELTS target.","cta_label":"View my rewards","cta_url":"/settings?tab=referrals"},
        {"name":"Auto: checkout reminder","description":"Use after checkout is abandoned; it deliberately adds no automatic discount.","objective":"paid_conversion","channels":["in_app","email"],"subject":"Your IELTS plan is still ready","title":"Your plan is still ready when you are","message":"Return when you are ready to continue with the plan you selected. Your learning goals and progress are waiting for you.","cta_label":"Return to plans","cta_url":"/pricing"},
        {"name":"Auto: payment recovery","description":"In-app companion to the existing transactional payment-recovery email.","objective":"retention","channels":["in_app"],"subject":null,"title":"Your plan needs attention","message":"We could not renew your subscription. Update your payment details to keep your learning access and feedback history uninterrupted.","cta_label":"Update payment","cta_url":"/settings?tab=subscription"},
        {"name":"Auto: cancellation retention","description":"Use when a subscriber has scheduled cancellation.","objective":"retention","channels":["in_app","email"],"subject":"Keep your IELTS momentum going","title":"Make the most of your IELTS momentum","message":"Before your plan ends, review your recent progress and decide whether continued feedback would help you reach your target band.","cta_label":"Review my plan","cta_url":"/settings?tab=subscription"},
        {"name":"Auto: exam countdown","description":"Use for learners whose IELTS exam is within fourteen days.","objective":"activation","channels":["in_app","email"],"subject":"Make your next IELTS practice count","title":"Focus your final practice","message":"Your exam date is approaching. Choose one focused practice now to strengthen the area that will make the biggest difference.","cta_label":"Choose a practice","cta_url":"/tests"}
      ]$$::jsonb
    )
  LOOP
    UPDATE public.marketing_campaign_templates
    SET
      description = template->>'description',
      objective = template->>'objective',
      channels = ARRAY(SELECT jsonb_array_elements_text(template->'channels')),
      subject = NULLIF(template->>'subject', ''),
      title = template->>'title',
      message = template->>'message',
      cta_label = template->>'cta_label',
      cta_url = template->>'cta_url',
      is_active = true,
      updated_at = now()
    WHERE name = template->>'name';

    IF NOT FOUND THEN
      INSERT INTO public.marketing_campaign_templates (
        name, description, objective, channels, subject, title, message, cta_label, cta_url, is_active
      ) VALUES (
        template->>'name', template->>'description', template->>'objective',
        ARRAY(SELECT jsonb_array_elements_text(template->'channels')),
        NULLIF(template->>'subject', ''), template->>'title', template->>'message',
        template->>'cta_label', template->>'cta_url', true
      );
    END IF;
  END LOOP;
END;
$templates$;

NOTIFY pgrst, 'reload schema';
