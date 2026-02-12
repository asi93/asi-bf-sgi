'use client'

import React from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { AlertTriangle, TrendingUp } from 'lucide-react'

interface IncidentData {
    month: string
    total: number
    ouverts: number
    impact: number
}

interface Props {
    data: IncidentData[]
}

export default function IncidentsHeatmap({ data }: Props) {
    const totalIncidents = data.reduce((sum, d) => sum + d.total, 0)
    const ouvertsActuels = data[data.length - 1]?.ouverts || 0
    const impactTotal = data.reduce((sum, d) => sum + d.impact, 0)

    const maxImpact = Math.max(...data.map(d => d.impact))
    const criticalMonths = data.filter(d => d.impact > maxImpact * 0.7).length

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Évolution des Incidents</h3>
                    <p className="text-sm text-gray-500">Volume et impact financier</p>
                </div>
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-medium text-red-600">{ouvertsActuels} ouverts</span>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorImpact" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12 }}
                        stroke="#9ca3af"
                    />
                    <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 12 }}
                        stroke="#9ca3af"
                        label={{ value: 'Incidents', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 12 }}
                        stroke="#9ca3af"
                        label={{ value: 'Impact (M)', angle: 90, position: 'insideRight', style: { fontSize: 12 } }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '12px'
                        }}
                        formatter={(value: number, name: string) => {
                            if (name === 'total') return [`${value} incident(s)`, 'Total']
                            if (name === 'ouverts') return [`${value} ouvert(s)`, 'Non résolus']
                            if (name === 'impact') return [`${value.toLocaleString()} M`, 'Impact']
                            return [value, name]
                        }}
                    />
                    <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="total"
                        stroke="#ef4444"
                        fillOpacity={1}
                        fill="url(#colorTotal)"
                        strokeWidth={2}
                        name="total"
                    />
                    <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="impact"
                        stroke="#f59e0b"
                        fillOpacity={1}
                        fill="url(#colorImpact)"
                        strokeWidth={2}
                        name="impact"
                    />
                </AreaChart>
            </ResponsiveContainer>

            <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-xs text-gray-500">Total (6 mois)</p>
                        <p className="text-lg font-bold text-red-600">{totalIncidents}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Impact Total</p>
                        <p className="text-lg font-bold text-orange-600">{impactTotal.toLocaleString()} M</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Mois critiques</p>
                        <p className="text-lg font-bold text-purple-600">
                            {criticalMonths} <span className="text-xs font-normal">/6</span>
                        </p>
                    </div>
                </div>
            </div>

            {ouvertsActuels > 5 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-700">
                        <span className="font-semibold">Attention:</span> {ouvertsActuels} incidents nécessitent une résolution urgente
                    </p>
                </div>
            )}
        </div>
    )
}
