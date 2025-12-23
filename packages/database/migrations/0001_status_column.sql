ALTER TABLE word_progress ADD COLUMN status TEXT NOT NULL DEFAULT 'unknown' CHECK (status IN ('unknown', 'known'));
