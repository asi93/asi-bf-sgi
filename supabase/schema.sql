-- ============================================
-- SCHEMA SQL - ASI-BF SGI (Système de Gestion Intégré)
-- Base de données complète pour Supabase
-- ============================================

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: PROJETS
-- Gestion des projets d'infrastructure
-- ============================================
CREATE TABLE IF NOT EXISTS projets (
    projet_id VARCHAR(20) PRIMARY KEY,
    nom_projet VARCHAR(255) NOT NULL,
    acronyme VARCHAR(50),
    type_projet VARCHAR(100),
    pays VARCHAR(100) DEFAULT 'Burkina Faso',
    region VARCHAR(100),
    province VARCHAR(100),
    commune VARCHAR(100),
    ville_village VARCHAR(100),
    autorite_contractante VARCHAR(100),
    proprietaire_marche VARCHAR(50),
    source_financement VARCHAR(100),
    montant_ht_fcfa BIGINT DEFAULT 0,
    tva_fcfa BIGINT DEFAULT 0,
    montant_ttc_fcfa BIGINT DEFAULT 0,
    date_os DATE,
    duree_prevue_mois INTEGER,
    date_reception_provisoire DATE,
    date_reception_definitive DATE,
    statut VARCHAR(50) DEFAULT 'En cours',
    niveau_performance VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les recherches fréquentes
CREATE INDEX idx_projets_statut ON projets(statut);
CREATE INDEX idx_projets_pays ON projets(pays);
CREATE INDEX idx_projets_region ON projets(region);
CREATE INDEX idx_projets_type ON projets(type_projet);

-- ============================================
-- TABLE: GESMA (Marchés)
-- Gestion des marchés et contrats
-- ============================================
CREATE TABLE IF NOT EXISTS marches (
    marche_id VARCHAR(20) PRIMARY KEY,
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
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_marches_projet ON marches(projet_id);
CREATE INDEX idx_marches_statut ON marches(statut_paiement);

-- ============================================
-- TABLE: GIFE (Engagements budgétaires)
-- Gestion des engagements financiers
-- ============================================
CREATE TABLE IF NOT EXISTS gife (
    gife_id VARCHAR(20) PRIMARY KEY,
    projet_id VARCHAR(20) REFERENCES projets(projet_id),
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
-- TABLE: GIS (Inventaire Stocks)
-- Gestion des stocks et articles
-- ============================================
CREATE TABLE IF NOT EXISTS stocks (
    article_id VARCHAR(20) PRIMARY KEY,
    code_article VARCHAR(50),
    designation VARCHAR(255) NOT NULL,
    categorie VARCHAR(100),
    unite VARCHAR(20),
    stock_actuel INTEGER DEFAULT 0,
    stock_minimum INTEGER DEFAULT 0,
    stock_alerte INTEGER DEFAULT 0,
    prix_unitaire_moyen_fcfa BIGINT DEFAULT 0,
    valeur_stock_fcfa BIGINT DEFAULT 0,
    localisation VARCHAR(100),
    fournisseurs_principaux TEXT,
    derniere_entree DATE,
    derniere_sortie DATE,
    statut VARCHAR(20) DEFAULT 'Actif',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stocks_categorie ON stocks(categorie);
CREATE INDEX idx_stocks_localisation ON stocks(localisation);
CREATE INDEX idx_stocks_alerte ON stocks(stock_actuel, stock_alerte);

-- ============================================
-- TABLE: GIFL (Parc automobile et équipements)
-- Gestion de la flotte et équipements
-- ============================================
CREATE TABLE IF NOT EXISTS equipements (
    equipement_id VARCHAR(20) PRIMARY KEY,
    designation VARCHAR(255) NOT NULL,
    categorie VARCHAR(100),
    marque VARCHAR(100),
    numero_serie VARCHAR(100),
    immatriculation VARCHAR(50),
    annee_acquisition INTEGER,
    date_acquisition DATE,
    valeur_acquisition_fcfa BIGINT DEFAULT 0,
    valeur_actuelle_fcfa BIGINT DEFAULT 0,
    kilometrage_heures INTEGER DEFAULT 0,
    unite_utilisation VARCHAR(20) DEFAULT 'km',
    etat VARCHAR(50),
    affectation VARCHAR(100),
    date_derniere_visite_technique DATE,
    date_prochaine_visite_technique DATE,
    assurance_numero VARCHAR(50),
    assurance_expiration DATE,
    statut VARCHAR(50) DEFAULT 'En service',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_equipements_categorie ON equipements(categorie);
CREATE INDEX idx_equipements_statut ON equipements(statut);
CREATE INDEX idx_equipements_visite ON equipements(date_prochaine_visite_technique);

-- ============================================
-- TABLE: GIOM (Ordres de mission)
-- Gestion des missions
-- ============================================
CREATE TABLE IF NOT EXISTS ordres_mission (
    om_id VARCHAR(20) PRIMARY KEY,
    numero_om VARCHAR(50),
    employe_id VARCHAR(20),
    date_emission DATE,
    date_debut_mission DATE,
    date_fin_mission DATE,
    duree_jours INTEGER,
    destination VARCHAR(100),
    pays VARCHAR(100),
    objet_mission VARCHAR(255),
    frais_transport_fcfa BIGINT DEFAULT 0,
    frais_hebergement_fcfa BIGINT DEFAULT 0,
    per_diem_fcfa BIGINT DEFAULT 0,
    autres_frais_fcfa BIGINT DEFAULT 0,
    total_frais_fcfa BIGINT DEFAULT 0,
    avance_percue_fcfa BIGINT DEFAULT 0,
    moyen_transport VARCHAR(100),
    statut VARCHAR(50) DEFAULT 'En cours',
    validateur VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_om_statut ON ordres_mission(statut);
CREATE INDEX idx_om_employe ON ordres_mission(employe_id);
CREATE INDEX idx_om_date ON ordres_mission(date_debut_mission);

-- ============================================
-- TABLE: GIC (Bons de commande)
-- Gestion des achats
-- ============================================
CREATE TABLE IF NOT EXISTS bons_commande (
    bc_id VARCHAR(20) PRIMARY KEY,
    numero_bc VARCHAR(50),
    date_emission DATE,
    fournisseur VARCHAR(200),
    categorie_achat VARCHAR(100),
    objet TEXT,
    montant_ht_fcfa BIGINT DEFAULT 0,
    tva_fcfa BIGINT DEFAULT 0,
    montant_ttc_fcfa BIGINT DEFAULT 0,
    delai_livraison_jours INTEGER,
    date_livraison_prevue DATE,
    date_livraison_effective DATE,
    statut_livraison VARCHAR(50) DEFAULT 'En attente',
    condition_paiement VARCHAR(100),
    date_echeance_paiement DATE,
    date_paiement_effectif DATE,
    statut_paiement VARCHAR(50) DEFAULT 'En attente',
    responsable_achat VARCHAR(100),
    observations TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bc_fournisseur ON bons_commande(fournisseur);
CREATE INDEX idx_bc_statut_livraison ON bons_commande(statut_livraison);
CREATE INDEX idx_bc_statut_paiement ON bons_commande(statut_paiement);

-- ============================================
-- TABLE: GIH (Incidents)
-- Gestion des incidents et accidents
-- ============================================
CREATE TABLE IF NOT EXISTS incidents (
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
    assurance_sollicitee BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_incidents_type ON incidents(type_incident);
CREATE INDEX idx_incidents_gravite ON incidents(gravite);
CREATE INDEX idx_incidents_statut ON incidents(statut);
CREATE INDEX idx_incidents_date ON incidents(date_incident);

-- ============================================
-- TABLE: GIASS (Assurances)
-- Gestion des assurances
-- ============================================
CREATE TABLE IF NOT EXISTS assurances (
    assurance_id VARCHAR(20) PRIMARY KEY,
    numero_police VARCHAR(50),
    type_assurance VARCHAR(100),
    categorie VARCHAR(50),
    compagnie VARCHAR(100),
    date_effet DATE,
    date_echeance DATE,
    prime_annuelle_fcfa BIGINT DEFAULT 0,
    capital_assure_fcfa BIGINT DEFAULT 0,
    franchise_fcfa BIGINT DEFAULT 0,
    nombre_sinistres INTEGER DEFAULT 0,
    montant_sinistres_fcfa BIGINT DEFAULT 0,
    montant_indemnise_fcfa BIGINT DEFAULT 0,
    statut VARCHAR(50) DEFAULT 'Actif',
    gestionnaire VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assurances_type ON assurances(type_assurance);
CREATE INDEX idx_assurances_echeance ON assurances(date_echeance);
CREATE INDEX idx_assurances_statut ON assurances(statut);

-- ============================================
-- TABLE: IMPORT (Registres d'importation)
-- Gestion des importations
-- ============================================
CREATE TABLE IF NOT EXISTS imports (
    import_id VARCHAR(20) PRIMARY KEY,
    numero_import VARCHAR(50),
    date_commande DATE,
    fournisseur VARCHAR(200),
    pays_origine VARCHAR(100),
    categorie_produit VARCHAR(100),
    description TEXT,
    montant_fob_fcfa BIGINT DEFAULT 0,
    frais_transport_fcfa BIGINT DEFAULT 0,
    frais_assurance_fcfa BIGINT DEFAULT 0,
    droits_douane_fcfa BIGINT DEFAULT 0,
    taxes_diverses_fcfa BIGINT DEFAULT 0,
    tva_import_fcfa BIGINT DEFAULT 0,
    cout_total_fcfa BIGINT DEFAULT 0,
    incoterm VARCHAR(20),
    mode_transport VARCHAR(50),
    port_arrivee VARCHAR(100),
    numero_bl VARCHAR(50),
    date_arrivee_prevue DATE,
    date_arrivee_effective DATE,
    date_dedouanement DATE,
    numero_declaration_douane VARCHAR(50),
    transitaire VARCHAR(100),
    statut VARCHAR(50) DEFAULT 'En transit',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_imports_fournisseur ON imports(fournisseur);
CREATE INDEX idx_imports_statut ON imports(statut);
CREATE INDEX idx_imports_categorie ON imports(categorie_produit);

-- ============================================
-- TABLE: GIDE (Candidatures)
-- Gestion des candidatures RH
-- ============================================
CREATE TABLE IF NOT EXISTS candidatures (
    candidature_id VARCHAR(20) PRIMARY KEY,
    numero_candidature VARCHAR(50),
    date_reception DATE,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    date_naissance DATE,
    sexe CHAR(1),
    telephone VARCHAR(50),
    email VARCHAR(100),
    ville_residence VARCHAR(100),
    poste_vise VARCHAR(100),
    niveau_etudes VARCHAR(100),
    annees_experience INTEGER DEFAULT 0,
    pretentions_salariales_fcfa BIGINT DEFAULT 0,
    disponibilite VARCHAR(50),
    source VARCHAR(100),
    date_traitement DATE,
    statut VARCHAR(100),
    decision VARCHAR(50),
    evaluateur VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_candidatures_poste ON candidatures(poste_vise);
CREATE INDEX idx_candidatures_statut ON candidatures(statut);
CREATE INDEX idx_candidatures_decision ON candidatures(decision);

-- ============================================
-- TABLE: ALERTES
-- Système d'alertes automatiques
-- ============================================
CREATE TABLE IF NOT EXISTS alertes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    priorite VARCHAR(20) DEFAULT 'moyenne',
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    entite_id VARCHAR(50),
    entite_type VARCHAR(50),
    date_creation TIMESTAMPTZ DEFAULT NOW(),
    date_traitement TIMESTAMPTZ,
    statut VARCHAR(20) DEFAULT 'active',
    traite_par VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alertes_type ON alertes(type);
CREATE INDEX idx_alertes_priorite ON alertes(priorite);
CREATE INDEX idx_alertes_statut ON alertes(statut);

-- ============================================
-- TABLE: HISTORIQUE_CHAT
-- Historique des conversations IA
-- ============================================
CREATE TABLE IF NOT EXISTS historique_chat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(100),
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_session ON historique_chat(session_id);

-- ============================================
-- VUES - Statistiques et tableaux de bord
-- ============================================

-- Vue: Statistiques des projets
CREATE OR REPLACE VIEW v_stats_projets AS
SELECT 
    COUNT(*) as total_projets,
    COUNT(*) FILTER (WHERE statut = 'En cours') as projets_en_cours,
    COUNT(*) FILTER (WHERE statut = 'Achevé') as projets_acheves,
    SUM(montant_ttc_fcfa) as montant_total_ttc,
    AVG(CASE WHEN statut = 'Achevé' THEN duree_prevue_mois END) as duree_moyenne_acheves,
    COUNT(DISTINCT pays) as nombre_pays,
    COUNT(DISTINCT region) as nombre_regions
FROM projets;

-- Vue: Statistiques financières
CREATE OR REPLACE VIEW v_stats_finances AS
SELECT 
    COALESCE(SUM(g.montant_engage_fcfa), 0) as total_engagements,
    COALESCE(SUM(g.montant_liquide_fcfa), 0) as total_liquidations,
    CASE 
        WHEN SUM(g.montant_engage_fcfa) > 0 
        THEN ROUND((SUM(g.montant_liquide_fcfa)::DECIMAL / SUM(g.montant_engage_fcfa)) * 100, 2)
        ELSE 0 
    END as taux_execution_global
FROM gife g;

-- Vue: Stocks en alerte
CREATE OR REPLACE VIEW v_stocks_alerte AS
SELECT 
    article_id,
    code_article,
    designation,
    categorie,
    stock_actuel,
    stock_minimum,
    stock_alerte,
    localisation,
    CASE 
        WHEN stock_actuel <= stock_minimum THEN 'Critique'
        WHEN stock_actuel <= stock_alerte THEN 'Alerte'
        ELSE 'Normal'
    END as niveau_stock
FROM stocks
WHERE stock_actuel <= stock_alerte
ORDER BY stock_actuel ASC;

-- Vue: Équipements nécessitant attention
CREATE OR REPLACE VIEW v_equipements_attention AS
SELECT 
    equipement_id,
    designation,
    categorie,
    marque,
    etat,
    statut,
    date_prochaine_visite_technique,
    assurance_expiration,
    CASE 
        WHEN date_prochaine_visite_technique <= CURRENT_DATE + INTERVAL '30 days' THEN 'Visite technique urgente'
        WHEN assurance_expiration <= CURRENT_DATE + INTERVAL '30 days' THEN 'Assurance à renouveler'
        WHEN statut = 'En maintenance' THEN 'En maintenance'
        ELSE 'RAS'
    END as alerte_type
FROM equipements
WHERE 
    date_prochaine_visite_technique <= CURRENT_DATE + INTERVAL '30 days'
    OR assurance_expiration <= CURRENT_DATE + INTERVAL '30 days'
    OR statut = 'En maintenance';

-- Vue: Résumé par source de financement
CREATE OR REPLACE VIEW v_resume_financement AS
SELECT 
    source_financement,
    COUNT(*) as nombre_projets,
    SUM(montant_ttc_fcfa) as montant_total,
    AVG(montant_ttc_fcfa) as montant_moyen,
    COUNT(*) FILTER (WHERE statut = 'En cours') as en_cours,
    COUNT(*) FILTER (WHERE statut = 'Achevé') as acheves
FROM projets
GROUP BY source_financement
ORDER BY montant_total DESC;

-- Vue: Incidents ouverts par gravité
CREATE OR REPLACE VIEW v_incidents_ouverts AS
SELECT 
    gravite,
    COUNT(*) as nombre,
    SUM(impact_financier_fcfa) as impact_total,
    SUM(impact_delai_jours) as delai_total
FROM incidents
WHERE statut != 'Résolu'
GROUP BY gravite
ORDER BY 
    CASE gravite 
        WHEN 'Très grave' THEN 1 
        WHEN 'Grave' THEN 2 
        WHEN 'Moyenne' THEN 3 
        WHEN 'Mineure' THEN 4 
    END;

-- ============================================
-- FONCTIONS - Utilitaires
-- ============================================

-- Fonction: Générer des alertes automatiques
CREATE OR REPLACE FUNCTION generer_alertes()
RETURNS void AS $$
BEGIN
    -- Alertes stock
    INSERT INTO alertes (type, priorite, titre, description, entite_id, entite_type)
    SELECT 
        'stock',
        CASE WHEN stock_actuel <= stock_minimum THEN 'haute' ELSE 'moyenne' END,
        'Stock faible: ' || designation,
        'Stock actuel: ' || stock_actuel || ' ' || unite || ' (seuil: ' || stock_alerte || ')',
        article_id,
        'stock'
    FROM stocks
    WHERE stock_actuel <= stock_alerte
    AND article_id NOT IN (
        SELECT entite_id FROM alertes 
        WHERE type = 'stock' AND statut = 'active'
    );

    -- Alertes équipements (visite technique)
    INSERT INTO alertes (type, priorite, titre, description, entite_id, entite_type)
    SELECT 
        'equipement',
        CASE WHEN date_prochaine_visite_technique <= CURRENT_DATE THEN 'haute' ELSE 'moyenne' END,
        'Visite technique: ' || designation,
        'Date prévue: ' || date_prochaine_visite_technique,
        equipement_id,
        'equipement'
    FROM equipements
    WHERE date_prochaine_visite_technique <= CURRENT_DATE + INTERVAL '30 days'
    AND equipement_id NOT IN (
        SELECT entite_id FROM alertes 
        WHERE type = 'equipement' AND statut = 'active'
    );

    -- Alertes assurances
    INSERT INTO alertes (type, priorite, titre, description, entite_id, entite_type)
    SELECT 
        'assurance',
        CASE WHEN date_echeance <= CURRENT_DATE THEN 'haute' ELSE 'moyenne' END,
        'Renouvellement: ' || type_assurance,
        'Échéance: ' || date_echeance || ' - Compagnie: ' || compagnie,
        assurance_id,
        'assurance'
    FROM assurances
    WHERE date_echeance <= CURRENT_DATE + INTERVAL '60 days'
    AND statut = 'Actif'
    AND assurance_id NOT IN (
        SELECT entite_id FROM alertes 
        WHERE type = 'assurance' AND statut = 'active'
    );
END;
$$ LANGUAGE plpgsql;

-- Fonction: Recherche globale
CREATE OR REPLACE FUNCTION recherche_globale(terme TEXT)
RETURNS TABLE (
    type_entite VARCHAR,
    id VARCHAR,
    titre VARCHAR,
    description TEXT,
    montant BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'projet'::VARCHAR, projet_id, nom_projet::VARCHAR, acronyme::TEXT, montant_ttc_fcfa
    FROM projets
    WHERE nom_projet ILIKE '%' || terme || '%'
       OR acronyme ILIKE '%' || terme || '%'
    UNION ALL
    SELECT 'stock'::VARCHAR, article_id, designation::VARCHAR, categorie::TEXT, valeur_stock_fcfa
    FROM stocks
    WHERE designation ILIKE '%' || terme || '%'
       OR code_article ILIKE '%' || terme || '%'
    UNION ALL
    SELECT 'equipement'::VARCHAR, equipement_id, designation::VARCHAR, marque::TEXT, valeur_actuelle_fcfa
    FROM equipements
    WHERE designation ILIKE '%' || terme || '%'
       OR immatriculation ILIKE '%' || terme || '%'
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger à toutes les tables
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name NOT IN ('alertes', 'historique_chat')
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at();
        ', t, t, t, t);
    END LOOP;
END;
$$;

-- ============================================
-- POLITIQUES RLS (Row Level Security)
-- ============================================

-- Activer RLS sur les tables sensibles
ALTER TABLE alertes ENABLE ROW LEVEL SECURITY;
ALTER TABLE historique_chat ENABLE ROW LEVEL SECURITY;

-- Politique par défaut pour alertes (lecture pour tous les utilisateurs authentifiés)
CREATE POLICY "Alertes visibles par utilisateurs authentifiés" ON alertes
    FOR SELECT USING (true);

-- Politique pour historique_chat (chacun voit ses conversations)
CREATE POLICY "Chat visible par session" ON historique_chat
    FOR ALL USING (true);

-- ============================================
-- COMMENTAIRES DE DOCUMENTATION
-- ============================================
COMMENT ON TABLE projets IS 'Table principale des projets d''infrastructure (AEP, routes, etc.)';
COMMENT ON TABLE marches IS 'Contrats et marchés liés aux projets (GESMA)';
COMMENT ON TABLE gife IS 'Engagements budgétaires et dépenses (GIFE)';
COMMENT ON TABLE stocks IS 'Inventaire des articles et stocks (GIS)';
COMMENT ON TABLE equipements IS 'Parc automobile et équipements (GIFL)';
COMMENT ON TABLE ordres_mission IS 'Ordres de mission du personnel (GIOM)';
COMMENT ON TABLE bons_commande IS 'Bons de commande fournisseurs (GIC)';
COMMENT ON TABLE incidents IS 'Incidents, accidents et problèmes (GIH)';
COMMENT ON TABLE assurances IS 'Polices d''assurance (GIASS)';
COMMENT ON TABLE imports IS 'Registres d''importation (IMPORT)';
COMMENT ON TABLE candidatures IS 'Candidatures et recrutement (GIDE)';
COMMENT ON TABLE alertes IS 'Système d''alertes automatiques';
COMMENT ON TABLE historique_chat IS 'Historique des conversations avec l''agent IA';
