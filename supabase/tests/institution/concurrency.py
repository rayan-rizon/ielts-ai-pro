"""Real parallel transactions against the isolated Postgres cluster, never production."""
import subprocess, sys, concurrent.futures
psql, socket = sys.argv[1:]
base=[psql,'-h',socket,'-p','54439','-d','postgres','-v','ON_ERROR_STOP=1','-Atq']
def run(sql):
    return subprocess.run(base+['-c',sql],text=True,capture_output=True)
def checked(sql):
    result=run(sql)
    assert result.returncode==0,result.stderr
    return result.stdout.strip()
checked("""
select set_config('request.jwt.claim.role','service_role',false);
insert into auth.users(id,email,email_confirmed_at) values
 ('10000000-0000-0000-0000-000000000001','parallel-admin@example.com',now()),
 ('10000000-0000-0000-0000-000000000002','parallel-owner@example.com',now()),
 ('10000000-0000-0000-0000-000000000003','parallel-student@example.com',now());
insert into public.users(auth_id,email,role)
select id,email,case when email like '%admin%' then 'admin' else 'user' end from auth.users where id::text like '10000000%';
insert into public.institutions(id,name,owner_auth_id,owner_email) values
 ('10000000-0000-0000-0000-000000000010','Parallel Centre','10000000-0000-0000-0000-000000000002','parallel-owner@example.com');
update public.system_settings set value='true' where key='institution_enabled';
insert into public.institution_orders(id,institution_id,source,status,tier,quantity,access_days,currency,activation_deadline)
values ('10000000-0000-0000-0000-000000000011','10000000-0000-0000-0000-000000000010','complimentary','complimentary','pro',2,30,'USD',now()+interval '90 days');
insert into public.institution_seats(order_id,institution_id)
select '10000000-0000-0000-0000-000000000011','10000000-0000-0000-0000-000000000010' from generate_series(1,2);
select public.institution_action('10000000-0000-0000-0000-000000000002','invite','{"institution_id":"10000000-0000-0000-0000-000000000010","email":"parallel-student@example.com","token_hash":"parallel-token"}');
""")
accept="select set_config('request.jwt.claim.role','service_role',false); select public.institution_action('10000000-0000-0000-0000-000000000003','accept','{\"token_hash\":\"parallel-token\"}');"
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    results=list(pool.map(run,[accept]*4))
assert all(r.returncode==0 for r in results),[r.stderr for r in results]
assert checked("select count(*) from public.institution_seats where user_auth_id='10000000-0000-0000-0000-000000000003' and status='active'")=='1'
def invite(index):
    return "select set_config('request.jwt.claim.role','service_role',false); select public.institution_action('10000000-0000-0000-0000-000000000002','invite','{\"institution_id\":\"10000000-0000-0000-0000-000000000010\",\"email\":\"last%d@example.com\",\"token_hash\":\"last-token-%d\"}');" % (index,index)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    results=list(pool.map(run,[invite(i) for i in range(4)]))
assert sum(r.returncode==0 for r in results)==1,[r.stderr for r in results]
assert checked("select count(*) from public.institution_seats where institution_id='10000000-0000-0000-0000-000000000010'")=='2'
assert checked("select count(*) from public.institution_invitations where institution_id='10000000-0000-0000-0000-000000000010' and cancelled_at is null")=='2'
print('Concurrent repeated acceptance and last-seat reservation checks passed.')

# Simultaneous reviews serialize on the request, creating one institution and owner invitation.
checked("""
select set_config('request.jwt.claim.role','service_role',false);
select public.institution_application_submit('{"request_key":"30000000-0000-0000-0000-000000000001","institution_name":"Parallel Application","contact_name":"Test Owner","email":"parallel-app@example.test","country":"Bangladesh","expected_seats":20}',repeat('e',64));
""")
app=checked("select id from public.institution_applications where institution_name='Parallel Application'")
approve="select set_config('request.jwt.claim.role','service_role',false); select public.institution_application_admin('10000000-0000-0000-0000-000000000001','approve',jsonb_build_object('application_id','%s','reason','Concurrent approval','token_hash',repeat('f',64)));" % app
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    results=list(pool.map(run,[approve]*4))
assert all(r.returncode==0 for r in results),[r.stderr for r in results]
assert checked("select count(*) from public.institutions where name='Parallel Application'")=='1'
assert checked("select count(*) from public.institution_invitations where institution_id=(select institution_id from public.institution_applications where id='%s')" % app)=='1'
print('Concurrent application approval creates exactly one institution and owner invitation.')
