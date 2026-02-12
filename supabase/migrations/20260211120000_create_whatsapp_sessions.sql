create table if not exists public.whatsapp_sessions (
  phone_number text primary key,
  state text not null default 'IDLE',
  data jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.whatsapp_sessions enable row level security;

-- Policies (only service role needed for webhook, but adding basics)
create policy "Enable all for service role" on public.whatsapp_sessions
  for all using (true) with check (true);
