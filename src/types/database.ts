// Types générés pour la base de données ASI-BF SGI

export interface Projet {
  projet_id: string
  nom_projet: string
  acronyme: string
  type_projet: string
  pays: string
  region: string
  province: string
  commune: string
  ville_village: string
  autorite_contractante: string
  proprietaire_marche: string
  source_financement: string
  montant_ht_fcfa: number
  tva_fcfa: number
  montant_ttc_fcfa: number
  date_os: string
  duree_prevue_mois: number
  date_reception_provisoire: string | null
  date_reception_definitive: string | null
  statut: 'En cours' | 'Achevé' | 'Suspendu' | 'Annulé'
  niveau_performance: 'Très bon' | 'Bon' | 'Moyen' | 'Faible'
  created_at?: string
  updated_at?: string
}

export interface Marche {
  marche_id: string
  projet_id: string
  numero_marche: string
  intitule: string
  montant_ht_fcfa: number
  tva_fcfa: number
  montant_ttc_fcfa: number
  date_signature: string
  duree_mois: number
  autorite_contractante: string
  source_financement: string
  nombre_tranches: number
  statut_paiement: 'Soldé' | 'En cours' | 'En attente'
  taux_execution: number
  created_at?: string
  updated_at?: string
}

export interface GIFE {
  gife_id: string
  projet_id: string
  numero_gife: string
  date_emission: string
  objet: string
  type_depense: string
  montant_engage_fcfa: number
  montant_liquide_fcfa: number
  date_limite_utilisation: string
  beneficiaire: string
  statut: 'Soldé' | 'Partiellement liquidé' | 'En cours'
  service_emetteur: string
  validateur: string
  created_at?: string
  updated_at?: string
}

export interface ArticleStock {
  article_id: string
  code_article: string
  designation: string
  categorie: string
  unite: string
  stock_actuel: number
  stock_minimum: number
  stock_alerte: number
  prix_unitaire_moyen_fcfa: number
  valeur_stock_fcfa: number
  localisation: string
  fournisseurs_principaux: string
  derniere_entree: string
  derniere_sortie: string
  statut: 'Actif' | 'Inactif'
  created_at?: string
  updated_at?: string
}

export interface Equipement {
  equipement_id: string
  designation: string
  categorie: string
  marque: string
  numero_serie: string
  immatriculation: string | null
  annee_acquisition: number
  date_acquisition: string
  valeur_acquisition_fcfa: number
  valeur_actuelle_fcfa: number
  kilometrage_heures: number
  unite_utilisation: 'km' | 'heures'
  etat: 'Bon' | 'Moyen' | 'Nécessite réparation'
  affectation: string
  date_derniere_visite_technique: string
  date_prochaine_visite_technique: string
  assurance_numero: string
  assurance_expiration: string
  statut: 'En service' | 'En maintenance' | 'Hors service'
  created_at?: string
  updated_at?: string
}

export interface OrdreMission {
  om_id: string
  numero_om: string
  employe_id: string
  date_emission: string
  date_debut_mission: string
  date_fin_mission: string
  duree_jours: number
  destination: string
  pays: string
  objet_mission: string
  frais_transport_fcfa: number
  frais_hebergement_fcfa: number
  per_diem_fcfa: number
  autres_frais_fcfa: number
  total_frais_fcfa: number
  avance_percue_fcfa: number
  moyen_transport: string
  statut: 'En cours' | 'Clôturé' | 'Annulé'
  validateur: string
  created_at?: string
  updated_at?: string
}

export interface BonCommande {
  bc_id: string
  numero_bc: string
  date_emission: string
  fournisseur: string
  categorie_achat: string
  objet: string
  montant_ht_fcfa: number
  tva_fcfa: number
  montant_ttc_fcfa: number
  delai_livraison_jours: number
  date_livraison_prevue: string
  date_livraison_effective: string | null
  statut_livraison: 'En attente' | 'Livré' | 'Partiel'
  condition_paiement: string
  date_echeance_paiement: string
  date_paiement_effectif: string | null
  statut_paiement: 'Payé' | 'En attente' | 'En retard'
  responsable_achat: string
  observations: string | null
  created_at?: string
  updated_at?: string
}

export interface Incident {
  incident_id: string
  numero_incident: string
  date_incident: string
  type_incident: string
  categorie: string
  gravite: 'Mineure' | 'Moyenne' | 'Grave' | 'Très grave'
  lieu: string
  description: string
  cause_identifiee: string
  impact_financier_fcfa: number
  impact_delai_jours: number
  personnes_impliquees: string | null
  declarant: string
  actions_immediates: string
  date_resolution: string | null
  statut: 'Ouvert' | 'En cours' | 'Résolu'
  cout_resolution_fcfa: number
  assurance_sollicitee: boolean
  created_at?: string
  updated_at?: string
}

export interface Assurance {
  assurance_id: string
  numero_police: string
  type_assurance: string
  categorie: string
  compagnie: string
  date_effet: string
  date_echeance: string
  prime_annuelle_fcfa: number
  capital_assure_fcfa: number
  franchise_fcfa: number
  nombre_sinistres: number
  montant_sinistres_fcfa: number
  montant_indemnise_fcfa: number
  statut: 'Actif' | 'Expiré' | 'Renouvelé'
  gestionnaire: string
  created_at?: string
  updated_at?: string
}

export interface ImportRegistre {
  import_id: string
  numero_import: string
  date_commande: string
  fournisseur: string
  pays_origine: string
  categorie_produit: string
  description: string
  montant_fob_fcfa: number
  frais_transport_fcfa: number
  frais_assurance_fcfa: number
  droits_douane_fcfa: number
  taxes_diverses_fcfa: number
  tva_import_fcfa: number
  cout_total_fcfa: number
  incoterm: string
  mode_transport: string
  port_arrivee: string
  numero_bl: string
  date_arrivee_prevue: string
  date_arrivee_effective: string | null
  date_dedouanement: string | null
  numero_declaration_douane: string
  transitaire: string
  statut: 'En transit' | 'Arrivé' | 'Dédouané'
  created_at?: string
  updated_at?: string
}

export interface Candidature {
  candidature_id: string
  numero_candidature: string
  date_reception: string
  nom: string
  prenom: string
  date_naissance: string
  sexe: 'M' | 'F'
  telephone: string
  email: string
  ville_residence: string
  poste_vise: string
  niveau_etudes: string
  annees_experience: number
  pretentions_salariales_fcfa: number
  disponibilite: string
  source: string
  date_traitement: string | null
  statut: string
  decision: 'Embauche' | 'Shortlist' | 'Rejet' | 'En attente'
  evaluateur: string
  created_at?: string
  updated_at?: string
}

// Types pour les statistiques du dashboard
export interface DashboardStats {
  projets: {
    total: number
    en_cours: number
    acheves: number
    montant_total: number
  }
  finances: {
    engagements_total: number
    liquidations_total: number
    taux_execution: number
  }
  stocks: {
    valeur_totale: number
    articles_alerte: number
  }
  equipements: {
    total: number
    en_service: number
    en_maintenance: number
  }
  incidents: {
    total: number
    ouverts: number
    impact_financier: number
  }
}

// Types pour les alertes
export interface Alerte {
  id: string
  type: 'stock' | 'equipement' | 'assurance' | 'paiement' | 'projet' | 'incident'
  priorite: 'haute' | 'moyenne' | 'basse'
  titre: string
  description: string
  entite_id: string
  entite_type: string
  date_creation: string
  statut: 'active' | 'traitee' | 'ignoree'
}

// Types pour l'agent IA
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: string
}

export interface QueryResult {
  data: unknown[]
  summary: string
  sql_query?: string
}
