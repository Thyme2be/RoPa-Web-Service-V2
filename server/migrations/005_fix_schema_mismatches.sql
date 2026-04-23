-- =============================================================================
-- Migration 005: Fix schema mismatches and add missing tables
-- =============================================================================

-- 1. Create missing snapshot tables
CREATE TABLE IF NOT EXISTS ropa_owner_snapshots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid NOT NULL REFERENCES ropa_documents(id) ON DELETE CASCADE,
    user_id int NOT NULL REFERENCES users(id),
    data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ropa_processor_snapshots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid NOT NULL REFERENCES ropa_documents(id) ON DELETE CASCADE,
    user_id int NOT NULL REFERENCES users(id),
    data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT NOW()
);

-- 2. Create missing DPO comments table
CREATE TABLE IF NOT EXISTS dpo_section_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid NOT NULL REFERENCES ropa_documents(id) ON DELETE CASCADE,
    section_key varchar NOT NULL,
    comment text,
    created_by int NOT NULL REFERENCES users(id),
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dpo_section_comments_document_id ON dpo_section_comments(document_id);
CREATE INDEX IF NOT EXISTS idx_dpo_section_comments_section_key ON dpo_section_comments(section_key);

-- 3. Add missing columns to existing tables
ALTER TABLE ropa_processor_sections ADD COLUMN IF NOT EXISTS do_suggestion text;
ALTER TABLE processor_data_types ADD COLUMN IF NOT EXISTS is_sensitive boolean NOT NULL DEFAULT false;
ALTER TABLE review_feedbacks ADD COLUMN IF NOT EXISTS section_number integer;
ALTER TABLE users ADD COLUMN IF NOT EXISTS title varchar(50);

-- 4. Refactor owner_minor_consent_types
-- Check if owner_section_id already exists to avoid errors
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='owner_minor_consent_types' AND column_name='owner_section_id') THEN
        ALTER TABLE owner_minor_consent_types ADD COLUMN owner_section_id uuid REFERENCES ropa_owner_sections(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Drop the redundant intermediate table from previous schema versions
DROP TABLE IF EXISTS owner_minor_consents CASCADE;

-- Drop the old consent_id column if it exists (CASCADE will handle dependent constraints)
ALTER TABLE owner_minor_consent_types DROP COLUMN IF EXISTS consent_id CASCADE;
