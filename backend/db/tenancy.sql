-- server/db/tenancy.sql
CREATE OR REPLACE FUNCTION slugify_email(p_email text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE s text := lower(coalesce(p_email,''));
BEGIN
  s := regexp_replace(s, '[^a-z0-9]', '_', 'g');
  IF s ~ '^[^a-z]' THEN s := 'u_' || s; END IF;
  RETURN left(s, 63);
END
$$;

CREATE TABLE IF NOT EXISTS tenant_backup_state (
  schema_name text PRIMARY KEY,
  last_backup_at timestamptz
);

CREATE OR REPLACE FUNCTION create_tenant(p_email text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE sch text := slugify_email(p_email);
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = sch) THEN
    EXECUTE format('CREATE SCHEMA %I', sch);
  END IF;

  INSERT INTO tenant_backup_state(schema_name, last_backup_at)
  VALUES (sch, NULL)
  ON CONFLICT (schema_name) DO NOTHING;

  RETURN sch;
END
$$;