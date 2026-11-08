create table if not exists books (
  user_id text primary key,
  data text not null,
  share_token text not null unique,
  updated_at timestamptz not null default now()
);
