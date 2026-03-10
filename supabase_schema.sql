-- Final SQL Schema for TaskPilot (Supabase)
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    refresh_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'planning',
    health_status TEXT DEFAULT 'good',
    progress INTEGER DEFAULT 0,
    target_end_date TIMESTAMP WITH TIME ZONE,
    owner_email TEXT NOT NULL,
    member_emails TEXT[] DEFAULT '{}',
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'todo',
    assignee_email TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    labels TEXT[] DEFAULT '{}',
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Chat Messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id),
    sender_name TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id),
    actor_email TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    metadata JSONB DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. AI Insights table
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    summary TEXT,
    key_findings TEXT[] DEFAULT '{}',
    risks TEXT[] DEFAULT '{}',
    recommendations TEXT[] DEFAULT '{}',
    user_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Team Members table
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email TEXT NOT NULL,
    display_name TEXT,
    job_title TEXT,
    department TEXT,
    role TEXT DEFAULT 'member',
    skills TEXT[] DEFAULT '{}',
    domains TEXT[] DEFAULT '{}',
    availability JSONB DEFAULT '{"hours_per_week": 40}',
    max_concurrent_tasks INTEGER DEFAULT 5,
    organization_id TEXT DEFAULT 'default',
    is_active BOOLEAN DEFAULT true,
    current_workload INTEGER DEFAULT 0,
    burnout_risk TEXT DEFAULT 'low',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Invites table
CREATE TABLE IF NOT EXISTS invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invite_token TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'member',
    workspace_id TEXT DEFAULT 'default',
    expiry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS and add basic policies (ALLOW ALL for now as per user preference for simplicity)
-- In a real app, you would restrict these based on auth.uid()
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Idempotent policy creation
DROP POLICY IF EXISTS "Allow all access" ON users;
CREATE POLICY "Allow all access" ON users FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access" ON projects;
CREATE POLICY "Allow all access" ON projects FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access" ON tasks;
CREATE POLICY "Allow all access" ON tasks FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access" ON chat_messages;
CREATE POLICY "Allow all access" ON chat_messages FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access" ON audit_logs;
CREATE POLICY "Allow all access" ON audit_logs FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access" ON ai_insights;
CREATE POLICY "Allow all access" ON ai_insights FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access" ON team_members;
CREATE POLICY "Allow all access" ON team_members FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access" ON invites;
CREATE POLICY "Allow all access" ON invites FOR ALL USING (true);
