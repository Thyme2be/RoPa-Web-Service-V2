-- Step 1: Internal Backup for Safety
CREATE TABLE IF NOT EXISTS ropa_documents_backup_20260419 AS 
SELECT * FROM ropa_documents;

-- Step 2: Add missing column
ALTER TABLE ropa_documents ADD COLUMN IF NOT EXISTS document_number VARCHAR;
