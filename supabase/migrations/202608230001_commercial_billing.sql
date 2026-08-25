create extension if not exists pgcrypto;

create type public.member_role as enum ('owner', 'admin', 'staff');
create type public.invoice_status as enum ('draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled');
create type public.payment_method as enum ('cash', 'card', 'bank_transfer', 'mobile_money', 'other');
create type public.stock_transaction_type as enum ('opening', 'purchase', 'sale', 'adjustment', 'return', 'cancelled_sale');
create type public.purchase_status as enum ('draft', 'received', 'cancelled');

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  email text,
  phone text,
  address text,
  currency text not null default 'INR',
  tax_rate numeric(6,3) not null default 0 check (tax_rate between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  full_name text not null default '',
  role public.member_role not null default 'owner',
  created_at timestamptz not null default now()
);

create table public.settings (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  invoice_prefix text not null default 'INV',
  default_due_days integer not null default 30 check (default_due_days between 0 and 3650),
  tax_rate numeric(6,3) not null default 0 check (tax_rate between 0 and 100),
  currency text not null default 'INR'
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  created_at timestamptz not null default now(),
  unique (business_id, name)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  email text,
  phone text,
  address text,
  notes text,
  opening_balance numeric(14,2) not null default 0 check (opening_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null check (char_length(name) between 1 and 160),
  sku text not null check (char_length(sku) between 1 and 80),
  price numeric(14,2) not null default 0 check (price >= 0),
  cost numeric(14,2) not null default 0 check (cost >= 0),
  stock_quantity numeric(14,3) not null default 0 check (stock_quantity >= 0),
  low_stock_threshold numeric(14,3) not null default 5 check (low_stock_threshold >= 0),
  unit text not null default 'pcs',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, sku)
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  email text,
  phone text,
  address text,
  created_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  invoice_number text not null,
  status public.invoice_status not null default 'draft',
  issue_date date not null default current_date,
  due_date date,
  subtotal numeric(14,2) not null default 0 check (subtotal >= 0),
  tax numeric(14,2) not null default 0 check (tax >= 0),
  total numeric(14,2) not null default 0 check (total >= 0),
  paid_amount numeric(14,2) not null default 0 check (paid_amount >= 0),
  balance numeric(14,2) not null default 0 check (balance >= 0),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, invoice_number)
);

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  description text not null,
  quantity numeric(14,3) not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  cost numeric(14,2) not null default 0 check (cost >= 0),
  total numeric(14,2) generated always as (round(quantity * unit_price, 2)) stored
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete restrict,
  customer_id uuid not null references public.customers(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  method public.payment_method not null,
  reference text,
  paid_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  reference text,
  status public.purchase_status not null default 'draft',
  purchase_date date not null default current_date,
  total numeric(14,2) not null default 0 check (total >= 0),
  notes text,
  created_at timestamptz not null default now()
);

create table public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric(14,3) not null check (quantity > 0),
  cost numeric(14,2) not null check (cost >= 0),
  total numeric(14,2) generated always as (round(quantity * cost, 2)) stored
);

create table public.stock_transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  type public.stock_transaction_type not null,
  quantity numeric(14,3) not null check (quantity <> 0),
  reference text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  category text not null check (char_length(category) between 1 and 100),
  amount numeric(14,2) not null check (amount > 0),
  date date not null default current_date,
  description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index customers_business_name_idx on public.customers(business_id, name);
create index products_business_name_idx on public.products(business_id, name);
create index products_business_stock_idx on public.products(business_id, stock_quantity);
create index invoices_business_date_idx on public.invoices(business_id, issue_date desc);
create index invoices_business_customer_idx on public.invoices(business_id, customer_id);
create index payments_business_date_idx on public.payments(business_id, paid_at desc);
create index stock_transactions_product_idx on public.stock_transactions(business_id, product_id, created_at desc);
create index expenses_business_date_idx on public.expenses(business_id, date desc);

create or replace function public.current_business_id()
returns uuid language sql stable security definer set search_path = public
as $$ select business_id from public.profiles where id = auth.uid() $$;

create or replace function public.is_business_member(target_business_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and business_id = target_business_id) $$;

create or replace function public.create_business(
  business_name text,
  member_name text default '',
  business_currency text default 'INR'
)
returns public.businesses language plpgsql security definer set search_path = public
as $$
declare new_business public.businesses;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'User already belongs to a business';
  end if;
  insert into public.businesses(name, currency) values (trim(business_name), upper(trim(business_currency))) returning * into new_business;
  insert into public.profiles(id, business_id, full_name, role)
  values (auth.uid(), new_business.id, trim(member_name), 'owner');
  insert into public.settings(business_id, currency) values (new_business.id, new_business.currency);
  return new_business;
end;
$$;

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
  if payment_amount < 0 or payment_amount > round(subtotal + round(subtotal * tax_rate / 100, 2), 2) then
    raise exception 'Payment exceeds invoice total';
  end if;
  insert into public.invoices(
    business_id, customer_id, invoice_number, status, issue_date, due_date,
    subtotal, tax, total, paid_amount, balance, notes, created_by
  ) values (
    public.current_business_id(), (invoice_data->>'customer_id')::uuid, next_number,
    case when payment_amount = round(subtotal + round(subtotal * tax_rate / 100, 2), 2) then 'paid'::public.invoice_status
      when payment_amount > 0 then 'partially_paid'::public.invoice_status else 'sent'::public.invoice_status end,
    coalesce((invoice_data->>'issue_date')::date, current_date),
    (invoice_data->>'due_date')::date, subtotal, round(subtotal * tax_rate / 100, 2),
    round(subtotal + round(subtotal * tax_rate / 100, 2), 2), payment_amount,
    round(subtotal + round(subtotal * tax_rate / 100, 2), 2) - payment_amount,
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

alter table public.businesses enable row level security;
alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.categories enable row level security;
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.suppliers enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.stock_transactions enable row level security;
alter table public.expenses enable row level security;

create policy "members access businesses" on public.businesses for all using (id = public.current_business_id()) with check (id = public.current_business_id());
create policy "members access profiles" on public.profiles for all using (business_id = public.current_business_id()) with check (business_id = public.current_business_id());
create policy "members access settings" on public.settings for all using (business_id = public.current_business_id()) with check (business_id = public.current_business_id());
create policy "members access categories" on public.categories for all using (business_id = public.current_business_id()) with check (business_id = public.current_business_id());
create policy "members access customers" on public.customers for all using (business_id = public.current_business_id()) with check (business_id = public.current_business_id());
create policy "members access products" on public.products for all using (business_id = public.current_business_id()) with check (business_id = public.current_business_id());
create policy "members access suppliers" on public.suppliers for all using (business_id = public.current_business_id()) with check (business_id = public.current_business_id());
create policy "members access invoices" on public.invoices for all using (business_id = public.current_business_id()) with check (business_id = public.current_business_id());
create policy "members access payments" on public.payments for all using (business_id = public.current_business_id()) with check (business_id = public.current_business_id());
create policy "members access purchases" on public.purchases for all using (business_id = public.current_business_id()) with check (business_id = public.current_business_id());
create policy "members access stock transactions" on public.stock_transactions for all using (business_id = public.current_business_id()) with check (business_id = public.current_business_id());
create policy "members access expenses" on public.expenses for all using (business_id = public.current_business_id()) with check (business_id = public.current_business_id());
create policy "members access invoice items" on public.invoice_items for all using (
  exists (select 1 from public.invoices i where i.id = invoice_id and i.business_id = public.current_business_id())
) with check (
  exists (select 1 from public.invoices i where i.id = invoice_id and i.business_id = public.current_business_id())
);
create policy "members access purchase items" on public.purchase_items for all using (
  exists (select 1 from public.purchases p where p.id = purchase_id and p.business_id = public.current_business_id())
) with check (
  exists (select 1 from public.purchases p where p.id = purchase_id and p.business_id = public.current_business_id())
);

grant execute on function public.create_business(text, text, text) to authenticated;
grant execute on function public.create_invoice_transaction(jsonb, jsonb, jsonb) to authenticated;