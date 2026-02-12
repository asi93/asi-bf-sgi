-- ============================================
-- Migration: Create Magic Links Table
-- Date: 2026-02-11
-- Purpose: Secure temporary links for WhatsApp data visualization
-- ============================================

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create magic_links table
CREATE TABLE IF NOT EXISTS magic_links (
    link_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token VARCHAR(64) UNIQUE NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(50),
    filters JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    used_at TIMESTAMPTZ,
    created_for_phone VARCHAR(50),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_magic_links_token ON magic_links(token);
CREATE INDEX idx_magic_links_expires ON magic_links(expires_at);
CREATE INDEX idx_magic_links_resource ON magic_links(resource_type, resource_id);
CREATE INDEX idx_magic_links_phone ON magic_links(created_for_phone);

-- Function to generate secure token
CREATE OR REPLACE FUNCTION generate_magic_token()
RETURNS VARCHAR(64) AS $$
DECLARE
    new_token VARCHAR(64);
BEGIN
    -- Generate random token using MD5 of random bytes + timestamp
    new_token := encode(digest(gen_random_bytes(32) || NOW()::TEXT, 'sha256'), 'hex');
    
    -- Ensure uniqueness (very unlikely to collide but safe)
    WHILE EXISTS (SELECT 1 FROM magic_links WHERE token = new_token) LOOP
        new_token := encode(digest(gen_random_bytes(32) || NOW()::TEXT, 'sha256'), 'hex');
    END LOOP;
    
    RETURN new_token;
END;
$$ LANGUAGE plpgsql;

-- Function to validate magic link
CREATE OR REPLACE FUNCTION validate_magic_link(p_token VARCHAR)
RETURNS TABLE (
    is_valid BOOLEAN,
    link_id UUID,
    resource_type VARCHAR,
    resource_id VARCHAR,
    filters JSONB,
    metadata JSONB,
    error_message TEXT
) AS $$
DECLARE
    link_record RECORD;
BEGIN
    -- Fetch the link
    SELECT * INTO link_record
    FROM magic_links
    WHERE token = p_token;
    
    -- Check if exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            false, 
            NULL::UUID, 
            NULL::VARCHAR, 
            NULL::VARCHAR, 
            NULL::JSONB,
            NULL::JSONB,
            'Lien invalide ou expiré'::TEXT;
        RETURN;
    END IF;
    
    -- Check if expired
    IF link_record.expires_at < NOW() THEN
        RETURN QUERY SELECT 
            false, 
            link_record.link_id, 
            NULL::VARCHAR, 
            NULL::VARCHAR, 
            NULL::JSONB,
            NULL::JSONB,
            'Ce lien a expiré'::TEXT;
        RETURN;
    END IF;
    
    -- Check if already used (single-use)
    IF link_record.used_at IS NOT NULL THEN
        RETURN QUERY SELECT 
            false, 
            link_record.link_id, 
            NULL::VARCHAR, 
            NULL::VARCHAR, 
            NULL::JSONB,
            NULL::JSONB,
            'Ce lien a déjà été utilisé'::TEXT;
        RETURN;
    END IF;
    
    -- Mark as used
    UPDATE magic_links 
    SET used_at = NOW() 
    WHERE token = p_token;
    
    -- Return valid link data
    RETURN QUERY SELECT 
        true, 
        link_record.link_id, 
        link_record.resource_type, 
        link_record.resource_id, 
        link_record.filters,
        link_record.metadata,
        NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired links (run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_magic_links()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM magic_links
    WHERE expires_at < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE magic_links ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations (links are self-secured by token)
CREATE POLICY "Magic links accessible par token" ON magic_links
    FOR ALL USING (true);

-- Comments
COMMENT ON TABLE magic_links IS 'Liens magiques temporaires pour accès sécurisé aux données depuis WhatsApp';
COMMENT ON COLUMN magic_links.token IS 'Token unique sécurisé (SHA-256)';
COMMENT ON COLUMN magic_links.resource_type IS 'Type de ressource: signalements_table, signalement_detail, top20, etc.';
COMMENT ON COLUMN magic_links.filters IS 'Filtres de requête au format JSONB';
COMMENT ON COLUMN magic_links.used_at IS 'Date d''utilisation (single-use)';
