-- ============================================================
-- Cureus — Database Schema
-- Apply this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql/new)
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------
-- Reviews table — the core data model
-- -----------------------------------------------------------
create table if not exists reviews (
  id          uuid primary key default gen_random_uuid(),
  tmdb_id     integer not null,
  type        text not null check (type in ('movie', 'tv')),
  title       text not null,
  year        integer,
  poster      text,          -- TMDB poster path e.g. /abc123.jpg
  genres      text[],        -- e.g. ['Drama', 'Crime']
  review      text not null,
  reviewer    text not null,
  rating      integer check (rating between 1 and 5),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Index for listing reviews efficiently
create index if not exists reviews_created_at_idx on reviews (created_at desc);

-- -----------------------------------------------------------
-- Row-Level Security
-- -----------------------------------------------------------
alter table reviews enable row level security;

-- Public can read all reviews
create policy "Anyone can view reviews"
  on reviews for select
  using (true);

-- Only authenticated users can insert/update/delete
create policy "Authenticated users can insert reviews"
  on reviews for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update reviews"
  on reviews for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can delete reviews"
  on reviews for delete
  using (auth.role() = 'authenticated');

-- -----------------------------------------------------------
-- Auto-update updated_at on row modification
-- -----------------------------------------------------------
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger reviews_updated_at
  before update on reviews
  for each row
  execute function update_updated_at_column();
