-- Migration: Initial Schema for 10xCard
-- Description: Creates the initial database schema for the 10xCard application
-- Tables: generations, flashcards, generation_error_logs
-- Author: Cascade AI
-- Date: 2025-05-08

-- enable pgcrypto for uuid generation
create extension if not exists "pgcrypto";

-- generations table
create table generations (
    id serial primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    model text not null,
    generated_count integer not null default 0,
    accepted_count integer not null default 0,
    source_text_hash char(64) not null,
    source_text_length integer not null,
    duration integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    -- constraints
    constraint generations_accepted_count_check 
        check (accepted_count <= generated_count),
    constraint generations_source_text_length_check 
        check (source_text_length between 1000 and 10000)
);

-- flashcards table
create table flashcards (
    id serial primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    generation_id integer references generations(id) on delete set null,
    front varchar(200) not null,
    back varchar(600) not null,
    source varchar(16) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    -- constraints
    constraint flashcards_source_check 
        check (source in ('ai-full', 'ai-edited', 'manual'))
);

-- generation error logs table
create table generation_error_logs (
    id serial primary key,
    generation_id integer not null references generations(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    model text not null,
    error_message text not null,
    error_code varchar(100) not null,
    source_text_hash char(64) not null,
    source_text_length integer not null,
    timestamp timestamptz not null default now(),
    -- constraints
    constraint error_logs_source_text_length_check 
        check (source_text_length between 1000 and 10000)
);

-- indexes
create index idx_generations_user_id on generations(user_id);
create index idx_flashcards_user_id on flashcards(user_id);
create index idx_flashcards_generation_id on flashcards(generation_id);
create index idx_error_logs_user_id on generation_error_logs(user_id);

-- enable row level security
alter table generations enable row level security;
alter table flashcards enable row level security;
alter table generation_error_logs enable row level security;

-- rls policies for generations table
-- policy for authenticated users to view their own generations
create policy "Users can view their own generations"
    on generations for select
    to authenticated
    using (user_id = auth.uid());

-- policy for authenticated users to insert their own generations
create policy "Users can insert their own generations"
    on generations for insert
    to authenticated
    with check (user_id = auth.uid());

-- policy for authenticated users to update their own generations
create policy "Users can update their own generations"
    on generations for update
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

-- policy for authenticated users to delete their own generations
create policy "Users can delete their own generations"
    on generations for delete
    to authenticated
    using (user_id = auth.uid());

-- rls policies for flashcards table
-- policy for authenticated users to view their own flashcards
create policy "Users can view their own flashcards"
    on flashcards for select
    to authenticated
    using (user_id = auth.uid());

-- policy for authenticated users to insert their own flashcards
create policy "Users can insert their own flashcards"
    on flashcards for insert
    to authenticated
    with check (user_id = auth.uid());

-- policy for authenticated users to update their own flashcards
create policy "Users can update their own flashcards"
    on flashcards for update
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

-- policy for authenticated users to delete their own flashcards
create policy "Users can delete their own flashcards"
    on flashcards for delete
    to authenticated
    using (user_id = auth.uid());

-- rls policies for generation_error_logs table
-- policy for authenticated users to view their own error logs
create policy "Users can view their own error logs"
    on generation_error_logs for select
    to authenticated
    using (user_id = auth.uid());

-- policy for authenticated users to insert their own error logs
create policy "Users can insert their own error logs"
    on generation_error_logs for insert
    to authenticated
    with check (user_id = auth.uid());

-- policy for authenticated users to update their own error logs
create policy "Users can update their own error logs"
    on generation_error_logs for update
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

-- policy for authenticated users to delete their own error logs
create policy "Users can delete their own error logs"
    on generation_error_logs for delete
    to authenticated
    using (user_id = auth.uid());

-- triggers for updated_at timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger set_timestamp_generations
    before update on generations
    for each row
    execute function update_updated_at_column();

create trigger set_timestamp_flashcards
    before update on flashcards
    for each row
    execute function update_updated_at_column();
