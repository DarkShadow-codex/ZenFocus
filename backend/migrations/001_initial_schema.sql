-- ============================================================================
-- ZENFOCUS POSTGRESQL / SUPABASE PRODUCTION DATABASE SCHEMA
-- Strict Row Level Security (RLS), Parent-Child Ownership Isolation, & Auditing
-- Derived from Section 11 of ZENFOCUS Master Implementation Specification
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('PARENT', 'CHILD')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. FAMILY RELATIONSHIPS TABLE
CREATE TABLE IF NOT EXISTS public.family_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    child_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'revoked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at TIMESTAMPTZ,
    CONSTRAINT uq_parent_child UNIQUE (parent_user_id, child_user_id)
);

-- 4. REGISTERED DEVICES TABLE
CREATE TABLE IF NOT EXISTS public.devices (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('android', 'ios')),
    os_version TEXT,
    app_version TEXT,
    is_online BOOLEAN NOT NULL DEFAULT true,
    battery_level INT DEFAULT 100 CHECK (battery_level BETWEEN 0 AND 100),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. SINGLE-USE PAIRING INVITATIONS TABLE
CREATE TABLE IF NOT EXISTS public.pairing_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    parent_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'redeemed', 'expired', 'locked')),
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. VERSIONED RESTRICTION POLICIES TABLE
CREATE TABLE IF NOT EXISTS public.restriction_policies (
    id TEXT PRIMARY KEY,
    target_device_id TEXT NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    owner_type TEXT NOT NULL CHECK (owner_type IN ('parent', 'child')),
    policy_type TEXT NOT NULL CHECK (policy_type IN ('app_block', 'category_block', 'domain_block', 'focus_session', 'notification_focus')),
    target_package TEXT NOT NULL,
    app_name TEXT NOT NULL,
    app_category TEXT NOT NULL CHECK (app_category IN ('Social', 'Entertainment', 'Gaming', 'Productivity', 'Utilities')),
    desired_state TEXT NOT NULL CHECK (desired_state IN ('active', 'inactive')),
    version INT NOT NULL DEFAULT 1 CHECK (version >= 1),
    schedule_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_device_package UNIQUE (target_device_id, target_package)
);

-- 7. POLICY ENFORCEMENT RECEIPTS TABLE
CREATE TABLE IF NOT EXISTS public.policy_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    command_id TEXT NOT NULL,
    target_device_id TEXT NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    policy_id TEXT NOT NULL,
    policy_version INT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('applied', 'partial', 'failed', 'unsupported', 'queued', 'offline')),
    platform_code TEXT,
    platform_error_code TEXT,
    safe_diagnostic TEXT,
    reported_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. STUDY FOCUS SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.focus_sessions (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_type TEXT NOT NULL,
    duration_minutes INT NOT NULL CHECK (duration_minutes >= 1),
    break_duration_minutes INT NOT NULL DEFAULT 5,
    strict_mode BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL CHECK (status IN ('IDLE', 'PREPARING', 'FOCUSING', 'BREAK', 'PAUSED', 'COMPLETED', 'CANCELLED', 'ERROR')),
    started_at TIMESTAMPTZ,
    deadline TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    total_paused_duration_ms BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. RECURRING SCHEDULES TABLE
CREATE TABLE IF NOT EXISTS public.schedules (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    days TEXT[] NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    category TEXT NOT NULL CHECK (category IN ('School', 'Bedtime', 'Study')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. DAILY USAGE SUMMARIES TABLE
CREATE TABLE IF NOT EXISTS public.daily_usage_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_foreground_minutes NUMERIC(10, 2) NOT NULL DEFAULT 0,
    apps_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_device_usage_date UNIQUE (device_id, date)
);

-- 11. AUDIT EVENTS LOG (APPEND-ONLY)
CREATE TABLE IF NOT EXISTS public.audit_events (
    id TEXT PRIMARY KEY,
    actor_id TEXT NOT NULL,
    actor_role TEXT NOT NULL CHECK (actor_role IN ('PARENT', 'CHILD', 'SYSTEM')),
    event_type TEXT NOT NULL,
    description TEXT NOT NULL,
    safe_diagnostic TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pairing_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restriction_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_usage_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can read their own profile
CREATE POLICY users_self_read ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Policy 2: Parent can view family relationships where they are parent
CREATE POLICY parent_view_families ON public.family_relationships
    FOR SELECT USING (auth.uid() = parent_user_id);

-- Policy 3: Child can view family relationship where they are child
CREATE POLICY child_view_families ON public.family_relationships
    FOR SELECT USING (auth.uid() = child_user_id);

-- Policy 4: Parent can view devices belonging to their linked children
CREATE POLICY parent_view_child_devices ON public.devices
    FOR SELECT USING (
        user_id IN (
            SELECT child_user_id FROM public.family_relationships
            WHERE parent_user_id = auth.uid() AND status = 'active'
        )
    );

-- Policy 5: Child can view only their own device
CREATE POLICY child_view_own_devices ON public.devices
    FOR SELECT USING (user_id = auth.uid());

-- Policy 6: Restriction policies - Parent can read and write policies for their children's devices
CREATE POLICY parent_manage_policies ON public.restriction_policies
    FOR ALL USING (
        target_device_id IN (
            SELECT d.id FROM public.devices d
            JOIN public.family_relationships f ON f.child_user_id = d.user_id
            WHERE f.parent_user_id = auth.uid() AND f.status = 'active'
        )
    );

-- Policy 7: Child can read effective policies for their device, but cannot modify parent-owned policies
CREATE POLICY child_read_policies ON public.restriction_policies
    FOR SELECT USING (
        target_device_id IN (
            SELECT id FROM public.devices WHERE user_id = auth.uid()
        )
    );

CREATE POLICY child_manage_self_policies ON public.restriction_policies
    FOR UPDATE USING (
        target_device_id IN (
            SELECT id FROM public.devices WHERE user_id = auth.uid()
        ) AND owner_type = 'child'
    );

-- Policy 8: Device receipts - Target child device can insert execution receipts
CREATE POLICY device_insert_receipts ON public.policy_receipts
    FOR INSERT WITH CHECK (
        target_device_id IN (
            SELECT id FROM public.devices WHERE user_id = auth.uid()
        )
    );

CREATE POLICY parent_read_receipts ON public.policy_receipts
    FOR SELECT USING (
        target_device_id IN (
            SELECT d.id FROM public.devices d
            JOIN public.family_relationships f ON f.child_user_id = d.user_id
            WHERE f.parent_user_id = auth.uid() AND f.status = 'active'
        )
    );

-- ----------------------------------------------------------------------------
-- INDEXES FOR LOW-LATENCY SYNCHRONIZATION
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_policies_device_version ON public.restriction_policies (target_device_id, version);
CREATE INDEX IF NOT EXISTS idx_devices_user ON public.devices (user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_command ON public.policy_receipts (command_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_deadline ON public.focus_sessions (user_id, deadline);
CREATE INDEX IF NOT EXISTS idx_usage_device_date ON public.daily_usage_summaries (device_id, date);
