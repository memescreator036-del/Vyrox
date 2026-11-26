
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  title text,
  is_group boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid references public.conversations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid references auth.users(id),
  content text not null,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

create policy "Read profiles"
on public.profiles for select
to authenticated using (true);

create policy "Update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Read own memberships"
on public.conversation_members for select
to authenticated
using (user_id = auth.uid());

create policy "Create conversation"
on public.conversations for insert
to authenticated
with check (created_by = auth.uid());

create policy "Read member conversations"
on public.conversations for select
to authenticated
using (
  exists (
    select 1 from public.conversation_members m
    where m.conversation_id = id
    and m.user_id = auth.uid()
  )
);

create policy "Join created conversation"
on public.conversation_members for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.conversations c
    where c.id = conversation_id
    and c.created_by = auth.uid()
  )
);

create policy "Read member messages"
on public.messages for select
to authenticated
using (
  exists (
    select 1 from public.conversation_members m
    where m.conversation_id = messages.conversation_id
    and m.user_id = auth.uid()
  )
);

create policy "Send member messages"
on public.messages for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.conversation_members m
    where m.conversation_id = messages.conversation_id
    and m.user_id = auth.uid()
  )
);

