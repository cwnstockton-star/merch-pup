-- ============================================================
--  MERCH PUP — Migration 003
--  Real inventory tracking: per-size stock, stock goes down on
--  each sale, and sales can't go past what's in stock.
--  Also: fan-paid service fee column, and stock edits that don't
--  wipe out sales made while the edit form was open.
--  Safe to run more than once.
--  Run this in the Supabase SQL editor against your live DB
--  BEFORE deploying the updated checkout edge functions.
-- ============================================================

-- 1. Per-size stock, e.g. {"S": 10, "M": 4, "L": 0}.
--    Empty {} = stock isn't split by size (quantity_available is the only count).
--    quantity_available stays the item's TOTAL stock.
alter table public.merch_items
  add column if not exists size_stock jsonb not null default '{}'::jsonb;

-- 2. Order statuses
--    pending   = paid on Stripe, order being finalized (not shown to anyone)
--    paid      = ready for pickup
--    picked_up = collected at the merch table
--    refunded  = sold out while the fan was paying; payment refunded
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders
  add constraint orders_status_check
  check (status in ('pending', 'paid', 'picked_up', 'refunded'));

-- 3. Finalize an order in ONE transaction: take the stock, write the order
--    items, mark the order paid. If anything is out of stock, nothing is
--    taken and the order is marked refunded instead.
--    The row lock on the order means two simultaneous calls for the same
--    order can't both take stock; the UPDATE ... WHERE stock >= qty means two
--    fans can't both buy the last one.
--    p_items: [{"id": "<merch uuid>", "size": "M", "quantity": 2}, ...]
--    Returns 'finalized' if THIS call completed the order, 'refunded' if it
--    sold out, or the order's existing status if it was already finalized.
create or replace function public.finalize_order(p_order_id uuid, p_items jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_line record;
begin
  select status into v_status from orders where id = p_order_id for update;
  if v_status is null then
    raise exception 'Order % not found', p_order_id;
  end if;
  if v_status <> 'pending' then
    return v_status; -- already finalized by an earlier call
  end if;

  begin
    -- Same item + size requested twice in a cart → combine; consistent order avoids deadlocks
    for v_line in
      select (e->>'id')::uuid as item_id,
             coalesce(e->>'size', '') as size,
             sum((e->>'quantity')::int) as qty
      from jsonb_array_elements(p_items) e
      group by 1, 2
      order by 1, 2
    loop
      update merch_items m
         set quantity_available = m.quantity_available - v_line.qty,
             size_stock = case
               when m.size_stock ? v_line.size
                 then jsonb_set(m.size_stock, array[v_line.size],
                                to_jsonb((m.size_stock->>v_line.size)::int - v_line.qty))
               else m.size_stock
             end
       where m.id = v_line.item_id
         and m.quantity_available >= v_line.qty
         and (not (m.size_stock ? v_line.size)
              or (m.size_stock->>v_line.size)::int >= v_line.qty);

      if not found then
        raise exception using errcode = 'MPSO1', message = 'sold out';
      end if;
    end loop;

    insert into order_items (order_id, merch_item_id, name, price, size, quantity)
    select p_order_id, m.id, m.name, m.price, e->>'size', (e->>'quantity')::int
    from jsonb_array_elements(p_items) e
    join merch_items m on m.id = (e->>'id')::uuid;

    update orders set status = 'paid' where id = p_order_id;
    return 'finalized';

  exception when sqlstate 'MPSO1' then
    -- stock changes above are rolled back automatically
    update orders set status = 'refunded' where id = p_order_id;
    return 'refunded';
  end;
end;
$$;

-- Only the server (edge functions using the service role) may call it
revoke all on function public.finalize_order(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.finalize_order(uuid, jsonb) to service_role;


-- 4. Fan-paid service fee (5% + $0.50) recorded separately from the merch,
--    so promoter revenue = total - service_fee (the artist keeps 100% of
--    their prices).
alter table public.orders
  add column if not exists service_fee numeric(10, 2) not null default 0;

-- 5. Promoters can update merch on their own events (migration 001 only
--    allowed adding it).
do $$ begin
  create policy "Owners can update merch on their events"
    on public.merch_items for update
    using (
      exists (
        select 1 from public.events
        where id = event_id and owner_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

-- 6. Save a stock edit as a CHANGE, not a fixed number, so sales made while
--    the edit form was open aren't erased.
--    Example: form opened at M = 10, promoter types 15 (+5 restock), 2 sell
--    meanwhile (now 8) → saved as 13.
--    p_loaded_*: stock when the form was opened; p_new_*: what was typed.
--    Sized items use p_*_sizes ({"S": 10, ...}); unsized items use p_*_total.
--    Returns { size_stock, quantity_available, sold_while_editing }.
create or replace function public.update_merch_stock(
  p_item_id uuid,
  p_loaded_sizes jsonb,
  p_new_sizes jsonb,
  p_loaded_total integer,
  p_new_total integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item merch_items%rowtype;
  v_size text;
  v_new integer;
  v_now integer;
  v_result jsonb := '{}'::jsonb;
  v_total integer := 0;
  v_sold integer := 0;
begin
  select * into v_item from merch_items where id = p_item_id for update;
  if not found then
    raise exception 'Item not found';
  end if;

  -- only the event's owner may change its stock
  if not exists (
    select 1 from events where id = v_item.event_id and owner_id = auth.uid()
  ) then
    raise exception 'Not allowed to edit this item';
  end if;

  if p_new_sizes is null or p_new_sizes = '{}'::jsonb then
    v_sold := greatest(0, p_loaded_total - v_item.quantity_available);
    v_total := greatest(0, p_new_total + (v_item.quantity_available - p_loaded_total));
  else
    for v_size, v_new in
      select key, value::integer from jsonb_each_text(p_new_sizes)
    loop
      -- size was tracked when the form opened and still is → apply the change
      if p_loaded_sizes ? v_size and v_item.size_stock ? v_size then
        v_now := (v_item.size_stock->>v_size)::integer;
        v_sold := v_sold + greatest(0, (p_loaded_sizes->>v_size)::integer - v_now);
        v_new := greatest(0, v_new + v_now - (p_loaded_sizes->>v_size)::integer);
      end if;
      -- otherwise it's a newly added size → use the typed number as-is
      v_result := v_result || jsonb_build_object(v_size, v_new);
      v_total := v_total + v_new;
    end loop;
  end if;

  update merch_items
     set size_stock = v_result, quantity_available = v_total
   where id = p_item_id;

  return jsonb_build_object(
    'size_stock', v_result,
    'quantity_available', v_total,
    'sold_while_editing', v_sold
  );
end;
$$;

revoke all on function public.update_merch_stock(uuid, jsonb, jsonb, integer, integer) from public, anon;
grant execute on function public.update_merch_stock(uuid, jsonb, jsonb, integer, integer) to authenticated;
