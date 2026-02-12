-- ============================================
-- CORRECTIONS POUR L'IMPORT CSV
-- Exécuter dans l'ordre dans Supabase SQL Editor
-- ============================================

-- ============================================
-- FIX 1: TABLE MARCHES (GESMA)
-- Le marche_id n'est pas unique dans le CSV
-- (un même marché peut couvrir plusieurs projets)
-- On supprime la table et on la recrée avec une clé composite
-- ============================================

DROP TABLE IF EXISTS marches CASCADE;

CREATE TABLE marches (
    marche_id VARCHAR(20),
    projet_id VARCHAR(20) REFERENCES projets(projet_id),
    numero_marche VARCHAR(50),
    intitule VARCHAR(255),
    montant_ht_fcfa BIGINT DEFAULT 0,
    tva_fcfa BIGINT DEFAULT 0,
    montant_ttc_fcfa BIGINT DEFAULT 0,
    date_signature DATE,
    duree_mois INTEGER,
    autorite_contractante VARCHAR(100),
    source_financement VARCHAR(100),
    nombre_tranches INTEGER DEFAULT 1,
    statut_paiement VARCHAR(50) DEFAULT 'En attente',
    taux_execution DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (marche_id, projet_id)
);

CREATE INDEX idx_marches_projet ON marches(projet_id);
CREATE INDEX idx_marches_statut ON marches(statut_paiement);
CREATE INDEX idx_marches_marche ON marches(marche_id);

-- ============================================
-- FIX 2: TABLE INCIDENTS
-- Le CSV contient "Oui"/"Non" mais la colonne est BOOLEAN
-- On change le type en VARCHAR pour accepter le CSV tel quel
-- ============================================

DROP TABLE IF EXISTS incidents CASCADE;

CREATE TABLE incidents (
    incident_id VARCHAR(20) PRIMARY KEY,
    numero_incident VARCHAR(50),
    date_incident DATE,
    type_incident VARCHAR(100),
    categorie VARCHAR(100),
    gravite VARCHAR(50),
    lieu VARCHAR(200),
    description TEXT,
    cause_identifiee TEXT,
    impact_financier_fcfa BIGINT DEFAULT 0,
    impact_delai_jours INTEGER DEFAULT 0,
    personnes_impliquees TEXT,
    declarant VARCHAR(100),
    actions_immediates TEXT,
    date_resolution DATE,
    statut VARCHAR(50) DEFAULT 'Ouvert',
    cout_resolution_fcfa BIGINT DEFAULT 0,
    assurance_sollicitee VARCHAR(10) DEFAULT 'Non',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_incidents_type ON incidents(type_incident);
CREATE INDEX idx_incidents_gravite ON incidents(gravite);
CREATE INDEX idx_incidents_statut ON incidents(statut);
CREATE INDEX idx_incidents_date ON incidents(date_incident);

-- ============================================
-- FIX 3: TABLE GIFE
-- Supprimer la contrainte de clé étrangère
-- pour permettre l'import dans n'importe quel ordre
-- (on la remet après l'import si besoin)
-- ============================================

DROP TABLE IF EXISTS gife CASCADE;

CREATE TABLE gife (
    gife_id VARCHAR(20) PRIMARY KEY,
    projet_id VARCHAR(20),
    numero_gife VARCHAR(50),
    date_emission DATE,
    objet TEXT,
    type_depense VARCHAR(100),
    montant_engage_fcfa BIGINT DEFAULT 0,
    montant_liquide_fcfa BIGINT DEFAULT 0,
    date_limite_utilisation DATE,
    beneficiaire VARCHAR(100),
    statut VARCHAR(50) DEFAULT 'En cours',
    service_emetteur VARCHAR(100),
    validateur VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gife_projet ON gife(projet_id);
CREATE INDEX idx_gife_statut ON gife(statut);
CREATE INDEX idx_gife_type ON gife(type_depense);

-- ============================================
-- VÉRIFICATION
-- ============================================
SELECT 'Tables recréées avec succès!' AS resultat;
