'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FolderKanban,
  TrendingUp,
  Package,
  Truck,
  AlertTriangle,
  Bell,
  ArrowRight,
  Maximize2
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import ChatInterface from '@/components/chat/ChatInterface'
import BudgetEvolutionChart from '@/components/charts/BudgetEvolutionChart'
import GeographicDistributionChart from '@/components/charts/GeographicDistributionChart'
import StockStatusGauge from '@/components/charts/StockStatusGauge'
import IncidentsHeatmap from '@/components/charts/IncidentsHeatmap'
import AIInsights from '@/components/dashboard/AIInsights'
import { formatMontantCourt } from '@/lib/utils'

interface Stats {
  projets: { total: number; en_cours: number; acheves: number; montant_total: number }
  finances: { engagements_total: number; liquidations_total: number; taux_execution: number }
  stocks: { valeur_totale: number; articles_alerte: number; total_articles: number }
  equipements: { total: number; en_service: number; en_maintenance: number }
  incidents: { total: number; ouverts: number; impact_financier: number }
  alertes: { total: number; haute: number; moyenne: number }
}

interface ChartData {
  budgetTrend: any[]
  geoDistribution: any[]
  stockHealth: any
  incidentTrend: any[]
}

interface AlerteDB {
  id: string
  type: string
  titre: string
  message: string
  priorite: number
  module: string
  statut: string
  date_creation: string
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [alertes, setAlertes] = useState<AlerteDB[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [showChatFullscreen, setShowChatFullscreen] = useState(false)

  const fetchStats = async () => {
    setIsLoading(true)
    try {
      const [statsRes, chartsRes, alertesRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/charts'),
        fetch('/api/alertes'),
      ])
      const statsData = await statsRes.json()
      const chartsData = await chartsRes.json()
      const alertesData = await alertesRes.json()
      setStats(statsData)
      setChartData(chartsData)
      setAlertes(alertesData.data || [])
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Erreur chargement:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const statCards = stats ? [
    {
      title: 'Projets',
      value: stats.projets.total,
      subtitle: `${stats.projets.en_cours} en cours`,
      icon: FolderKanban,
      color: 'bg-blue-500',
      href: '/projets',
      trend: `${formatMontantCourt(stats.projets.montant_total)} FCFA`,
    },
    {
      title: 'Exécution',
      value: `${stats.finances.taux_execution}%`,
      subtitle: formatMontantCourt(stats.finances.liquidations_total),
      icon: TrendingUp,
      color: 'bg-green-500',
      href: '/finances',
      trend: `sur ${formatMontantCourt(stats.finances.engagements_total)}`,
    },
    {
      title: 'Stocks',
      value: formatMontantCourt(stats.stocks.valeur_totale),
      subtitle: `${stats.stocks.total_articles} articles`,
      icon: Package,
      color: 'bg-purple-500',
      href: '/stocks',
      trend: stats.stocks.articles_alerte > 0 ? `${stats.stocks.articles_alerte} en alerte` : 'Niveaux OK',
      alert: stats.stocks.articles_alerte > 0,
    },
    {
      title: 'Équipements',
      value: stats.equipements.total,
      subtitle: `${stats.equipements.en_service} en service`,
      icon: Truck,
      color: 'bg-orange-500',
      href: '/equipements',
      trend: stats.equipements.en_maintenance > 0 ? `${stats.equipements.en_maintenance} en maintenance` : 'Tous opérationnels',
      alert: stats.equipements.en_maintenance > 0,
    },
    {
      title: 'Incidents',
      value: stats.incidents.total,
      subtitle: `${stats.incidents.ouverts} ouverts`,
      icon: AlertTriangle,
      color: 'bg-red-500',
      href: '/incidents',
      trend: formatMontantCourt(stats.incidents.impact_financier) + ' impact',
      alert: stats.incidents.ouverts > 0,
    },
    {
      title: 'Alertes',
      value: alertes.length || stats.alertes.total,
      subtitle: `${stats.alertes.haute} priorité haute`,
      icon: Bell,
      color: 'bg-yellow-500',
      href: '/incidents',
      trend: `${stats.alertes.moyenne} moyenne`,
      alert: stats.alertes.haute > 0,
    },
  ] : []

  const getPriorityColor = (priorite: number) => {
    switch (priorite) {
      case 1: return { bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500', title: 'text-red-800', text: 'text-red-600' }
      case 2: return { bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-500', title: 'text-orange-800', text: 'text-orange-600' }
      case 3: return { bg: 'bg-yellow-50', border: 'border-yellow-200', dot: 'bg-yellow-500', title: 'text-yellow-800', text: 'text-yellow-600' }
      default: return { bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500', title: 'text-blue-800', text: 'text-blue-600' }
    }
  }

  return (
    <AppLayout
      title="Tableau de Bord"
      subtitle={lastUpdate ? `Mis à jour: ${lastUpdate.toLocaleTimeString('fr-FR')}` : undefined}
      onRefresh={fetchStats}
      isLoading={isLoading}
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        {isLoading || !stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border p-4 animate-pulse">
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {statCards.map((card, index) => (
              <Link
                key={index}
                href={card.href}
                className="bg-white rounded-xl border shadow-sm p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer relative overflow-hidden group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{card.title}</p>
                    <p className="text-2xl font-bold mt-1">{card.value}</p>
                    <p className="text-sm text-gray-600 mt-1">{card.subtitle}</p>
                    <p className={`text-xs mt-2 ${card.alert ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                      {card.trend}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${card.color}`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                {card.alert && (
                  <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full m-2 animate-pulse" />
                )}
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-4 h-4 text-blue-500" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* AI Insights */}
        {!isLoading && chartData && (
          <AIInsights
            budgetTrend={chartData.budgetTrend}
            geoDistribution={chartData.geoDistribution}
            stockHealth={chartData.stockHealth}
            incidentTrend={chartData.incidentTrend}
          />
        )}

        {/* Charts Grid */}
        {!isLoading && chartData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BudgetEvolutionChart data={chartData.budgetTrend} />
            <GeographicDistributionChart data={chartData.geoDistribution} />
            <StockStatusGauge data={chartData.stockHealth} />
            <IncidentsHeatmap data={chartData.incidentTrend} />
          </div>
        )}

        {/* Chat + Alertes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[600px] relative">
            <button
              onClick={() => setShowChatFullscreen(true)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/90 hover:bg-white rounded-lg shadow-sm border border-gray-200 transition-colors"
              title="Plein écran"
            >
              <Maximize2 className="w-4 h-4 text-gray-600" />
            </button>
            <ChatInterface />
          </div>

          {/* Alertes */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Alertes Récentes</h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${alertes.length > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                {alertes.length} active{alertes.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-3 max-h-[480px] overflow-y-auto">
              {alertes.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Aucune alerte active</p>
                  <p className="text-xs text-gray-400 mt-1">Le système fonctionne normalement</p>
                </div>
              ) : (
                alertes.slice(0, 10).map((alerte, idx) => {
                  const colors = getPriorityColor(alerte.priorite)
                  return (
                    <div key={alerte.id || idx} className={`p-3 ${colors.bg} border ${colors.border} rounded-lg`}>
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 ${colors.dot} rounded-full mt-2 flex-shrink-0`} />
                        <div className="min-w-0">
                          <p className={`text-sm font-medium ${colors.title}`}>{alerte.titre}</p>
                          <p className={`text-xs ${colors.text} mt-1 truncate`}>{alerte.message}</p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {alertes.length > 0 && (
              <Link
                href="/incidents"
                className="block w-full mt-4 px-4 py-2 text-sm text-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Voir toutes les alertes
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Chat Modal */}
      {showChatFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="absolute inset-4 bg-white rounded-xl shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Assistant IA ASI-TRACK</h2>
              <button
                onClick={() => setShowChatFullscreen(false)}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Fermer
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatInterface />
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
