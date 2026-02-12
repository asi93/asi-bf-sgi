import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
    try {
        const supabase = createServerClient()

        // Récupérer les données pour les graphiques de tendance
        const [
            budgetTrendResult,
            geoDistributionResult,
            stockHealthResult,
            incidentsByMonthResult,
        ] = await Promise.all([
            // Évolution budgétaire GIFE sur 6 derniers mois
            supabase
                .from('gife')
                .select('date_engagement, date_liquidation, montant_engage_fcfa, montant_liquide_fcfa')
                .gte('date_engagement', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
                .order('date_engagement', { ascending: true }),

            // Répartition géographique des projets
            supabase
                .from('projets')
                .select('pays, montant_ttc_fcfa, statut'),

            // Statut des stocks (valeur + alertes)
            supabase
                .from('stocks')
                .select('designation, valeur_stock_fcfa, stock_actuel, stock_alerte'),

            // Incidents par mois
            supabase
                .from('incidents')
                .select('date_incident, gravite, impact_financier_fcfa, statut')
                .gte('date_incident', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
                .order('date_incident', { ascending: true }),
        ])

        // Traiter l'évolution budgétaire par mois
        const budgetData = budgetTrendResult.data || []
        const monthlyBudget = budgetData.reduce((acc, item) => {
            const month = item.date_engagement ? new Date(item.date_engagement).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }) : 'Inconnu'
            if (!acc[month]) {
                acc[month] = { engagements: 0, liquidations: 0 }
            }
            acc[month].engagements += item.montant_engage_fcfa || 0
            acc[month].liquidations += item.montant_liquide_fcfa || 0
            return acc
        }, {} as Record<string, { engagements: number; liquidations: number }>)

        const budgetTrend = Object.keys(monthlyBudget).slice(-6).map(month => ({
            month,
            engagements: Math.round(monthlyBudget[month].engagements / 1000000), // En millions
            liquidations: Math.round(monthlyBudget[month].liquidations / 1000000), // En millions
            execution: monthlyBudget[month].engagements > 0
                ? Math.round((monthlyBudget[month].liquidations / monthlyBudget[month].engagements) * 100)
                : 0,
        }))

        // Traiter la répartition géographique
        const geoData = geoDistributionResult.data || []
        const geoDistribution = Object.entries(
            geoData.reduce((acc, projet) => {
                const pays = projet.pays || 'Non spécifié'
                if (!acc[pays]) {
                    acc[pays] = { total: 0, montant: 0, en_cours: 0 }
                }
                acc[pays].total++
                acc[pays].montant += projet.montant_ttc_fcfa || 0
                if (projet.statut === 'En cours') acc[pays].en_cours++
                return acc
            }, {} as Record<string, { total: number; montant: number; en_cours: number }>)
        ).map(([pays, stats]) => ({
            pays,
            projets: stats.total,
            montant: Math.round(stats.montant / 1000000000), // En milliards
            enCours: stats.en_cours,
        }))
            .sort((a, b) => b.montant - a.montant) // Trier par montant décroissant

        // Traiter le statut des stocks
        const stockData = stockHealthResult.data || []
        const stocksByStatus = {
            optimal: stockData.filter(s => s.stock_actuel > s.stock_alerte * 1.5).length,
            normal: stockData.filter(s => s.stock_actuel > s.stock_alerte && s.stock_actuel <= s.stock_alerte * 1.5).length,
            alerte: stockData.filter(s => s.stock_actuel <= s.stock_alerte && s.stock_actuel > 0).length,
            rupture: stockData.filter(s => s.stock_actuel <= 0).length,
        }
        const totalStock = stockData.reduce((sum, s) => sum + (s.valeur_stock_fcfa || 0), 0)

        // Traiter les incidents par mois
        const incidentData = incidentsByMonthResult.data || []
        const monthlyIncidents = incidentData.reduce((acc, incident) => {
            const month = incident.date_incident ? new Date(incident.date_incident).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }) : 'Inconnu'
            if (!acc[month]) {
                acc[month] = { total: 0, ouverts: 0, impact: 0 }
            }
            acc[month].total++
            if (incident.statut !== 'Résolu') acc[month].ouverts++
            acc[month].impact += incident.impact_financier_fcfa || 0
            return acc
        }, {} as Record<string, { total: number; ouverts: number; impact: number }>)

        const incidentTrend = Object.keys(monthlyIncidents).slice(-6).map(month => ({
            month,
            total: monthlyIncidents[month].total,
            ouverts: monthlyIncidents[month].ouverts,
            impact: Math.round(monthlyIncidents[month].impact / 1000000), // En millions
        }))

        return NextResponse.json({
            budgetTrend,
            geoDistribution,
            stockHealth: {
                distribution: stocksByStatus,
                valeurTotale: Math.round(totalStock / 1000000), // En millions
                totalArticles: stockData.length,
            },
            incidentTrend,
            timestamp: new Date().toISOString(),
        })

    } catch (error) {
        console.error('Erreur API charts:', error)
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des données de graphiques' },
            { status: 500 }
        )
    }
}
