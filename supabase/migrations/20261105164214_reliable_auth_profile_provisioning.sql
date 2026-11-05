-- Confirmed email and Google accounts must not depend on a browser request.
set lock_timeout = '2s';
set statement_timeout = '30s';
create schema if not exists auth_provisioning_private;
revoke all on schema auth_provisioning_private from public, anon, authenticated;

create function auth_provisioning_private.ensure_learner_profile(
 p_auth_id uuid, p_email text, p_metadata jsonb, p_created_at timestamptz
) returns void language plpgsql security definer set search_path = '' as $$
declare
 existing_auth uuid;
 channel text;
 landing text;
begin
 if nullif(p_email,'') is null then return; end if;
 if exists(select 1 from public.users where auth_id=p_auth_id) then return; end if;
 -- Link only an unowned legacy profile with the same verified email. Never
 -- transfer a profile already owned by another Auth identity or replace billing.
 select auth_id into existing_auth from public.users where email=p_email for update;
 if found then
   if existing_auth is not null and existing_auth<>p_auth_id then
     raise exception 'Learner profile is already linked' using errcode='23505';
   end if;
   update public.users set auth_id=p_auth_id,updated_at=now() where email=p_email and auth_id is null;
   return;
 end if;
 channel:=case when p_metadata->>'signup_channel' in
 ('paid_search','paid_social','organic_search','organic_social','email','referral','direct','other','ai_referral','social')
 then p_metadata->>'signup_channel' else 'direct' end;
 landing:=left(nullif(p_metadata->>'signup_landing_page',''),1000);
 if landing ~* '[?&](token_hash|code|access_token|refresh_token|error_description)=' then landing:=split_part(landing,'?',1); end if;
 insert into public.users(auth_id,email,full_name,role,subscription_tier,onboarding_completed,
 signup_channel,signup_attribution_recorded_at,signup_utm_source,signup_utm_medium,signup_utm_campaign,
 signup_utm_content,signup_utm_term,signup_referrer,signup_landing_page,signup_gclid,signup_fbclid,created_at,updated_at)
 values(p_auth_id,p_email,left(coalesce(nullif(p_metadata->>'full_name',''),nullif(p_metadata->>'name',''),'User'),200),
 'user','free',false,channel,case when p_metadata ? 'signup_attribution_recorded_at' then now() end,
 left(nullif(p_metadata->>'signup_utm_source',''),500),left(nullif(p_metadata->>'signup_utm_medium',''),500),
 left(nullif(p_metadata->>'signup_utm_campaign',''),500),left(nullif(p_metadata->>'signup_utm_content',''),500),
 left(nullif(p_metadata->>'signup_utm_term',''),500),left(nullif(p_metadata->>'signup_referrer',''),1000),landing,
 left(nullif(p_metadata->>'signup_gclid',''),500),left(nullif(p_metadata->>'signup_fbclid',''),500),p_created_at,now())
 on conflict do nothing;
 -- A concurrent browser insert is safe only if it linked this Auth identity.
 if not exists(select 1 from public.users where auth_id=p_auth_id) then
   raise exception 'Learner profile could not be provisioned' using errcode='23505';
 end if;
end $$;
revoke all on function auth_provisioning_private.ensure_learner_profile(uuid,text,jsonb,timestamptz) from public,anon,authenticated;

create function auth_provisioning_private.on_established_account()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform auth_provisioning_private.ensure_learner_profile(new.id,new.email,coalesce(new.raw_user_meta_data,'{}'),new.created_at);
 return new;
end $$;
revoke all on function auth_provisioning_private.on_established_account() from public,anon,authenticated;
create trigger provision_established_learner_on_insert after insert on auth.users
 for each row when (new.email is not null and (new.email_confirmed_at is not null or new.last_sign_in_at is not null))
 execute function auth_provisioning_private.on_established_account();
create trigger provision_established_learner_on_signin after update of email_confirmed_at,last_sign_in_at on auth.users
 for each row when (new.email is not null and (new.email_confirmed_at is not null or new.last_sign_in_at is not null))
 execute function auth_provisioning_private.on_established_account();

-- Repair established accounts only. Unactivated inventory stays unprovisioned.
select auth_provisioning_private.ensure_learner_profile(a.id,a.email,coalesce(a.raw_user_meta_data,'{}'),a.created_at)
from auth.users a where a.email is not null
 and (a.email_confirmed_at is not null or a.last_sign_in_at is not null)
 and not exists(select 1 from public.users u where u.auth_id=a.id);
reset lock_timeout;
reset statement_timeout;
