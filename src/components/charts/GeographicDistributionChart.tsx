'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { MapPin } from 'lucide-react'

interface GeoData {
    pays: string
    projets: number
    montant: number
    enCours: number
}

interface Props {
    data: GeoData[]
}

const countryFlags: Record<string, string> = {
    'Burkina Faso': '🇧🇫',
    'Bénin': '🇧🇯',
    'Togo': '🇹🇬',
    'Niger': '🇳🇪',
    'Sénégal': '🇸🇳',
    'Guinée': '🇬🇳',
    'Mauritanie': '🇲🇷',
    'Mali': '🇲🇱',
    'Côte d\'Ivoire': '🇨🇮',
}

export default function GeographicDistributionChart({ data }: Props) {
    const totalProjects = data.reduce((sum, d) => sum + d.projets, 0)
    const totalAmount = data.reduce((sum, d) => sum + d.montant, 0)

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Répartition Géographique</h3>
                    <p className="text-sm text-gray-500">Projets par pays (Montant en milliards FCFA)</p>
                </div>
                <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium text-gray-600">{data.length} pays</span>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        type="number"
                        tick={{ fontSize: 12 }}
                        stroke="#9ca3af"
                    />
                    <YAxis
                        type="category"
                        dataKey="pays"
                        tick={{ fontSize: 12 }}
                        stroke="#9ca3af"
                        width={110}
                        tickFormatter={(value) => {
                            const flag = countryFlags[value] || '🌍'
                            return `${flag} ${value.length > 10 ? value.substring(0, 10) + '...' : value}`
                        }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '12px'
                        }}
                        formatter={(value: number, name: string) => {
                            if (name === 'montant') return [`${value.toLocaleString()} Md`, 'Montant']
                            if (name === 'projets') return [`${value} projet(s)`, 'Total']
                            if (name === 'enCours') return [`${value} actif(s)`, 'En cours']
                            return [value, name]
                        }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="montant" fill="#3b82f6" name="Montant (Md)" radius={[0, 8, 8, 0]} />
                    <Bar dataKey="projets" fill="#10b981" name="Nb projets" radius={[0, 8, 8, 0]} />
                </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-xs text-gray-500">Total Projets</p>
                        <p className="text-lg font-bold text-blue-600">{totalProjects}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Montant Total</p>
                        <p className="text-lg font-bold text-green-600">{totalAmount.toLocaleString()} Md</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">+ Grand Marché</p>
                        <p className="text-xs font-semibold text-purple-600">
                            {countryFlags[data[0]?.pays] || '🌍'} {data[0]?.pays || 'N/A'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
