-- ============================================================================
-- ZENFOCUS POSTGRESQL / SUPABASE RPC: DATABASE HEALTH CHECK
-- Exposes server metadata and connectivity status to client applications
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_connection()
RETURNS TABLE (
    database_name TEXT,
    connected_user TEXT,
    server_time TIMESTAMPTZ,
    postgres_version TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT
        current_database()::TEXT AS database_name,
        current_user::TEXT AS connected_user,
        NOW() AS server_time,
        version()::TEXT AS postgres_version;
$$;

-- Allow anon and authenticated roles to verify connection health
GRANT EXECUTE ON FUNCTION public.check_connection() TO anon, authenticated;
COMMENT ON FUNCTION public.check_connection() IS 'Safe connectivity probe returning current database name, connected user, timestamp, and PostgreSQL version.';

