-- Migration: Create photos table for media gallery
-- Description: Table pour stocker les photos/vidéos uploadées via WhatsApp, organisées par projet

CREATE TABLE IF NOT EXISTS photos (
  id BIGSERIAL PRIMARY KEY,
  projet_id UUID REFERENCES projets(projet_id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  uploaded_by TEXT,  -- Numéro WhatsApp de l'uploader
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide par projet
CREATE INDEX IF NOT EXISTS idx_photos_projet_id ON photos(projet_id);

-- Index pour tri par date
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at DESC);

-- RLS Policies
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Politique: Tout le monde peut voir les photos
CREATE POLICY "Photos are viewable by everyone" 
  ON photos FOR SELECT 
  USING (true);

-- Politique: Utilisateurs authentifiés peuvent insérer
CREATE POLICY "Authenticated users can insert photos" 
  ON photos FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Politique: Utilisateurs authentifiés peuvent mettre à jour
CREATE POLICY "Authenticated users can update photos" 
  ON photos FOR UPDATE 
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Politique: Utilisateurs authentifiés peuvent supprimer
CREATE POLICY "Authenticated users can delete photos" 
  ON photos FOR DELETE 
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
