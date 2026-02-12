-- Migration: Update signalements schema for guided workflow
-- Date: 2026-02-12
-- Description: Adds category and severity columns for structured incident reporting

-- Add 'categorie' column if it doesn't exist
ALTER TABLE signalements 
ADD COLUMN IF NOT EXISTS categorie TEXT;

-- Add 'gravite' column if it doesn't exist
ALTER TABLE signalements 
ADD COLUMN IF NOT EXISTS gravite TEXT;

-- Add 'photo_url' column if it doesn't exist (redundant check but safe)
ALTER TABLE signalements 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Create indexes for new columns to speed up filtering/analytics
CREATE INDEX IF NOT EXISTS idx_signalements_categorie ON signalements(categorie);
CREATE INDEX IF NOT EXISTS idx_signalements_gravite ON signalements(gravite);

-- Add comments for documentation
COMMENT ON COLUMN signalements.categorie IS 'Catégorie de l''incident (Sécurité, Technique, etc.)';
COMMENT ON COLUMN signalements.gravite IS 'Gravité de l''incident (Mineur, Modéré, Critique)';
