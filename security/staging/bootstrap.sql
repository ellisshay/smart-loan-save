-- Minimal Supabase-compatible environment for RLS/policy testing (staging only, synthetic data).
DO $$BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN NOINHERIT; END IF; END$$;
DO $$BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN NOINHERIT; END IF; END$$;
DO $$BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS; END IF; END$$;
DO $$BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticator') THEN CREATE ROLE authenticator LOGIN NOINHERIT; END IF; END$$;
GRANT anon, authenticated, service_role TO authenticator;
DO $$BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='supabase_admin') THEN CREATE ROLE supabase_admin LOGIN SUPERUSER; END IF; END$$;
DO $$BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='supabase_storage_admin') THEN CREATE ROLE supabase_storage_admin NOLOGIN; END IF; END$$;
DO $$BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='supabase_auth_admin') THEN CREATE ROLE supabase_auth_admin NOLOGIN; END IF; END$$;
CREATE SCHEMA extensions;
CREATE EXTENSION pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION "uuid-ossp" WITH SCHEMA extensions;
ALTER DATABASE postgres SET search_path = "$user", public, extensions;
SET search_path = "$user", public, extensions;
GRANT USAGE ON SCHEMA public, extensions TO anon, authenticated, service_role;
-- Supabase default: new public objects are granted to the API roles; RLS is the guard.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;

CREATE SCHEMA auth;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
CREATE TABLE auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text, raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(), email_confirmed_at timestamptz, phone text);
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS
$$ SELECT coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
$$ SELECT nullif(auth.jwt()->>'sub','')::uuid $$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT auth.jwt()->>'role' $$;
CREATE FUNCTION auth.email() RETURNS text LANGUAGE sql STABLE AS $$ SELECT auth.jwt()->>'email' $$;

CREATE SCHEMA storage;
GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;
CREATE TABLE storage.buckets (id text PRIMARY KEY, name text NOT NULL, public boolean DEFAULT false,
  file_size_limit bigint, allowed_mime_types text[], created_at timestamptz DEFAULT now(), owner uuid);
CREATE TABLE storage.objects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text REFERENCES storage.buckets(id),
  name text NOT NULL, owner uuid DEFAULT auth.uid(), metadata jsonb, created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(), UNIQUE(bucket_id, name));
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
GRANT ALL ON storage.objects, storage.buckets TO anon, authenticated, service_role;
CREATE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql IMMUTABLE AS
$$ SELECT (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'),1)-1] $$;
CREATE FUNCTION storage.filename(name text) RETURNS text LANGUAGE sql IMMUTABLE AS
$$ SELECT (string_to_array(name, '/'))[array_length(string_to_array(name, '/'),1)] $$;
