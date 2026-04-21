-- 008_fix_processor_access_condition.sql
-- Safely ensure access_condition exists in ropa_processor_sections

DO $$ 
BEGIN 
    -- 1. Check if access_policy exists and rename it to access_condition
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ropa_processor_sections' AND column_name='access_policy') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ropa_processor_sections' AND column_name='access_condition') THEN
            ALTER TABLE ropa_processor_sections RENAME COLUMN access_policy TO access_condition;
        END IF;
    END IF;

    -- 2. If access_condition still doesn't exist (neither was renamed nor originally there), add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ropa_processor_sections' AND column_name='access_condition') THEN
        ALTER TABLE ropa_processor_sections ADD COLUMN access_condition TEXT;
    END IF;
END $$;
