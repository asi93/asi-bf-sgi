import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export interface TimelineEvent {
    id: string
    date: Date
    timeframe: '0-3j' | '3-7j' | '7-15j' | '15-30j'
    severity: 'critical' | 'warning' | 'info'
    category: 'stock' | 'budget' | 'compliance' | 'incident' | 'equipment'
    title: string
    description: string
    impact: {
        financial?: number // FCFA
        operational?: string
    }
    action: {
        label: string
        href?: string
    }
    relatedData?: any
}

function getDaysUntil(date: string | Date): number {
    const target = new Date(date)
    const now = new Date()
    const diff = target.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function getTimeframe(daysUntil: number): TimelineEvent['timeframe'] {
    if (daysUntil <= 3) return '0-3j'
    if (daysUntil <= 7) return '3-7j'
    if (daysUntil <= 15) return '7-15j'
    return '15-30j'
}

export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient()
        const events: TimelineEvent[] = []

        // 1. Détecter ruptures de stock imminentes
        const { data: stocks } = await supabase
            .from('stocks')
            .select('*')
            .filter('quantite_actuelle', 'lte', 'seuil_alerte * 1.5')
            .gt('quantite_actuelle', 0)

        stocks?.forEach((stock) => {
            const consommationMoy = stock.consommation_moyenne || 1
            const jours_avant_rupture = Math.floor(stock.quantite_actuelle / consommationMoy)

            if (jours_avant_rupture <= 30) {
                const estimatedDate = new Date()
                estimatedDate.setDate(estimatedDate.getDate() + jours_avant_rupture)

                events.push({
                    id: `stock-${stock.stock_id}`,
                    date: estimatedDate,
                    timeframe: getTimeframe(jours_avant_rupture),
                    severity: jours_avant_rupture <= 3 ? 'critical' : jours_avant_rupture <= 7 ? 'warning' : 'info',
                    category: 'stock',
                    title: `Rupture stock ${stock.designation}`,
                    description: `Stock restant: ${stock.quantite_actuelle} ${stock.unite}. Consommation: ${consommationMoy} ${stock.unite}/jour.`,
                    impact: {
                        financial: stock.prix_unitaire * stock.quantite_actuelle,
                        operational: `Rupture estimée dans ${jours_avant_rupture} jours`,
                    },
                    action: {
                        label: 'Réapprovisionner',
                        href: '/stocks',
                    },
                    relatedData: stock,
                })
            }
        })

        // 2. Détecter expirations assurances
        const { data: assurances } = await supabase
            .from('assurances')
            .select('*')
            .gte('date_expiration', new Date().toISOString())
            .lte('date_expiration', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())

        assurances?.forEach((assurance) => {
            const daysUntil = getDaysUntil(assurance.date_expiration)

            events.push({
                id: `assurance-${assurance.assurance_id}`,
                date: new Date(assurance.date_expiration),
                timeframe: getTimeframe(daysUntil),
                severity: daysUntil <= 7 ? 'critical' : 'warning',
                category: 'compliance',
                title: `Expiration assurance ${assurance.type}`,
                description: `${assurance.numero_police} expire le ${new Date(assurance.date_expiration).toLocaleDateString('fr-FR')}.`,
                impact: {
                    operational: `Équipement/véhicule ${assurance.equipement_id || 'concerné'} non couvert`,
                },
                action: {
                    label: 'Renouveler',
                    href: '/assurances',
                },
                relatedData: assurance,
            })
        })

        // 3. Détecter équipements nécessitant visite technique
        const { data: equipements } = await supabase
            .from('equipements')
            .select('*')
            .not('date_prochaine_visite', 'is', null)
            .gte('date_prochaine_visite', new Date().toISOString())
            .lte('date_prochaine_visite', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())

        equipements?.forEach((equip) => {
            const daysUntil = getDaysUntil(equip.date_prochaine_visite!)

            events.push({
                id: `equipment-${equip.equipement_id}`,
                date: new Date(equip.date_prochaine_visite!),
                timeframe: getTimeframe(daysUntil),
                severity: daysUntil <= 7 ? 'warning' : 'info',
                category: 'equipment',
                title: `Visite technique ${equip.nom}`,
                description: `${equip.type} nécessite une visite technique obligatoire.`,
                impact: {
                    operational: 'Immobilisation si non effectuée',
                },
                action: {
                    label: 'Planifier',
                    href: '/equipements',
                },
                relatedData: equip,
            })
        })

        // 4. Détecter incidents urgents approchant échéance
        const { data: incidents } = await supabase
            .from('signalements')
            .select('*')
            .eq('statut', 'Ouvert')
            .not('date_echeance', 'is', null)
            .gte('date_echeance', new Date().toISOString())
            .lte('date_echeance', new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString())

        incidents?.forEach((incident) => {
            const daysUntil = getDaysUntil(incident.date_echeance!)

            events.push({
                id: `incident-${incident.id}`,
                date: new Date(incident.date_echeance!),
                timeframe: getTimeframe(daysUntil),
                severity: daysUntil <= 3 ? 'critical' : 'warning',
                category: 'incident',
                title: `Incident urgent: ${incident.item}`,
                description: incident.probleme || 'Incident nécessitant résolution urgente',
                impact: {
                    operational: `Projet ${incident.projet_id} affecté`,
                },
                action: {
                    label: 'Résoudre',
                    href: `/signalements/${incident.id}`,
                },
                relatedData: incident,
            })
        })

        // 5. Détecter projets risquant dépassement budget (exécution > 85%)
        const { data: projets } = await supabase
            .from('projets')
            .select(`
        *,
        gife:gife(montant_liquide_fcfa)
      `)
            .eq('statut', 'En cours')

        const budgetRisks = projets?.filter((projet: any) => {
            const totalDepenses = projet.gife?.reduce((sum: number, g: any) => sum + (g.montant_liquide_fcfa || 0), 0) || 0
            const ca = projet.montant_ht_fcfa || 0
            const tauxExecution = ca > 0 ? (totalDepenses / ca) * 100 : 0

            return tauxExecution > 85 && tauxExecution < 100
        })

        budgetRisks?.forEach((projet: any) => {
            const totalDepenses = projet.gife?.reduce((sum: number, g: any) => sum + (g.montant_liquide_fcfa || 0), 0) || 0
            const ca = projet.montant_ht_fcfa || 0
            const tauxExecution = ((totalDepenses / ca) * 100).toFixed(0)
            const marge = ca - totalDepenses

            events.push({
                id: `budget-${projet.projet_id}`,
                date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // Estimation 10 jours
                timeframe: '7-15j',
                severity: marge < ca * 0.05 ? 'critical' : 'warning', // < 5% marge
                category: 'budget',
                title: `Risque dépassement budget ${projet.nom_projet || projet.projet_id}`,
                description: `Exécution à ${tauxExecution}%. Marge restante: ${(marge / 1000000).toFixed(1)}M FCFA.`,
                impact: {
                    financial: marge,
                    operational: 'Risque dépassement sous 2 semaines',
                },
                action: {
                    label: 'Analyser',
                    href: `/projets/${projet.projet_id}`,
                },
                relatedData: projet,
            })
        })

        // Trier par date
        events.sort((a, b) => a.date.getTime() - b.date.getTime())

        return NextResponse.json({ events })
    } catch (error) {
        console.error('[Timeline] Error:', error)
        return NextResponse.json({ error: 'Failed to generate timeline' }, { status: 500 })
    }
}
