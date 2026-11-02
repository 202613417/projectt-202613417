begin;
alter table public.orders add column if not exists delivery_address text;
alter table public.orders add column if not exists checkout_request_id uuid;
create unique index if not exists orders_checkout_request_unique on public.orders(checkout_request_id);
create or replace function public.shopnow_checkout(p_request_id uuid,p_customer_name text,p_email text,p_phone text,p_address text,p_items jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare c bigint; o bigint; total numeric:=0; i record; p record; previous record;
begin
 if p_request_id is null or p_customer_name is null or p_email is null or p_phone is null or p_address is null or length(trim(p_customer_name)) not between 1 and 150 or length(trim(p_email)) not between 3 and 150 or trim(p_email) !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' or length(trim(p_phone)) not between 3 and 30 or length(trim(p_address)) not between 5 and 1000 then raise exception 'Please check your customer information.'; end if;
 if p_items is null or jsonb_typeof(p_items)<>'array' then raise exception 'Your cart is empty or invalid.'; end if;
 if jsonb_array_length(p_items) not between 1 and 100 then raise exception 'Your cart is empty or invalid.'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
 select order_id,total_amount into previous from public.orders where checkout_request_id=p_request_id;
 if found then return jsonb_build_object('order_id',previous.order_id,'total_amount',previous.total_amount); end if;
 if (select count(*) from jsonb_to_recordset(p_items) as x(product_id bigint,quantity integer)) <> (select count(distinct x.product_id) from jsonb_to_recordset(p_items) as x(product_id bigint,quantity integer)) then raise exception 'Duplicate cart items.'; end if;
 for i in select * from jsonb_to_recordset(p_items) as x(product_id bigint,quantity integer) order by product_id loop
  if i.product_id is null or i.quantity is null or i.quantity not between 1 and 999 then raise exception 'Invalid cart quantity.'; end if;
  select * into p from public.product where product_id=i.product_id for update;
  if not found or p.stock is null or p.stock<i.quantity or p.price is null or p.price<0 then raise exception 'A product is unavailable or has insufficient stock.'; end if;
  total:=total+round(p.price,2)*i.quantity;
 end loop;
 insert into public.customer(customer_name,email,phone) values(trim(p_customer_name),lower(trim(p_email)),trim(p_phone)) on conflict(email) do nothing returning customer_id into c;
 if c is null then select customer_id into c from public.customer where email=lower(trim(p_email)); end if;
 insert into public.orders(customer_id,order_date,total_amount,delivery_address,checkout_request_id) values(c,now(),total,trim(p_address),p_request_id) returning order_id into o;
 for i in select * from jsonb_to_recordset(p_items) as x(product_id bigint,quantity integer) order by product_id loop
  insert into public.order_item(order_id,product_id,quantity,unit_price) select o,product_id,i.quantity,round(price,2) from public.product where product_id=i.product_id;
  update public.product set stock=stock-i.quantity where product_id=i.product_id;
 end loop;
 return jsonb_build_object('order_id',o,'total_amount',total);
end $$;
revoke all on function public.shopnow_checkout(uuid,text,text,text,text,jsonb) from public,anon,authenticated;
commit;