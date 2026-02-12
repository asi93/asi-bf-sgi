-- ============================================
-- Migration: Create Signalements (Incident Reports) Table
-- Date: 2026-02-11
-- ============================================

-- Create signalements table for incident tracking via WhatsApp
CREATE TABLE IF NOT EXISTS signalements (
    signalement_id VARCHAR(20) PRIMARY KEY,
    item VARCHAR(255) NOT NULL,
    pays VARCHAR(100) DEFAULT 'Burkina Faso',
    chantier VARCHAR(255),
    projet_id VARCHAR(20) REFERENCES projets(projet_id),
    probleme TEXT NOT NULL,
    action_entreprendre TEXT NOT NULL,
    section VARCHAR(100),
    personne_chargee VARCHAR(100),
    date_debut DATE NOT NULL DEFAULT CURRENT_DATE,
    date_echeance DATE NOT NULL,
    duree_jours INTEGER GENERATED ALWAYS AS (date_echeance - date_debut) STORED,
    statut VARCHAR(20) DEFAULT 'non_echue',
    rapport_avancement JSONB DEFAULT '[]'::jsonb,
    whatsapp_message_id VARCHAR(100),
    created_by_phone VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_signalements_statut ON signalements(statut);
CREATE INDEX idx_signalements_pays ON signalements(pays);
CREATE INDEX idx_signalements_chantier ON signalements(chantier);
CREATE INDEX idx_signalements_projet ON signalements(projet_id);
CREATE INDEX idx_signalements_section ON signalements(section);
CREATE INDEX idx_signalements_personne ON signalements(personne_chargee);
CREATE INDEX idx_signalements_date_echeance ON signalements(date_echeance);
CREATE INDEX idx_signalements_phone ON signalements(created_by_phone);

-- Function to auto-update status based on deadline
CREATE OR REPLACE FUNCTION update_signalement_statut()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-calculate status based on deadline
    IF NEW.date_echeance < CURRENT_DATE THEN
        NEW.statut = 'en_retard';
    ELSIF NEW.statut != 'resolu' THEN
        NEW.statut = 'non_echue';
    END IF;
    
    -- Update timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update status
CREATE TRIGGER trigger_update_signalement_statut
    BEFORE INSERT OR UPDATE ON signalements
    FOR EACH ROW
    EXECUTE FUNCTION update_signalement_statut();

-- Function to generate signalement ID
CREATE OR REPLACE FUNCTION generate_signalement_id()
RETURNS VARCHAR(20) AS $$
DECLARE
    new_id VARCHAR(20);
    counter INTEGER;
BEGIN
    -- Get the current count
    SELECT COUNT(*) + 1 INTO counter FROM signalements;
    
    -- Format: SIG-YYYY-NNN
    new_id := 'SIG-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(counter::TEXT, 3, '0');
    
    -- Check if exists (unlikely but safe)
    WHILE EXISTS (SELECT 1 FROM signalements WHERE signalement_id = new_id) LOOP
        counter := counter + 1;
        new_id := 'SIG-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(counter::TEXT, 3, '0');
    END LOOP;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- View: Top 20 Signalements (most critical incidents)
CREATE OR REPLACE VIEW v_top20_signalements AS
SELECT 
    signalement_id,
    item,
    pays,
    chantier,
    probleme,
    action_entreprendre,
    section,
    personne_chargee,
    date_debut,
    date_echeance,
    duree_jours,
    statut,
    rapport_avancement,
    created_by_phone,
    created_at,
    updated_at,
    -- Calculate days overdue or remaining
    CASE 
        WHEN statut = 'en_retard' THEN date_echeance - CURRENT_DATE
        WHEN statut = 'non_echue' THEN date_echeance - CURRENT_DATE
        ELSE 0
    END as jours_restants,
    -- Priority score for sorting (lower is more urgent)
    CASE statut
        WHEN 'en_retard' THEN 1
        WHEN 'non_echue' THEN 2
        WHEN 'resolu' THEN 3
        ELSE 4
    END as priorite
FROM signalements
WHERE statut != 'resolu' OR updated_at > NOW() - INTERVAL '7 days'
ORDER BY 
    priorite ASC,
    date_echeance ASC
LIMIT 20;

-- View: Signalements statistics
CREATE OR REPLACE VIEW v_stats_signalements AS
SELECT 
    COUNT(*) as total_signalements,
    COUNT(*) FILTER (WHERE statut = 'en_retard') as en_retard,
    COUNT(*) FILTER (WHERE statut = 'non_echue') as non_echus,
    COUNT(*) FILTER (WHERE statut = 'resolu') as resolus,
    COUNT(DISTINCT pays) as nombre_pays,
    COUNT(DISTINCT chantier) as nombre_chantiers,
    COUNT(DISTINCT section) as nombre_sections,
    AVG(duree_jours) FILTER (WHERE statut = 'resolu') as duree_moyenne_resolution
FROM signalements;

-- Enable RLS
ALTER TABLE signalements ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users
CREATE POLICY "Signalements accessible par tous" ON signalements
    FOR ALL USING (true);

-- Comments
COMMENT ON TABLE signalements IS 'Signalements d''incidents via WhatsApp avec suivi Top 20';
COMMENT ON COLUMN signalements.rapport_avancement IS 'Historique des rapports au format JSONB: [{date, texte, auteur}]';
COMMENT ON COLUMN signalements.statut IS 'Statut auto-calculé: en_retard, non_echue, resolu';
