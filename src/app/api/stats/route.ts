import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createServerClient()

    // Récupérer les statistiques en parallèle
    const [
      projetsResult,
      gifeResult,
      stocksResult,
      equipementsResult,
      incidentsResult,
      alertesResult,
    ] = await Promise.all([
      // Stats projets
      supabase.from('projets').select('statut, montant_ttc_fcfa'),
      // Stats GIFE
      supabase.from('gife').select('montant_engage_fcfa, montant_liquide_fcfa'),
      // Stats stocks
      supabase.from('stocks').select('valeur_stock_fcfa, stock_actuel, stock_alerte'),
      // Stats équipements
      supabase.from('equipements').select('statut'),
      // Stats incidents
      supabase.from('incidents').select('statut, impact_financier_fcfa'),
      // Alertes actives
      supabase.from('alertes').select('type, priorite').eq('statut', 'active'),
    ])

    // Calculer les stats projets
    const projets = projetsResult.data || []
    const projetsStats = {
      total: projets.length,
      en_cours: projets.filter(p => p.statut === 'En cours').length,
      acheves: projets.filter(p => p.statut === 'Achevé').length,
      montant_total: projets.reduce((sum, p) => sum + (p.montant_ttc_fcfa || 0), 0),
    }

    // Calculer les stats finances
    const gife = gifeResult.data || []
    const totalEngagements = gife.reduce((sum, g) => sum + (g.montant_engage_fcfa || 0), 0)
    const totalLiquidations = gife.reduce((sum, g) => sum + (g.montant_liquide_fcfa || 0), 0)
    const financesStats = {
      engagements_total: totalEngagements,
      liquidations_total: totalLiquidations,
      taux_execution: totalEngagements > 0 
        ? Math.round((totalLiquidations / totalEngagements) * 100) 
        : 0,
    }

    // Calculer les stats stocks
    const stocks = stocksResult.data || []
    const stocksStats = {
      valeur_totale: stocks.reduce((sum, s) => sum + (s.valeur_stock_fcfa || 0), 0),
      articles_alerte: stocks.filter(s => s.stock_actuel <= s.stock_alerte).length,
      total_articles: stocks.length,
    }

    // Calculer les stats équipements
    const equipements = equipementsResult.data || []
    const equipementsStats = {
      total: equipements.length,
      en_service: equipements.filter(e => e.statut === 'En service').length,
      en_maintenance: equipements.filter(e => e.statut === 'En maintenance').length,
    }

    // Calculer les stats incidents
    const incidents = incidentsResult.data || []
    const incidentsStats = {
      total: incidents.length,
      ouverts: incidents.filter(i => i.statut !== 'Résolu').length,
      impact_financier: incidents.reduce((sum, i) => sum + (i.impact_financier_fcfa || 0), 0),
    }

    // Alertes
    const alertes = alertesResult.data || []
    const alertesStats = {
      total: alertes.length,
      haute: alertes.filter(a => a.priorite === 'haute').length,
      moyenne: alertes.filter(a => a.priorite === 'moyenne').length,
      par_type: alertes.reduce((acc, a) => {
        acc[a.type] = (acc[a.type] || 0) + 1
        return acc
      }, {} as Record<string, number>),
    }

    return NextResponse.json({
      projets: projetsStats,
      finances: financesStats,
      stocks: stocksStats,
      equipements: equipementsStats,
      incidents: incidentsStats,
      alertes: alertesStats,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Erreur API stats:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    )
  }
}
