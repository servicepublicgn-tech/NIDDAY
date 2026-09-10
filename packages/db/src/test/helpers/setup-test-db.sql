-- Prerequisites for drizzle-kit push on a bare Postgres instance.
-- Only creates extensions, schemas, and stub functions that Supabase
-- provides in production but don't exist in a vanilla PG container.
-- All tables/enums/indexes are handled by drizzle-kit push.

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN;
  END IF;
END
$$;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
  LANGUAGE sql AS $$ SELECT '00000000-0000-0000-0000-000000000000'::uuid $$;

CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb
  LANGUAGE sql AS $$ SELECT '{}'::jsonb $$;

CREATE OR REPLACE FUNCTION private.get_teams_for_authenticated_user()
  RETURNS SETOF uuid LANGUAGE sql
  AS $$ SELECT '00000000-0000-0000-0000-000000000000'::uuid LIMIT 0 $$;

CREATE OR REPLACE FUNCTION extract_product_names(data json)
  RETURNS text LANGUAGE sql AS $$ SELECT '' $$;

CREATE OR REPLACE FUNCTION generate_inbox_fts(name text, products text)
  RETURNS tsvector LANGUAGE sql
  AS $$ SELECT to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(products, '')) $$;
