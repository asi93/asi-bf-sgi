import { z } from 'zod'
import { createServerClient } from '@/lib/supabase'

/**
 * Définition des schémas d'outils pour OpenAI
 */

// 1. Stocks
export const GetStocksSchema = z.object({
    search: z.string().optional().describe("Nom de l'article ou catégorie à rechercher"),
    alert_only: z.boolean().optional().describe("Si vrai, ne retourne que les articles en stock faible")
})

// 2. Incidents
export const GetIncidentsSchema = z.object({
    status: z.enum(['ouvert', 'résolu', 'clos', 'tous']).optional().default('ouvert'),
    project_id: z.string().optional().describe("Filtrer par ID de projet"),
    search: z.string().optional().describe("Recherche dans description, lieu, type")
})

// 3. Projets
export const GetProjectsSchema = z.object({
    status: z.string().optional().describe("Filtrer par statut (ex: 'En cours')"),
    country: z.string().optional().describe("Filtrer par pays"),
    search: z.string().optional().describe("Recherche par nom ou ID de projet")
})

// 4. Finances
export const GetFinancesSchema = z.object({
    project_id: z.string().optional().describe("ID du projet pour le budget"),
    type: z.enum(['dépenses', 'recettes', 'global']).optional().default('global')
})

// 5. Missions
export const GetMissionsSchema = z.object({
    status: z.string().optional().describe("Statut de la mission"),
    person: z.string().optional().describe("Nom de la personne en mission"),
    search: z.string().optional().describe("Recherche dans objet, destination, pays")
})

// 6. RH (Candidatures)
export const GetHRSchema = z.object({
    poste: z.string().optional().describe("Poste visé"),
    decision: z.string().optional().describe("Filtrer par décision (ex: 'Retenu')")
})

// 7. Action: Créer Incident
export const CreateIncidentSchema = z.object({
    type: z.string().describe("Type d'incident (ex: 'Panne', 'Accident', 'Logistique')"),
    description: z.string().describe("Description détaillée du problème"),
    location: z.string().describe("Lieu précis de l'incident"),
    severity: z.enum(['Mineure', 'Majeure', 'Critique']).optional().default('Majeure')
})

// ========== PHASE B: NOUVEAUX OUTILS ==========

// 8. Finances Détaillées Projet
export const GetProjectFinancesDetailedSchema = z.object({
    project_id: z.string().describe("ID du projet (obligatoire)")
})

// 9. Marchés/Contrats
export const GetMarketContractsSchema = z.object({
    project_id: z.string().optional().describe("Filtrer par projet"),
    status: z.string().optional().describe("Statut du marché")
})

// 10. Dépenses GIFE
export const GetGifeExpensesSchema = z.object({
    project_id: z.string().optional().describe("Filtrer par projet"),
    type: z.string().optional().describe("Type de dépense"),
    date_from: z.string().optional().describe("Date début (YYYY-MM-DD)"),
    date_to: z.string().optional().describe("Date fin (YYYY-MM-DD)")
})

// 11. Vue d'Ensemble Projet
export const GetProjectOverviewSchema = z.object({
    project_id: z.string().describe("ID du projet (obligatoire)")
})

// 12. Statistiques Globales
export const GetGlobalStatsSchema = z.object({})

// 13. Équipements
export const GetEquipmentsSchema = z.object({
    category: z.string().optional().describe("Catégorie (véhicule, engin, etc.)"),
    status: z.string().optional().describe("Statut (actif, en panne, etc.)"),
    search: z.string().optional().describe("Recherche par immatriculation ou désignation")
})

// 14. Bons de Commande
export const GetPurchaseOrdersSchema = z.object({
    supplier: z.string().optional().describe("Nom du fournisseur"),
    status: z.string().optional().describe("Statut de la commande"),
    category: z.string().optional().describe("Catégorie de produit"),
    search: z.string().optional().describe("Recherche dans objet, numéro BC")
})

// 15. Imports
export const GetImportsSchema = z.object({
    status: z.string().optional().describe("Statut de l'importation"),
    country: z.string().optional().describe("Pays d'origine")
})

// 16. Assurances
export const GetInsurancesSchema = z.object({
    type: z.string().optional().describe("Type d'assurance"),
    expiring_soon: z.boolean().optional().describe("Uniquement les assurances expirant dans 30 jours")
})

// 17. Signalements (Top 20)
export const GetSignalementsSchema = z.object({
    project_id: z.string().optional().describe("Filtrer par projet"),
    status: z.string().optional().describe("Statut du signalement"),
    overdue: z.boolean().optional().describe("Uniquement les signalements en retard")
})

// 18. Action: Créer Signalement
export const CreateSignalementSchema = z.object({
    item: z.string().describe("Élément concerné"),
    problem: z.string().describe("Problème identifié"),
    action: z.string().describe("Action à entreprendre"),
    deadline: z.string().describe("Date limite (YYYY-MM-DD)"),
    project_id: z.string().optional().describe("ID du projet associé")
})

/**
 * Implémentation des fonctions d'outils
 */

export const tools = {
    get_stocks: async (args: z.infer<typeof GetStocksSchema>) => {
        const supabase = createServerClient()
        let query = supabase.from('stocks').select('*')

        if (args.search) query = query.ilike('designation', `%${args.search}%`)
        if (args.alert_only) query = query.lte('stock_actuel', 'stock_alerte')

        const { data, error } = await query.limit(20)
        if (error) throw error
        return data
    },

    get_incidents: async (args: z.infer<typeof GetIncidentsSchema>) => {
        const supabase = createServerClient()
        let query = supabase.from('incidents').select('*')

        if (args.status && args.status !== 'tous') {
            const statusMap = { 'ouvert': 'ouvert', 'résolu': 'en_cours', 'clos': 'Clos' }
            query = query.eq('statut', statusMap[args.status as keyof typeof statusMap] || 'ouvert')
        }
        if (args.project_id) query = query.eq('projet_id', args.project_id)
        if (args.search) {
            query = query.or(`numero_incident.ilike.%${args.search}%,type_incident.ilike.%${args.search}%,categorie.ilike.%${args.search}%,lieu.ilike.%${args.search}%,description.ilike.%${args.search}%,cause_identifiee.ilike.%${args.search}%`)
        }

        const { data, error } = await query.order('date_incident', { ascending: false }).limit(15)
        if (error) throw error
        return data
    },

    get_projects: async (args: z.infer<typeof GetProjectsSchema>) => {
        const supabase = createServerClient()
        let query = supabase.from('projets').select('*')

        if (args.search) {
            // Recherche élargie : Nom, ID, Acronyme, Ville, Pays, Chef de projet
            query = query.or(`nom_projet.ilike.%${args.search}%,projet_id.eq.${args.search},acronyme.ilike.%${args.search}%,ville_village.ilike.%${args.search}%,pays.ilike.%${args.search}%`)
        } else {
            if (args.status && args.status.toLowerCase() !== 'tous') query = query.eq('statut', args.status)
            if (args.country) query = query.eq('pays', args.country)
        }

        const { data, error } = await query.limit(10)
        if (error) throw error
        return data
    },

    get_finances: async (args: z.infer<typeof GetFinancesSchema>) => {
        const supabase = createServerClient()

        if (args.project_id) {
            // Financier spécifique au projet
            const { data: project } = await supabase.from('projets').select('montant_ht_fcfa, nom_projet').eq('projet_id', args.project_id).single()
            const { data: depenses } = await supabase.from('gife').select('montant_liquide_fcfa').eq('projet_id', args.project_id)

            const totalDepenses = depenses?.reduce((sum, d) => sum + (Number(d.montant_liquide_fcfa) || 0), 0) || 0
            const CA = Number(project?.montant_ht_fcfa) || 0

            return {
                project_name: project?.nom_projet,
                chiffre_affaire: CA,
                total_depenses: totalDepenses,
                marge: CA - totalDepenses,
                taux_consommation: CA > 0 ? (totalDepenses / CA) * 100 : 0
            }
        }

        // Global (résumé simplifié)
        const { data: allDepenses } = await supabase.from('gife').select('montant_liquide_fcfa')
        const { data: allCA } = await supabase.from('projets').select('montant_ht_fcfa')

        const totalDepenses = allDepenses?.reduce((sum, d) => sum + (Number(d.montant_liquide_fcfa) || 0), 0) || 0
        const totalCA = allCA?.reduce((sum, p) => sum + (Number(p.montant_ht_fcfa) || 0), 0) || 0

        return {
            global: true,
            total_ca: totalCA,
            total_depenses: totalDepenses,
            marge_globale: totalCA - totalDepenses
        }
    },

    get_missions: async (args: z.infer<typeof GetMissionsSchema>) => {
        const supabase = createServerClient()
        let query = supabase.from('ordres_mission').select('*')
        if (args.status) query = query.eq('statut', args.status)
        if (args.person) query = query.ilike('nom_missionnaire', `%${args.person}%`)
        if (args.search) {
            query = query.or(`numero_om.ilike.%${args.search}%,destination.ilike.%${args.search}%,pays.ilike.%${args.search}%,objet_mission.ilike.%${args.search}%,moyen_transport.ilike.%${args.search}%`)
        }
        const { data, error } = await query.limit(10)
        if (error) throw error
        return data
    },

    get_hr_candidatures: async (args: z.infer<typeof GetHRSchema>) => {
        const supabase = createServerClient()
        let query = supabase.from('rh_candidatures').select('*')
        if (args.poste) query = query.ilike('poste_vise', `%${args.poste}%`)
        if (args.decision) query = query.eq('decision', args.decision)
        const { data, error } = await query.limit(10)
        if (error) throw error
        return data
    },

    create_incident: async (args: z.infer<typeof CreateIncidentSchema>, phoneNumber: string) => {
        const supabase = createServerClient()
        const { data, error } = await supabase.from('incidents').insert({
            type_incident: args.type,
            description: args.description,
            localisation: args.location,
            gravite: args.severity,
            statut: 'ouvert',
            date_incident: new Date().toISOString(),
            signale_par: phoneNumber
        }).select().single()

        if (error) throw error
        return { success: true, incident_id: data.numero_incident || data.id, message: "Incident créé avec succès" }
    },

    // ========== PHASE B: IMPLÉMENTATIONS ==========

    get_project_finances_detailed: async (args: z.infer<typeof GetProjectFinancesDetailedSchema>) => {
        const supabase = createServerClient()

        // 1. Infos projet
        const { data: project } = await supabase
            .from('projets')
            .select('projet_id, nom_projet, montant_ht_fcfa, statut')
            .eq('projet_id', args.project_id)
            .single()

        if (!project) throw new Error('Projet introuvable')

        // 2. Dépenses GIFE
        const { data: gife } = await supabase
            .from('gife')
            .select('montant_liquide_fcfa, type_depense, date_depense')
            .eq('projet_id', args.project_id)

        const totalGife = gife?.reduce((sum, d) => sum + (Number(d.montant_liquide_fcfa) || 0), 0) || 0

        // 3. Marchés associés
        const { data: marches } = await supabase
            .from('marches')
            .select('numero_marche, objet, montant, statut')
            .eq('projet_id', args.project_id)

        const totalMarches = marches?.reduce((sum, m) => sum + (Number(m.montant) || 0), 0) || 0

        const CA = Number(project.montant_ht_fcfa) || 0
        const marge = CA - totalGife
        const tauxExecution = CA > 0 ? (totalGife / CA) * 100 : 0

        return {
            project_name: project.nom_projet,
            project_id: project.projet_id,
            status: project.statut,
            chiffre_affaire: CA,
            depenses_gife: totalGife,
            marches_total: totalMarches,
            nombre_marches: marches?.length || 0,
            marge_brute: marge,
            taux_execution: tauxExecution,
            marches_details: marches?.slice(0, 5) // Top 5 marchés
        }
    },

    get_market_contracts: async (args: z.infer<typeof GetMarketContractsSchema>) => {
        const supabase = createServerClient()
        let query = supabase.from('marches').select('*')

        if (args.project_id) query = query.eq('projet_id', args.project_id)
        if (args.status) query = query.eq('statut', args.status)

        const { data, error } = await query.limit(15)
        if (error) throw error
        return data
    },

    get_gife_expenses: async (args: z.infer<typeof GetGifeExpensesSchema>) => {
        const supabase = createServerClient()
        let query = supabase.from('gife').select('*')

        if (args.project_id) query = query.eq('projet_id', args.project_id)
        if (args.type) query = query.eq('type_depense', args.type)
        if (args.date_from) query = query.gte('date_depense', args.date_from)
        if (args.date_to) query = query.lte('date_depense', args.date_to)

        const { data, error } = await query.order('date_depense', { ascending: false }).limit(20)
        if (error) throw error
        return data
    },

    get_project_overview: async (args: z.infer<typeof GetProjectOverviewSchema>) => {
        const supabase = createServerClient()

        // 1. Projet
        const { data: project } = await supabase
            .from('projets')
            .select('*')
            .eq('projet_id', args.project_id)
            .single()

        if (!project) throw new Error('Projet introuvable')

        // 2. Finances
        const { data: gife } = await supabase
            .from('gife')
            .select('montant_liquide_fcfa')
            .eq('projet_id', args.project_id)
        const totalDepenses = gife?.reduce((sum, d) => sum + (Number(d.montant_liquide_fcfa) || 0), 0) || 0

        // 3. Incidents ouverts
        const { data: incidents } = await supabase
            .from('incidents')
            .select('numero_incident, type_incident, gravite')
            .eq('projet_id', args.project_id)
            .eq('statut', 'ouvert')

        // 4. Signalements en retard
        const today = new Date().toISOString().split('T')[0]
        const { data: signalements } = await supabase
            .from('signalements')
            .select('id, item, deadline')
            .eq('projet_id', args.project_id)
            .lt('deadline', today)
            .neq('statut', 'Terminé')

        const CA = Number(project.montant_ht_fcfa) || 0

        return {
            project: {
                id: project.projet_id,
                name: project.nom_projet,
                status: project.statut,
                location: `${project.ville_village}, ${project.pays}`
            },
            finances: {
                ca: CA,
                depenses: totalDepenses,
                marge: CA - totalDepenses,
                taux_execution: CA > 0 ? (totalDepenses / CA) * 100 : 0
            },
            incidents_ouverts: incidents?.length || 0,
            signalements_retard: signalements?.length || 0,
            top_incidents: incidents?.slice(0, 3),
            top_signalements: signalements?.slice(0, 3)
        }
    },

    get_global_stats: async () => {
        const supabase = createServerClient()

        // 1. Projets par statut
        const { data: projets } = await supabase.from('projets').select('statut, montant_ht_fcfa')
        const projetStats = projets?.reduce((acc, p) => {
            acc[p.statut] = (acc[p.statut] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        // 2. Finances globales
        const totalCA = projets?.reduce((sum, p) => sum + (Number(p.montant_ht_fcfa) || 0), 0) || 0
        const { data: gife } = await supabase.from('gife').select('montant_liquide_fcfa')
        const totalDepenses = gife?.reduce((sum, d) => sum + (Number(d.montant_liquide_fcfa) || 0), 0) || 0

        // 3. Stocks en alerte
        const { data: stocks } = await supabase.from('stocks').select('stock_id').lte('stock_actuel', 'stock_alerte')

        // 4. Incidents ouverts
        const { data: incidents } = await supabase.from('incidents').select('numero_incident').eq('statut', 'ouvert')

        // 5. Missions en cours
        const { data: missions } = await supabase.from('ordres_mission').select('numero_om').eq('statut', 'En cours')

        return {
            projets: {
                total: projets?.length || 0,
                par_statut: projetStats
            },
            finances: {
                ca_total: totalCA,
                depenses_totales: totalDepenses,
                marge_globale: totalCA - totalDepenses
            },
            alertes: {
                stocks_faibles: stocks?.length || 0,
                incidents_ouverts: incidents?.length || 0,
                missions_actives: missions?.length || 0
            }
        }
    },

    get_equipments: async (args: z.infer<typeof GetEquipmentsSchema>) => {
        const supabase = createServerClient()
        let query = supabase.from('equipements').select('*')

        if (args.category) query = query.eq('categorie', args.category)
        if (args.status) query = query.eq('statut', args.status)
        if (args.search) {
            // Search in multiple fields: immatriculation, designation, categorie, marque, affectation
            query = query.or(`immatriculation.ilike.%${args.search}%,designation.ilike.%${args.search}%,categorie.ilike.%${args.search}%,marque.ilike.%${args.search}%,affectation.ilike.%${args.search}%`)
        }

        const { data, error } = await query.limit(15)
        if (error) throw error
        return data
    },

    get_purchase_orders: async (args: z.infer<typeof GetPurchaseOrdersSchema>) => {
        const supabase = createServerClient()
        let query = supabase.from('bons_commande').select('*')

        if (args.supplier) query = query.ilike('fournisseur', `%${args.supplier}%`)
        if (args.status) query = query.eq('statut', args.status)
        if (args.category) query = query.eq('categorie', args.category)
        if (args.search) {
            query = query.or(`numero_bc.ilike.%${args.search}%,objet.ilike.%${args.search}%,responsable_achat.ilike.%${args.search}%,fournisseur.ilike.%${args.search}%`)
        }

        const { data, error } = await query.limit(15)
        if (error) throw error
        return data
    },

    get_imports: async (args: z.infer<typeof GetImportsSchema>) => {
        const supabase = createServerClient()
        let query = supabase.from('imports').select('*')

        if (args.status) query = query.eq('statut', args.status)
        if (args.country) query = query.eq('pays_origine', args.country)

        const { data, error } = await query.limit(15)
        if (error) throw error
        return data
    },

    get_insurances: async (args: z.infer<typeof GetInsurancesSchema>) => {
        const supabase = createServerClient()
        let query = supabase.from('assurances').select('*')

        if (args.type) query = query.eq('type_assurance', args.type)
        if (args.expiring_soon) {
            const in30Days = new Date()
            in30Days.setDate(in30Days.getDate() + 30)
            query = query.lte('date_echeance', in30Days.toISOString().split('T')[0])
        }

        const { data, error } = await query.limit(15)
        if (error) throw error
        return data
    },

    get_signalements: async (args: z.infer<typeof GetSignalementsSchema>) => {
        const supabase = createServerClient()
        let query = supabase.from('signalements').select('*')

        if (args.project_id) query = query.eq('projet_id', args.project_id)
        if (args.status) query = query.eq('statut', args.status)
        if (args.overdue) {
            const today = new Date().toISOString().split('T')[0]
            query = query.lt('deadline', today).neq('statut', 'Terminé')
        }

        const { data, error } = await query.order('deadline', { ascending: true }).limit(20)
        if (error) throw error
        return data
    },

    create_signalement: async (args: z.infer<typeof CreateSignalementSchema>, phoneNumber: string) => {
        const supabase = createServerClient()
        const { data, error } = await supabase.from('signalements').insert({
            item: args.item,
            problem: args.problem,
            action: args.action,
            deadline: args.deadline,
            projet_id: args.project_id,
            statut: 'En cours',
            created_by: phoneNumber,
            created_at: new Date().toISOString()
        }).select().single()

        if (error) throw error
        return { success: true, signalement_id: data.id, message: "Signalement créé avec succès" }
    }
}

/**
 * Définition des outils au format OpenAI
 */
export const openAITools = [
    {
        type: 'function',
        function: {
            name: 'get_stocks',
            description: "Récupère l'état des stocks, permet de rechercher un article ou de voir les alertes.",
            parameters: {
                type: 'object',
                properties: {
                    search: { type: 'string', description: "Nom de l'article" },
                    alert_only: { type: 'boolean', description: "Uniquement les stocks faibles" }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_incidents',
            description: "Liste les incidents ou les pannes signalées sur les chantiers. Permet de filtrer par projet.",
            parameters: {
                type: 'object',
                properties: {
                    status: { type: 'string', enum: ['ouvert', 'résolu', 'clos', 'tous'] },
                    project_id: { type: 'string', description: "ID du projet" }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_projects',
            description: "Recherche des projets par nom, ID (ex: prj030) ou pays. Utilisez 'search' pour un projet spécifique.",
            parameters: {
                type: 'object',
                properties: {
                    status: { type: 'string', description: "Statut (En cours, Achevé, etc.)" },
                    country: { type: 'string' },
                    search: { type: 'string', description: "Nom, acronyme ou ID du projet" }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_finances',
            description: "Récupère les données financières : Chiffre d'Affaires, dépenses, marge et taux d'exécution. Indispensable pour les questions sur les coûts ou la rentabilité.",
            parameters: {
                type: 'object',
                properties: {
                    project_id: { type: 'string', description: "ID du projet (ex: 'prj030'). Obligatoire pour un projet précis." },
                    type: { type: 'string', enum: ['dépenses', 'recettes', 'global'] }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_missions',
            description: "Liste les ordres de mission et les déplacements du personnel.",
            parameters: {
                type: 'object',
                properties: {
                    status: { type: 'string' },
                    person: { type: 'string' }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_hr_candidatures',
            description: "Accède au recrutement et aux dossiers des candidats.",
            parameters: {
                type: 'object',
                properties: {
                    poste: { type: 'string' },
                    decision: { type: 'string' }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'create_incident',
            description: "Déclare un nouvel incident ou une panne directement sur un chantier.",
            parameters: {
                type: 'object',
                properties: {
                    type: { type: 'string' },
                    description: { type: 'string' },
                    location: { type: 'string' },
                    severity: { type: 'string', enum: ['Mineure', 'Majeure', 'Critique'] }
                },
                required: ['type', 'description', 'location']
            }
        }
    },

    // ========== PHASE B: NOUVEAUX OUTILS ==========

    {
        type: 'function',
        function: {
            name: 'get_project_finances_detailed',
            description: "Analyse financière COMPLÈTE d'un projet : CA, dépenses GIFE, marchés, marge brute, taux d'exécution. OBLIGATOIRE pour toute question financière précise sur un projet.",
            parameters: {
                type: 'object',
                properties: {
                    project_id: { type: 'string', description: "ID du projet (ex: 'prj030')" }
                },
                required: ['project_id']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_market_contracts',
            description: "Liste les marchés et contrats signés.",
            parameters: {
                type: 'object',
                properties: {
                    project_id: { type: 'string', description: "Filtrer par projet" },
                    status: { type: 'string', description: "Statut du marché" }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_gife_expenses',
            description: "Détails des dépenses GIFE (bons de dépenses engagées).",
            parameters: {
                type: 'object',
                properties: {
                    project_id: { type: 'string' },
                    type: { type: 'string', description: "Type de dépense" },
                    date_from: { type: 'string', description: "Date début (YYYY-MM-DD)" },
                    date_to: { type: 'string', description: "Date fin (YYYY-MM-DD)" }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_project_overview',
            description: "Vue d'ensemble COMPLÈTE d'un projet : infos, finances, incidents, signalements. Parfait pour un résumé global.",
            parameters: {
                type: 'object',
                properties: {
                    project_id: { type: 'string', description: "ID du projet" }
                },
                required: ['project_id']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_global_stats',
            description: "Statistiques globales du SGI : nombre de projets, CA total, dépenses, alertes stocks, incidents. Utiliser pour les KPIs généraux.",
            parameters: {
                type: 'object',
                properties: {}
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_equipments',
            description: "Liste les équipements (véhicules, engins, matériel).",
            parameters: {
                type: 'object',
                properties: {
                    category: { type: 'string', description: "Catégorie" },
                    status: { type: 'string', description: "Statut (actif, en panne, etc.)" },
                    search: { type: 'string', description: "Immatriculation ou désignation" }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_purchase_orders',
            description: "Bons de commande fournisseurs.",
            parameters: {
                type: 'object',
                properties: {
                    supplier: { type: 'string', description: "Nom du fournisseur" },
                    status: { type: 'string' },
                    category: { type: 'string' }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_imports',
            description: "Registre des importations.",
            parameters: {
                type: 'object',
                properties: {
                    status: { type: 'string' },
                    country: { type: 'string', description: "Pays d'origine" }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_insurances',
            description: "Polices d'assurance.",
            parameters: {
                type: 'object',
                properties: {
                    type: { type: 'string', description: "Type d'assurance" },
                    expiring_soon: { type: 'boolean', description: "Assurances expirant dans 30 jours" }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_signalements',
            description: "Signalements Top 20 (problèmes à résoudre rapidement).",
            parameters: {
                type: 'object',
                properties: {
                    project_id: { type: 'string' },
                    status: { type: 'string' },
                    overdue: { type: 'boolean', description: "Uniquement les signalements en retard" }
                }
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'create_signalement',
            description: "Crée un nouveau signalement (Top 20).",
            parameters: {
                type: 'object',
                properties: {
                    item: { type: 'string', description: "Élément concerné" },
                    problem: { type: 'string', description: "Problème identifié" },
                    action: { type: 'string', description: "Action à entreprendre" },
                    deadline: { type: 'string', description: "Date limite (YYYY-MM-DD)" },
                    project_id: { type: 'string', description: "ID du projet" }
                },
                required: ['item', 'problem', 'action', 'deadline']
            }
        }
    }
]
