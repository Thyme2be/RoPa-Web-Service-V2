-- Fix review_cycle_id nullable state in review_feedbacks
ALTER TABLE review_feedbacks ALTER COLUMN review_cycle_id DROP NOT NULL;
