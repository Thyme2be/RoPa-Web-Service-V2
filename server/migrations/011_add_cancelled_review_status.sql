-- Migration 011: review cycle CANCELLED when Data Owner submits destruction (withdraws active RoPA review).

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'review_status_enum'
          AND e.enumlabel = 'CANCELLED'
    ) THEN
        ALTER TYPE review_status_enum ADD VALUE 'CANCELLED';
    END IF;
END$$;
