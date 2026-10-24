-- =============================================================
-- ADMIN: order stages + remake handling  (run once in the Supabase SQL editor; safe to re-run)
-- Run AFTER sql/checkout.sql and sql/measurements.sql.
--
--   * every paid order gets a stage: NEW > STITCHING > SHIPPED > DELIVERED
--     (courier + tracking number on SHIPPED; DELIVERED sets delivered_at,
--      which starts the 15-day remake window)
--   * remake requests get a workflow: REQUESTED > APPROVED > IN_STITCHING > SHIPPED,
--     or REJECTED with a note the customer can read
--   * only the server (service-role key) writes these; customers can only read their own rows
-- =============================================================

alter table public.checkout_sessions
  add column if not exists fulfilment_status text not null default 'NEW',
  add column if not exists stitching_at      timestamptz,
  add column if not exists shipped_at        timestamptz,
  add column if not exists courier           text,
  add column if not exists tracking_number   text,
  add column if not exists admin_notes       text;

alter table public.checkout_sessions drop constraint if exists checkout_sessions_fulfilment_chk;
alter table public.checkout_sessions
  add constraint checkout_sessions_fulfilment_chk
  check (fulfilment_status in ('NEW','STITCHING','SHIPPED','DELIVERED'));

-- orders already marked delivered keep that
update public.checkout_sessions
set fulfilment_status = 'DELIVERED'
where delivered_at is not null and fulfilment_status = 'NEW';

create index if not exists checkout_sessions_fulfilment_idx
  on public.checkout_sessions (fulfilment_status, paid_at desc) where status = 'PAID';

alter table public.remake_requests
  add column if not exists admin_note      text,
  add column if not exists courier         text,
  add column if not exists tracking_number text,
  add column if not exists decided_at      timestamptz,
  add column if not exists updated_at      timestamptz not null default now();

alter table public.remake_requests drop constraint if exists remake_requests_status_chk;
alter table public.remake_requests
  add constraint remake_requests_status_chk
  check (status in ('REQUESTED','APPROVED','IN_STITCHING','SHIPPED','REJECTED'));

create index if not exists remake_requests_status_idx
  on public.remake_requests (status, created_at desc);
