-- ============================================
-- Migration: Add photo_url to signalements
-- Date: 2026-02-12
-- ============================================

-- Add optional photo_url column to signalements table
ALTER TABLE signalements 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add index for performance when filtering by photos
CREATE INDEX IF NOT EXISTS idx_signalements_photo 
ON signalements(photo_url) 
WHERE photo_url IS NOT NULL;

-- Comment
COMMENT ON COLUMN signalements.photo_url IS 'URL de la photo jointe au signalement (optionnel)';
