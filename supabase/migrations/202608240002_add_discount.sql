alter table public.invoices add column discount numeric(14,2) not null default 0 check (discount >= 0);

create or replace function public.create_invoice_transaction(
  invoice_data jsonb,
  line_items jsonb,
  initial_payment jsonb default null
)
returns public.invoices language plpgsql security definer set search_path = public
as $$
declare
  new_invoice public.invoices;
  item jsonb;
  product_row public.products;
  quantity numeric;
  subtotal numeric := 0;
  tax_rate numeric := 0;
  discount_amount numeric := coalesce((invoice_data->>'discount')::numeric, 0);
  payment_amount numeric := coalesce((initial_payment->>'amount')::numeric, 0);
  next_number text;
begin
  if auth.uid() is null or public.current_business_id() is null then raise exception 'Business membership required'; end if;
  if jsonb_array_length(line_items) = 0 then raise exception 'Invoice must contain at least one item'; end if;
  select coalesce(s.tax_rate, b.tax_rate, 0) into tax_rate
  from public.businesses b left join public.settings s on s.business_id = b.id
  where b.id = public.current_business_id();
  next_number := coalesce(invoice_data->>'invoice_number',
    coalesce((select invoice_prefix from public.settings where business_id = public.current_business_id()), 'INV')
    || '-' || to_char(now(), 'YYYYMMDDHH24MISSMS'));

  for item in select * from jsonb_array_elements(line_items) loop
    select * into product_row from public.products
    where id = (item->>'product_id')::uuid and business_id = public.current_business_id()
    for update;
    if not found or not product_row.is_active then raise exception 'Product is unavailable'; end if;
    quantity := (item->>'quantity')::numeric;
    if quantity <= 0 then raise exception 'Quantity must be positive'; end if;
    if product_row.stock_quantity < quantity then
      raise exception 'Insufficient stock for %', product_row.name;
    end if;
    subtotal := subtotal + round(quantity * coalesce((item->>'unit_price')::numeric, product_row.price), 2);
  end loop;

  tax_rate := coalesce((invoice_data->>'tax_rate')::numeric, tax_rate);
  if discount_amount > subtotal then
    raise exception 'Discount cannot exceed subtotal';
  end if;
  if payment_amount < 0 or payment_amount > round((subtotal - discount_amount) + round((subtotal - discount_amount) * tax_rate / 100, 2), 2) then
    raise exception 'Payment exceeds invoice total';
  end if;
  
  insert into public.invoices(
    business_id, customer_id, invoice_number, status, issue_date, due_date,
    subtotal, discount, tax, total, paid_amount, balance, notes, created_by
  ) values (
    public.current_business_id(), (invoice_data->>'customer_id')::uuid, next_number,
    case when payment_amount = round((subtotal - discount_amount) + round((subtotal - discount_amount) * tax_rate / 100, 2), 2) then 'paid'::public.invoice_status
      when payment_amount > 0 then 'partially_paid'::public.invoice_status else 'sent'::public.invoice_status end,
    coalesce((invoice_data->>'issue_date')::date, current_date),
    (invoice_data->>'due_date')::date, subtotal, discount_amount, round((subtotal - discount_amount) * tax_rate / 100, 2),
    round((subtotal - discount_amount) + round((subtotal - discount_amount) * tax_rate / 100, 2), 2), payment_amount,
    round((subtotal - discount_amount) + round((subtotal - discount_amount) * tax_rate / 100, 2), 2) - payment_amount,
    invoice_data->>'notes', auth.uid()
  ) returning * into new_invoice;

  for item in select * from jsonb_array_elements(line_items) loop
    select * into product_row from public.products where id = (item->>'product_id')::uuid for update;
    quantity := (item->>'quantity')::numeric;
    insert into public.invoice_items(invoice_id, product_id, description, quantity, unit_price, cost)
    values (new_invoice.id, product_row.id, product_row.name, quantity,
      coalesce((item->>'unit_price')::numeric, product_row.price), product_row.cost);
    update public.products set stock_quantity = stock_quantity - quantity, updated_at = now()
    where id = product_row.id;
    insert into public.stock_transactions(business_id, product_id, type, quantity, reference, created_by)
    values (new_invoice.business_id, product_row.id, 'sale', -quantity, new_invoice.invoice_number, auth.uid());
  end loop;
  if payment_amount > 0 then
    insert into public.payments(business_id, invoice_id, customer_id, amount, method, reference, created_by)
    values (new_invoice.business_id, new_invoice.id, new_invoice.customer_id, payment_amount,
      coalesce((initial_payment->>'method')::public.payment_method, 'cash'), initial_payment->>'reference', auth.uid());
  end if;
  return new_invoice;
end;
$$;
