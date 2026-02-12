
-- ============================================
-- TABLES WHATSAPP - Ajout pour intégration WhatsApp Business
-- ============================================

-- Table des messages WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('received', 'sent')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'delivered' CHECK (status IN ('sent', 'delivered', 'read', 'failed', 'received')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour requêtes rapides
CREATE INDEX idx_whatsapp_phone ON whatsapp_messages(phone_number);
CREATE INDEX idx_whatsapp_created ON whatsapp_messages(created_at DESC);
CREATE INDEX idx_whatsapp_type ON whatsapp_messages(message_type);

COMMENT ON TABLE whatsapp_messages IS 'Historique des messages WhatsApp envoyés et reçus';

-- Table pour abonnements alertes WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('stocks', 'equipements', 'budget', 'projets', 'incidents', 'all')),
  frequency TEXT NOT NULL CHECK (frequency IN ('immediate', 'daily', 'weekly', 'monthly')),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour subscriptions
CREATE INDEX idx_subscriptions_phone ON whatsapp_subscriptions(phone_number);
CREATE INDEX idx_subscriptions_active ON whatsapp_subscriptions(is_active) WHERE is_active = true;
CREATE INDEX idx_subscriptions_type ON whatsapp_subscriptions(alert_type);

COMMENT ON TABLE whatsapp_subscriptions IS 'Abonnements aux alertes WhatsApp par utilisateur';

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_whatsapp_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at sur whatsapp_subscriptions
CREATE TRIGGER whatsapp_subscriptions_updated_at_trigger
BEFORE UPDATE ON whatsapp_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_whatsapp_subscriptions_updated_at();
