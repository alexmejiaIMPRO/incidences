-- Add new columns to absence_requests table for enhanced tracking
ALTER TABLE absence_requests ADD COLUMN hours_per_day REAL DEFAULT 8.0;
ALTER TABLE absence_requests ADD COLUMN paid_days INTEGER DEFAULT 0;
ALTER TABLE absence_requests ADD COLUMN unpaid_days INTEGER DEFAULT 0;
ALTER TABLE absence_requests ADD COLUMN unpaid_comments TEXT;
ALTER TABLE absence_requests ADD COLUMN shift_change TEXT; -- JSON string for shift changes
ALTER TABLE absence_requests ADD COLUMN shift_details TEXT; -- Store selected shifts
