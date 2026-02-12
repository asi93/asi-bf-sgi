'use client'

import React from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface BudgetDataPoint {
    month: string
    engagements: number
    liquidations: number
    execution: number
}

interface Props {
    data: BudgetDataPoint[]
}

export default function BudgetEvolutionChart({ data }: Props) {
    const latestExecution = data[data.length - 1]?.execution || 0
    const previousExecution = data[data.length - 2]?.execution || 0
    const trend = latestExecution - previousExecution

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Évolution Budgétaire</h3>
                    <p className="text-sm text-gray-500">Engagements vs Liquidations (FCFA millions)</p>
                </div>
                <div className="flex items-center gap-2">
                    {trend >= 0 ? (
                        <TrendingUp className="w-5 h-5 text-green-500" />
                    ) : (
                        <TrendingDown className="w-5 h-5 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trend >= 0 ? '+' : ''}{trend}% d'exécution
                    </span>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12 }}
                        stroke="#9ca3af"
                    />
                    <YAxis
                        tick={{ fontSize: 12 }}
                        stroke="#9ca3af"
                        label={{ value: 'Millions FCFA', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '12px'
                        }}
                        formatter={(value: number) => [`${value.toLocaleString()} M`, '']}
                    />
                    <Legend
                        wrapperStyle={{ fontSize: '12px' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="engagements"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        name="Engagements"
                        dot={{ fill: '#3b82f6', r: 4 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="liquidations"
                        stroke="#10b981"
                        strokeWidth={3}
                        name="Liquidations"
                        dot={{ fill: '#10b981', r: 4 }}
                    />
                </LineChart>
            </ResponsiveContainer>

            <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-xs text-gray-500">Engagement Total</p>
                        <p className="text-lg font-bold text-blue-600">
                            {data.reduce((sum, d) => sum + d.engagements, 0).toLocaleString()} M
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Liquidation Totale</p>
                        <p className="text-lg font-bold text-green-600">
                            {data.reduce((sum, d) => sum + d.liquidations, 0).toLocaleString()} M
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Taux Moyen</p>
                        <p className="text-lg font-bold text-purple-600">
                            {Math.round(data.reduce((sum, d) => sum + d.execution, 0) / data.length)}%
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
