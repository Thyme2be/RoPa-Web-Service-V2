-- Migration 006: Add is_sent column to ropa_processor_sections
ALTER TABLE ropa_processor_sections ADD COLUMN IF NOT EXISTS is_sent BOOLEAN DEFAULT FALSE;
