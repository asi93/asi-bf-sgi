'use client'

import React from 'react'
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'

interface Insight {
    type: 'warning' | 'success' | 'info' | 'critical'
    title: string
    message: string
    icon: React.ElementType
}

interface Props {
    budgetTrend: any[]
    geoDistribution: any[]
    stockHealth: any
    incidentTrend: any[]
}

export default function AIInsights({ budgetTrend, geoDistribution, stockHealth, incidentTrend }: Props) {
    // Génération automatique d'insights basés sur les données
    const insights: Insight[] = []

    // Insight 1: Dépassements budgétaires
    const latestBudget = budgetTrend[budgetTrend.length - 1]
    if (latestBudget && latestBudget.execution > 110) {
        insights.push({
            type: 'critical',
            title: 'Dépassement budgétaire détecté',
            message: `Le taux d'exécution atteint ${latestBudget.execution}%, dépassant de ${latestBudget.execution - 100}% les engagements prévus.`,
            icon: AlertTriangle,
        })
    }

    // Insight 2: Stocks critiques
    const { distribution } = stockHealth
    if (distribution.alerte > 0 || distribution.rupture > 0) {
        insights.push({
            type: 'warning',
            title: 'Stock critique',
            message: `${distribution.alerte} article(s) en alerte et ${distribution.rupture} en rupture nécessitent un réapprovisionnement urgent.`,
            icon: AlertTriangle,
        })
    }

    // Insight 3: Performance géographique
    if (geoDistribution.length > 0) {
        const topCountry = geoDistribution[0]
        const totalProjects = geoDistribution.reduce((sum, g) => sum + g.projets, 0)
        const topPercentage = Math.round((topCountry.projets / totalProjects) * 100)

        if (topPercentage > 40) {
            insights.push({
                type: 'info',
                title: 'Concentration géographique',
                message: `${topCountry.pays} représente ${topPercentage}% des projets (${topCountry.projets}/${totalProjects}), ce qui peut représenter un risque de concentration.`,
                icon: TrendingUp,
            })
        }
    }

    // Insight 4: Tendance incidents
    const recentIncidents = incidentTrend.slice(-2)
    if (recentIncidents.length === 2) {
        const trend = recentIncidents[1].ouverts - recentIncidents[0].ouverts
        if (trend > 3) {
            insights.push({
                type: 'warning',
                title: 'Hausse des incidents',
                message: `+${trend} incidents ouverts ce mois-ci par rapport au mois dernier. Une analyse des causes racines est recommandée.`,
                icon: AlertTriangle,
            })
        } else if (trend < -2) {
            insights.push({
                type: 'success',
                title: 'Amélioration de la gestion',
                message: `${Math.abs(trend)} incidents en moins ce mois-ci. Excellente progression dans la résolution des problèmes!`,
                icon: CheckCircle,
            })
        }
    }

    // Insight 5: Exécution budgétaire
    if (latestBudget && latestBudget.execution >= 80 && latestBudget.execution <= 100) {
        insights.push({
            type: 'success',
            title: 'Exécution budgétaire optimale',
            message: `Taux d'exécution de ${latestBudget.execution}% - Excellent équilibre entre engagements et liquidations.`,
            icon: CheckCircle,
        })
    }

    const getInsightStyle = (type: Insight['type']) => {
        switch (type) {
            case 'critical':
                return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: 'text-red-600' }
            case 'warning':
                return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', icon: 'text-orange-600' }
            case 'success':
                return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: 'text-green-600' }
            default:
                return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: 'text-blue-600' }
        }
    }

    return (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Insights IA</h3>
                    <p className="text-sm text-gray-600">Analyse automatique des données</p>
                </div>
                <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {insights.length} insight{insights.length !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="space-y-3">
                {insights.length === 0 ? (
                    <div className="text-center py-6">
                        <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Aucune alerte détectée</p>
                        <p className="text-xs text-gray-500 mt-1">Tous les indicateurs sont dans les normes</p>
                    </div>
                ) : (
                    insights.map((insight, idx) => {
                        const style = getInsightStyle(insight.type)
                        const Icon = insight.icon
                        return (
                            <div key={idx} className={`${style.bg} border ${style.border} rounded-lg p-4`}>
                                <div className="flex items-start gap-3">
                                    <Icon className={`w-5 h-5 ${style.icon} flex-shrink-0 mt-0.5`} />
                                    <div className="min-w-0">
                                        <h4 className={`text-sm font-semibold ${style.text}`}>{insight.title}</h4>
                                        <p className="text-xs text-gray-700 mt-1">{insight.message}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
