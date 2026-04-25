-- Migration 010: Add requested_at column to document_deletion_requests
-- This column was referenced in dashboard.py but missing from the model/table,
-- causing AttributeError on the backend and TypeError: Failed to fetch on the frontend.

ALTER TABLE document_deletion_requests
    ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill existing rows using decided_at or NOW() as fallback
UPDATE document_deletion_requests
SET requested_at = COALESCE(decided_at, NOW())
WHERE requested_at IS NULL;
