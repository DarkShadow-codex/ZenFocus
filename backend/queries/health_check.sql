-- ============================================================================
-- ZENFOCUS DATABASE CONNECTIVITY & HEALTH CHECK QUERY
-- Compatible with PostgreSQL 13+ & Supabase (PostgREST / Supabase SQL Editor)
-- ============================================================================

SELECT
    current_database() AS database_name,
    current_user AS connected_user,
    NOW() AS server_time,
    version() AS postgres_version;

