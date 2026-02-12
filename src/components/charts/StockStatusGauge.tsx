'use client'

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Package, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'

interface StockHealth {
    distribution: {
        optimal: number
        normal: number
        alerte: number
        rupture: number
    }
    valeurTotale: number
    totalArticles: number
}

interface Props {
    data: StockHealth
}

export default function StockStatusGauge({ data }: Props) {
    const { distribution, valeurTotale, totalArticles } = data

    const chartData = [
        { name: 'Optimal', value: distribution.optimal, color: '#10b981' },
        { name: 'Normal', value: distribution.normal, color: '#3b82f6' },
        { name: 'Alerte', value: distribution.alerte, color: '#f59e0b' },
        { name: 'Rupture', value: distribution.rupture, color: '#ef4444' },
    ]

    const healthScore = Math.round(
        ((distribution.optimal * 100 + distribution.normal * 75 + distribution.alerte * 25) / totalArticles) || 0
    )

    const getHealthStatus = (score: number) => {
        if (score >= 80) return { label: 'Excellent', color: 'text-green-600', icon: CheckCircle2 }
        if (score >= 60) return { label: 'Bon', color: 'text-blue-600', icon: CheckCircle2 }
        if (score >= 40) return { label: 'Attention', color: 'text-orange-600', icon: AlertTriangle }
        return { label: 'Critique', color: 'text-red-600', icon: XCircle }
    }

    const status = getHealthStatus(healthScore)
    const StatusIcon = status.icon

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Santé des Stocks</h3>
                    <p className="text-sm text-gray-500">Répartition par statut</p>
                </div>
                <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-purple-500" />
                    <span className="text-sm font-medium text-gray-600">{totalArticles} articles</span>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '12px'
                        }}
                        formatter={(value: number) => [`${value} article(s)`, '']}
                    />
                </PieChart>
            </ResponsiveContainer>

            {/* Score de santé au centre */}
            <div className="absolute top-[180px] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <StatusIcon className={`w-8 h-8 ${status.color} mx-auto mb-1`} />
                <p className="text-2xl font-bold text-gray-900">{healthScore}%</p>
                <p className={`text-xs font-medium ${status.color}`}>{status.label}</p>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-gray-600">Optimal: <span className="font-semibold">{distribution.optimal}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-gray-600">Normal: <span className="font-semibold">{distribution.normal}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span className="text-gray-600">Alerte: <span className="font-semibold">{distribution.alerte}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-gray-600">Rupture: <span className="font-semibold">{distribution.rupture}</span></span>
                    </div>
                </div>
                <div className="mt-3 text-center">
                    <p className="text-xs text-gray-500">Valeur totale</p>
                    <p className="text-base font-bold text-purple-600">{valeurTotale.toLocaleString()} M FCFA</p>
                </div>
            </div>
        </div>
    )
}
