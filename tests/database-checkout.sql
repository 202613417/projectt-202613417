-- Manual Lab 6 database verification. Run as the database owner in SQL Editor.
-- Fixture: saved Order #2, total AED 495; product 2 stock 24, product 4 stock 16.
-- No account email or owner UUID is hardcoded: both are read from the fixture.
-- A second identity is simulated under the actual authenticated PostgreSQL role.
-- All probe writes and temporary grants are rolled back. Sequence gaps are normal.
-- The temporary results table is not exposed through the public application API.
-- This is not an installation migration or a production monitoring script.
rollback;
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
create temporary table shopnow_test_results(test_name text,passed boolean,detail text) on commit drop;
do $$ begin
 execute format('grant usage on schema %I to authenticated,anon',(select nspname from pg_namespace where oid=pg_my_temp_schema()));
end $$;
grant select,insert on pg_temp.shopnow_test_results to authenticated,anon;
do $$ begin
 perform set_config('shopnow.test_email',(select checkout_payload->>'email' from public.orders where order_id=2),true);
 perform set_config('shopnow.test_owner_id',(select auth_user_id::text from public.orders where order_id=2),true);
 perform set_config('shopnow.test_status',(select status from public.orders where order_id=2),true);
 perform set_config('shopnow.test_request_id',(select checkout_request_id::text from public.orders where order_id=2),true);
end $$;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('shopnow.test_owner_id'),'email',current_setting('shopnow.test_email'),'role','authenticated')::text,true);
select set_config('request.jwt.claim.sub',current_setting('shopnow.test_owner_id'),true);
insert into pg_temp.shopnow_test_results values
 ('owner order read',(select count(*)=1 from public.orders where order_id=2),'actual role='||current_user),
 ('owner item read',(select count(*)=2 from public.order_item where order_id=2),'two line items visible'),
 ('customer private',(select count(*)=0 from public.customer),'customer table has no customer SELECT policy');
with touched as (update public.orders set status='Delivered' where order_id=2 returning order_id)
insert into pg_temp.shopnow_test_results select 'customer status update blocked',count(*)=0,'no UPDATE policy' from touched;
do $$ declare outcome text; begin
 begin
  insert into public.orders(customer_id,total_amount,auth_user_id) values(2,1,auth.uid());
  raise exception 'unexpected direct INSERT acceptance' using errcode='ZX001';
 exception when others then
  get stacked diagnostics outcome=message_text;
  insert into pg_temp.shopnow_test_results values('direct order insert blocked',sqlstate='42501',outcome);
 end;
end $$;
do $$ declare r record; result jsonb; begin
 select * into strict r from public.orders where order_id=2;
 result:=public.shopnow_checkout(r.checkout_request_id,r.checkout_payload->>'name',r.checkout_payload->>'email',r.checkout_payload->>'phone',r.checkout_payload->>'address',r.checkout_payload->'items');
 insert into pg_temp.shopnow_test_results values('matching retry returns same order',(result->>'order_id')::bigint=2 and (result->>'total_amount')::numeric=495,'replayed the actual browser request');
end $$;
do $$ declare r record; outcome text; begin
 select * into strict r from public.orders where order_id=2;
 begin
  perform public.shopnow_checkout(r.checkout_request_id,'Changed name',r.checkout_payload->>'email',r.checkout_payload->>'phone',r.checkout_payload->>'address',r.checkout_payload->'items');
  raise exception 'unexpected replay acceptance' using errcode='ZX001';
 exception when others then
  get stacked diagnostics outcome=message_text;
  insert into pg_temp.shopnow_test_results values('changed retry rejected',sqlstate='P0001' and outcome='This checkout request does not match your order.',outcome);
 end;
end $$;
do $$ declare ok boolean:=false; result jsonb; outcome text; begin
 begin
  result:=public.shopnow_checkout(gen_random_uuid(),'Lab 6 rollback probe',current_setting('shopnow.test_email'),'0000000000','University demo test address','[{"product_id":4,"quantity":1,"price":0,"unit_price":0}]'::jsonb);
  select total_amount=49 and (select stock=15 from public.product where product_id=4) and exists(select 1 from public.order_item where order_id=o.order_id and unit_price=49 and quantity=1) into ok from public.orders o where o.order_id=(result->>'order_id')::bigint;
  raise exception 'rollback successful pricing probe' using errcode='ZX001';
 exception when sqlstate 'ZX001' then
  insert into pg_temp.shopnow_test_results values('server price ignores forged client price',coalesce(ok,false),'actual RPC created AED 49 order and item inside rolled-back subtransaction');
 when others then
  get stacked diagnostics outcome=message_text;
  insert into pg_temp.shopnow_test_results values('server price ignores forged client price',false,outcome);
 end;
end $$;
do $$ declare outcome text; begin
 begin
  perform public.shopnow_checkout(gen_random_uuid(),'Lab 6 rollback probe',current_setting('shopnow.test_email'),'0000000000','University demo test address','[{"product_id":2,"quantity":1},{"product_id":4,"quantity":999}]'::jsonb);
  raise exception 'unexpected stock acceptance' using errcode='ZX001';
 exception when others then
  get stacked diagnostics outcome=message_text;
  insert into pg_temp.shopnow_test_results values('insufficient stock rejected atomically',sqlstate='P0001' and outcome='A product is unavailable or has insufficient stock.',outcome);
 end;
end $$;
do $$ declare outcome text; begin
 begin
  perform public.shopnow_checkout(gen_random_uuid(),'Lab 6 rollback probe',current_setting('shopnow.test_email'),'0000000000','University demo test address','[{"product_id":4,"quantity":1.5}]'::jsonb);
  raise exception 'unexpected fractional acceptance' using errcode='ZX001';
 exception when others then
  get stacked diagnostics outcome=message_text;
  insert into pg_temp.shopnow_test_results values('fractional quantity rejected',sqlstate='P0001' and outcome='Invalid cart quantity.',outcome);
 end;
end $$;
do $$ declare outcome text; begin
 begin
  perform public.shopnow_checkout(gen_random_uuid(),'Lab 6 rollback probe',current_setting('shopnow.test_email'),'0000000000','University demo test address','[{"product_id":4,"quantity":1},{"product_id":4,"quantity":1}]'::jsonb);
  raise exception 'unexpected duplicate acceptance' using errcode='ZX001';
 exception when others then
  get stacked diagnostics outcome=message_text;
  insert into pg_temp.shopnow_test_results values('duplicate products rejected',sqlstate='P0001' and outcome='Duplicate cart items.',outcome);
 end;
end $$;
do $$ declare outcome text; begin
 begin
  perform public.shopnow_checkout(gen_random_uuid(),'Lab 6 rollback probe','different@example.invalid','0000000000','University demo test address','[{"product_id":4,"quantity":1}]'::jsonb);
  raise exception 'unexpected email acceptance' using errcode='ZX001';
 exception when others then
  get stacked diagnostics outcome=message_text;
  insert into pg_temp.shopnow_test_results values('different customer email rejected',sqlstate='P0001' and outcome='Use the email address of your signed-in account.',outcome);
 end;
end $$;
select set_config('request.jwt.claims','{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","email":"other@example.invalid","role":"authenticated"}',true);
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
insert into pg_temp.shopnow_test_results values
 ('unrelated identity cannot read order',(select count(*)=0 from public.orders where order_id=2),'simulated unrelated JWT identity; actual authenticated role'),
 ('unrelated identity cannot read items',(select count(*)=0 from public.order_item where order_id=2),'simulated unrelated JWT identity; actual authenticated role');
do $$ declare outcome text; begin
 begin
  perform public.shopnow_checkout(current_setting('shopnow.test_request_id')::uuid,'Lab 6 Verification','other@example.invalid','0000000000','University demo test address','[{"product_id":4,"quantity":4},{"product_id":2,"quantity":1}]'::jsonb);
  raise exception 'unexpected cross-owner retry acceptance' using errcode='ZX001';
 exception when others then
  get stacked diagnostics outcome=message_text;
  insert into pg_temp.shopnow_test_results values('unrelated identity cannot replay order',sqlstate='P0001' and outcome='This checkout request does not match your order.',outcome);
 end;
end $$;
select set_config('request.jwt.claims','{"role":"authenticated"}',true);
select set_config('request.jwt.claim.sub','',true);
do $$ declare outcome text; begin
 begin
  perform public.shopnow_checkout(gen_random_uuid(),'Lab 6 Verification',current_setting('shopnow.test_email'),'0000000000','University demo test address','[{"product_id":4,"quantity":1}]'::jsonb);
  raise exception 'unexpected missing-identity acceptance' using errcode='ZX001';
 exception when others then
  get stacked diagnostics outcome=message_text;
  insert into pg_temp.shopnow_test_results values('missing identity rejected',sqlstate='42501' and outcome='Please log in before checking out.',outcome);
 end;
end $$;
reset role;
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
insert into pg_temp.shopnow_test_results values
 ('anonymous cannot read order',(select count(*)=0 from public.orders where order_id=2),'actual anon role'),
 ('anonymous cannot read items',(select count(*)=0 from public.order_item where order_id=2),'actual anon role');
do $$ declare outcome text; begin
 begin
  perform public.shopnow_checkout(gen_random_uuid(),'Lab 6 Verification',current_setting('shopnow.test_email'),'0000000000','University demo test address','[{"product_id":4,"quantity":1}]'::jsonb);
  raise exception 'unexpected anonymous acceptance' using errcode='ZX001';
 exception when others then
  get stacked diagnostics outcome=message_text;
  insert into pg_temp.shopnow_test_results values('anonymous RPC execution denied',sqlstate='42501',outcome);
 end;
end $$;
reset role;
insert into pg_temp.shopnow_test_results values
 ('no additional records after probes',(select count(*)=1 from public.orders) and (select count(*)=1 from public.customer) and (select count(*)=2 from public.order_item),'all rollback probes left only the browser order'),
 ('stock unchanged by retries and failed probes',(select stock=24 from public.product where product_id=2) and (select stock=16 from public.product where product_id=4),'phone=24 cable=16'),
 ('status unchanged by customer write',(select status=current_setting('shopnow.test_status') from public.orders where order_id=2),'customer cannot change status directly');
select test_name,passed,detail from pg_temp.shopnow_test_results order by test_name;
rollback;
