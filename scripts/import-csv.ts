/**
 * Script d'import des fichiers CSV vers Supabase
 * Usage: npx tsx scripts/import-csv.ts
 */

// Charger les variables d'environnement depuis .env.local
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { parse } from 'csv-parse/sync'
import * as fs from 'fs'
import * as path from 'path'

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Debug: afficher si les variables sont chargées
console.log('URL Supabase:', SUPABASE_URL ? 'OK (configuré)' : 'NON CONFIGURÉ')
console.log('Service Key:', SUPABASE_SERVICE_KEY ? 'OK (configuré)' : 'NON CONFIGURÉ')

// Chemin vers les fichiers CSV
const CSV_DIR = path.join(__dirname, '../../aquawest_complete_with_n8n/aquawest_data')

// Mapping des fichiers CSV vers les tables
const CSV_MAPPINGS = [
  {
    file: '01_PROJETS.csv',
    table: 'projets',
    transform: (row: Record<string, string>) => ({
      projet_id: row.projet_id,
      nom_projet: row.nom_projet,
      acronyme: row.acronyme,
      type_projet: row.type_projet,
      pays: row.pays,
      region: row.region,
      province: row.province,
      commune: row.commune,
      ville_village: row.ville_village,
      autorite_contractante: row.autorite_contractante,
      proprietaire_marche: row.proprietaire_marche,
      source_financement: row.source_financement,
      montant_ht_fcfa: parseInt(row.montant_ht_fcfa) || 0,
      tva_fcfa: parseInt(row.tva_fcfa) || 0,
      montant_ttc_fcfa: parseInt(row.montant_ttc_fcfa) || 0,
      date_os: row.date_os || null,
      duree_prevue_mois: parseInt(row.duree_prevue_mois) || null,
      date_reception_provisoire: row.date_reception_provisoire || null,
      date_reception_definitive: row.date_reception_definitive || null,
      statut: row.statut,
      niveau_performance: row.niveau_performance,
    }),
  },
  {
    file: '03_GESMA.csv',
    table: 'marches',
    transform: (row: Record<string, string>) => ({
      marche_id: row.marche_id,
      projet_id: row.projet_id,
      numero_marche: row.numero_marche,
      intitule: row.intitule,
      montant_ht_fcfa: parseInt(row.montant_ht_fcfa) || 0,
      tva_fcfa: parseInt(row.tva_fcfa) || 0,
      montant_ttc_fcfa: parseInt(row.montant_ttc_fcfa) || 0,
      date_signature: row.date_signature || null,
      duree_mois: parseInt(row.duree_mois) || null,
      autorite_contractante: row.autorite_contractante,
      source_financement: row.source_financement,
      nombre_tranches: parseInt(row.nombre_tranches) || 1,
      statut_paiement: row.statut_paiement,
      taux_execution: parseFloat(row.taux_execution) || 0,
    }),
  },
  {
    file: '04_GIFE.csv',
    table: 'gife',
    transform: (row: Record<string, string>) => ({
      gife_id: row.gife_id,
      projet_id: row.projet_id,
      numero_gife: row.numero_gife,
      date_emission: row.date_emission || null,
      objet: row.objet,
      type_depense: row.type_depense,
      montant_engage_fcfa: parseInt(row.montant_engage_fcfa) || 0,
      montant_liquide_fcfa: parseInt(row.montant_liquide_fcfa) || 0,
      date_limite_utilisation: row.date_limite_utilisation || null,
      beneficiaire: row.beneficiaire,
      statut: row.statut,
      service_emetteur: row.service_emetteur,
      validateur: row.validateur,
    }),
  },
  {
    file: '05_GIS_Inventaire.csv',
    table: 'stocks',
    transform: (row: Record<string, string>) => ({
      article_id: row.article_id,
      code_article: row.code_article,
      designation: row.designation,
      categorie: row.categorie,
      unite: row.unite,
      stock_actuel: parseInt(row.stock_actuel) || 0,
      stock_minimum: parseInt(row.stock_minimum) || 0,
      stock_alerte: parseInt(row.stock_alerte) || 0,
      prix_unitaire_moyen_fcfa: parseInt(row.prix_unitaire_moyen_fcfa) || 0,
      valeur_stock_fcfa: parseInt(row.valeur_stock_fcfa) || 0,
      localisation: row.localisation,
      fournisseurs_principaux: row.fournisseurs_principaux,
      derniere_entree: row.derniere_entree || null,
      derniere_sortie: row.derniere_sortie || null,
      statut: row.statut,
    }),
  },
  {
    file: '07_GIFL_Parc.csv',
    table: 'equipements',
    transform: (row: Record<string, string>) => ({
      equipement_id: row.equipement_id,
      designation: row.designation,
      categorie: row.categorie,
      marque: row.marque,
      numero_serie: row.numero_serie,
      immatriculation: row.immatriculation || null,
      annee_acquisition: parseInt(row.annee_acquisition) || null,
      date_acquisition: row.date_acquisition || null,
      valeur_acquisition_fcfa: parseInt(row.valeur_acquisition_fcfa) || 0,
      valeur_actuelle_fcfa: parseInt(row.valeur_actuelle_fcfa) || 0,
      kilometrage_heures: parseInt(row.kilometrage_heures) || 0,
      unite_utilisation: row.unite_utilisation,
      etat: row.etat,
      affectation: row.affectation,
      date_derniere_visite_technique: row.date_derniere_visite_technique || null,
      date_prochaine_visite_technique: row.date_prochaine_visite_technique || null,
      assurance_numero: row.assurance_numero,
      assurance_expiration: row.assurance_expiration || null,
      statut: row.statut,
    }),
  },
  {
    file: '10_GIOM_Missions.csv',
    table: 'ordres_mission',
    transform: (row: Record<string, string>) => ({
      om_id: row.om_id,
      numero_om: row.numero_om,
      employe_id: row.employe_id,
      date_emission: row.date_emission || null,
      date_debut_mission: row.date_debut_mission || null,
      date_fin_mission: row.date_fin_mission || null,
      duree_jours: parseInt(row.duree_jours) || 0,
      destination: row.destination,
      pays: row.pays,
      objet_mission: row.objet_mission,
      frais_transport_fcfa: parseInt(row.frais_transport_fcfa) || 0,
      frais_hebergement_fcfa: parseInt(row.frais_hebergement_fcfa) || 0,
      per_diem_fcfa: parseInt(row.per_diem_fcfa) || 0,
      autres_frais_fcfa: parseInt(row.autres_frais_fcfa) || 0,
      total_frais_fcfa: parseInt(row.total_frais_fcfa) || 0,
      avance_percue_fcfa: parseInt(row.avance_percue_fcfa) || 0,
      moyen_transport: row.moyen_transport,
      statut: row.statut,
      validateur: row.validateur,
    }),
  },
  {
    file: '12_GIC_BonsCommande.csv',
    table: 'bons_commande',
    transform: (row: Record<string, string>) => ({
      bc_id: row.bc_id,
      numero_bc: row.numero_bc,
      date_emission: row.date_emission || null,
      fournisseur: row.fournisseur,
      categorie_achat: row.categorie_achat,
      objet: row.objet,
      montant_ht_fcfa: parseInt(row.montant_ht_fcfa) || 0,
      tva_fcfa: parseInt(row.tva_fcfa) || 0,
      montant_ttc_fcfa: parseInt(row.montant_ttc_fcfa) || 0,
      delai_livraison_jours: parseInt(row.delai_livraison_jours) || 0,
      date_livraison_prevue: row.date_livraison_prevue || null,
      date_livraison_effective: row.date_livraison_effective || null,
      statut_livraison: row.statut_livraison,
      condition_paiement: row.condition_paiement,
      date_echeance_paiement: row.date_echeance_paiement || null,
      date_paiement_effectif: row.date_paiement_effectif || null,
      statut_paiement: row.statut_paiement,
      responsable_achat: row.responsable_achat,
      observations: row.observations || null,
    }),
  },
  {
    file: '13_GIH_Incidents.csv',
    table: 'incidents',
    transform: (row: Record<string, string>) => ({
      incident_id: row.incident_id,
      numero_incident: row.numero_incident,
      date_incident: row.date_incident || null,
      type_incident: row.type_incident,
      categorie: row.categorie,
      gravite: row.gravite,
      lieu: row.lieu,
      description: row.description,
      cause_identifiee: row.cause_identifiee,
      impact_financier_fcfa: parseInt(row.impact_financier_fcfa) || 0,
      impact_delai_jours: parseInt(row.impact_delai_jours) || 0,
      personnes_impliquees: row.personnes_impliquees || null,
      declarant: row.declarant,
      actions_immediates: row.actions_immediates,
      date_resolution: row.date_resolution || null,
      statut: row.statut,
      cout_resolution_fcfa: parseInt(row.cout_resolution_fcfa) || 0,
      assurance_sollicitee: row.assurance_sollicitee === 'Oui',
    }),
  },
  {
    file: '14_GIASS_Assurances.csv',
    table: 'assurances',
    transform: (row: Record<string, string>) => ({
      assurance_id: row.assurance_id,
      numero_police: row.numero_police,
      type_assurance: row.type_assurance,
      categorie: row.categorie,
      compagnie: row.compagnie,
      date_effet: row.date_effet || null,
      date_echeance: row.date_echeance || null,
      prime_annuelle_fcfa: parseInt(row.prime_annuelle_fcfa) || 0,
      capital_assure_fcfa: parseInt(row.capital_assure_fcfa) || 0,
      franchise_fcfa: parseInt(row.franchise_fcfa) || 0,
      nombre_sinistres: parseInt(row.nombre_sinistres) || 0,
      montant_sinistres_fcfa: parseInt(row.montant_sinistres_fcfa) || 0,
      montant_indemnise_fcfa: parseInt(row.montant_indemnise_fcfa) || 0,
      statut: row.statut,
      gestionnaire: row.gestionnaire,
    }),
  },
  {
    file: '15_IMPORT_Registres.csv',
    table: 'imports',
    transform: (row: Record<string, string>) => ({
      import_id: row.import_id,
      numero_import: row.numero_import,
      date_commande: row.date_commande || null,
      fournisseur: row.fournisseur,
      pays_origine: row.pays_origine,
      categorie_produit: row.categorie_produit,
      description: row.description,
      montant_fob_fcfa: parseInt(row.montant_fob_fcfa) || 0,
      frais_transport_fcfa: parseInt(row.frais_transport_fcfa) || 0,
      frais_assurance_fcfa: parseInt(row.frais_assurance_fcfa) || 0,
      droits_douane_fcfa: parseInt(row.droits_douane_fcfa) || 0,
      taxes_diverses_fcfa: parseInt(row.taxes_diverses_fcfa) || 0,
      tva_import_fcfa: parseInt(row.tva_import_fcfa) || 0,
      cout_total_fcfa: parseInt(row.cout_total_fcfa) || 0,
      incoterm: row.incoterm,
      mode_transport: row.mode_transport,
      port_arrivee: row.port_arrivee,
      numero_bl: row.numero_bl,
      date_arrivee_prevue: row.date_arrivee_prevue || null,
      date_arrivee_effective: row.date_arrivee_effective || null,
      date_dedouanement: row.date_dedouanement || null,
      numero_declaration_douane: row.numero_declaration_douane,
      transitaire: row.transitaire,
      statut: row.statut,
    }),
  },
  {
    file: '16_GIDE_Candidatures.csv',
    table: 'candidatures',
    transform: (row: Record<string, string>) => ({
      candidature_id: row.candidature_id,
      numero_candidature: row.numero_candidature,
      date_reception: row.date_reception || null,
      nom: row.nom,
      prenom: row.prenom,
      date_naissance: row.date_naissance || null,
      sexe: row.sexe,
      telephone: row.telephone,
      email: row.email,
      ville_residence: row.ville_residence,
      poste_vise: row.poste_vise,
      niveau_etudes: row.niveau_etudes,
      annees_experience: parseInt(row.annees_experience) || 0,
      pretentions_salariales_fcfa: parseInt(row.pretentions_salariales_fcfa) || 0,
      disponibilite: row.disponibilite,
      source: row.source,
      date_traitement: row.date_traitement || null,
      statut: row.statut,
      decision: row.decision,
      evaluateur: row.evaluateur,
    }),
  },
]

async function importCSV() {
  console.log('='.repeat(60))
  console.log('IMPORT CSV vers SUPABASE - ASI-BF SGI')
  console.log('='.repeat(60))

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Erreur: Variables d\'environnement Supabase non configurées')
    console.error('Veuillez définir NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  for (const mapping of CSV_MAPPINGS) {
    const filePath = path.join(CSV_DIR, mapping.file)
    
    if (!fs.existsSync(filePath)) {
      console.log(`[SKIP] Fichier non trouvé: ${mapping.file}`)
      continue
    }

    console.log(`\n[IMPORT] ${mapping.file} -> ${mapping.table}`)

    try {
      // Lire et parser le CSV
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      // Supprimer le BOM si présent
      const cleanContent = fileContent.replace(/^\uFEFF/, '')
      
      const records = parse(cleanContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })

      console.log(`  - ${records.length} enregistrements trouvés`)

      // Transformer les données
      const transformedData = records.map(mapping.transform)

      // Supprimer les données existantes
      const { error: deleteError } = await supabase
        .from(mapping.table)
        .delete()
        .gte('created_at', '1900-01-01')

      if (deleteError) {
        console.log(`  - Avertissement suppression: ${deleteError.message}`)
      }

      // Insérer par lots de 100
      const batchSize = 100
      let inserted = 0

      for (let i = 0; i < transformedData.length; i += batchSize) {
        const batch = transformedData.slice(i, i + batchSize)
        
        const { error } = await supabase
          .from(mapping.table)
          .insert(batch)

        if (error) {
          console.error(`  - Erreur insertion lot ${i}: ${error.message}`)
        } else {
          inserted += batch.length
        }
      }

      console.log(`  - ${inserted} enregistrements importés avec succès`)

    } catch (error) {
      console.error(`  - Erreur: ${error}`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('IMPORT TERMINÉ')
  console.log('='.repeat(60))

  // Générer les alertes automatiques
  console.log('\nGénération des alertes automatiques...')
  const { error: alertError } = await supabase.rpc('generer_alertes')
  if (alertError) {
    console.log('Avertissement alertes:', alertError.message)
  } else {
    console.log('Alertes générées avec succès')
  }
}

// Exécuter l'import
importCSV().catch(console.error)
