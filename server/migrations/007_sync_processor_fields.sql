-- 007_sync_processor_fields.sql
-- Synchronize ropa_processor_sections table with updated models and frontend fields

-- 1. Add new columns
ALTER TABLE ropa_processor_sections ADD COLUMN IF NOT EXISTS controller_name VARCHAR;
ALTER TABLE ropa_processor_sections ADD COLUMN IF NOT EXISTS storage_methods_other TEXT;

-- 2. Rename columns to match updated naming convention and frontend
-- Note: Using DO block to handle renames idempotently (if column already exists with new name, skip)

DO $$ 
BEGIN 
    -- Rename access_policy to access_condition
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ropa_processor_sections' AND column_name='access_policy') THEN
        ALTER TABLE ropa_processor_sections RENAME COLUMN access_policy TO access_condition;
    END IF;

    -- Rename transfer_in_group to transfer_company
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ropa_processor_sections' AND column_name='transfer_in_group') THEN
        ALTER TABLE ropa_processor_sections RENAME COLUMN transfer_in_group TO transfer_company;
    END IF;
END $$;
