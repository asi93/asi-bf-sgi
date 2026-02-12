'use client'

import React from 'react'
import { 
  FolderKanban, 
  TrendingUp, 
  Package, 
  Truck, 
  AlertTriangle,
  Bell
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatMontantCourt } from '@/lib/utils'

interface Stats {
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
    total_articles: number
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
  alertes: {
    total: number
    haute: number
    moyenne: number
  }
}

interface StatsCardsProps {
  stats: Stats | null
  isLoading: boolean
}

export default function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: 'Projets',
      value: stats.projets.total,
      subtitle: `${stats.projets.en_cours} en cours`,
      icon: FolderKanban,
      color: 'bg-blue-500',
      trend: `${formatMontantCourt(stats.projets.montant_total)} FCFA`,
    },
    {
      title: 'Execution',
      value: `${stats.finances.taux_execution}%`,
      subtitle: formatMontantCourt(stats.finances.liquidations_total),
      icon: TrendingUp,
      color: 'bg-green-500',
      trend: `sur ${formatMontantCourt(stats.finances.engagements_total)}`,
    },
    {
      title: 'Stocks',
      value: formatMontantCourt(stats.stocks.valeur_totale),
      subtitle: `${stats.stocks.total_articles} articles`,
      icon: Package,
      color: 'bg-purple-500',
      trend: stats.stocks.articles_alerte > 0 
        ? `${stats.stocks.articles_alerte} en alerte` 
        : 'Niveaux OK',
      alert: stats.stocks.articles_alerte > 0,
    },
    {
      title: 'Equipements',
      value: stats.equipements.total,
      subtitle: `${stats.equipements.en_service} en service`,
      icon: Truck,
      color: 'bg-orange-500',
      trend: stats.equipements.en_maintenance > 0 
        ? `${stats.equipements.en_maintenance} en maintenance` 
        : 'Tous operationnels',
      alert: stats.equipements.en_maintenance > 0,
    },
    {
      title: 'Incidents',
      value: stats.incidents.total,
      subtitle: `${stats.incidents.ouverts} ouverts`,
      icon: AlertTriangle,
      color: 'bg-red-500',
      trend: formatMontantCourt(stats.incidents.impact_financier) + ' impact',
      alert: stats.incidents.ouverts > 0,
    },
    {
      title: 'Alertes',
      value: stats.alertes.total,
      subtitle: `${stats.alertes.haute} priorite haute`,
      icon: Bell,
      color: 'bg-yellow-500',
      trend: `${stats.alertes.moyenne} moyenne`,
      alert: stats.alertes.haute > 0,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardContent className="p-4">
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
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
