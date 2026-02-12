'use client'

import React, { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { formatMontant } from '@/lib/utils'
import { Search, FileCheck, TrendingUp } from 'lucide-react'

interface Marche {
  marche_id: string
  projet_id: string
  numero_marche: string
  intitule: string
  montant_ht_fcfa: number
  tva_fcfa: number
  montant_ttc_fcfa: number
  date_signature: string | null
  duree_mois: number | null
  autorite_contractante: string
  source_financement: string
  nombre_tranches: number
  statut_paiement: string
  taux_execution: number
}

export default function MarchesPage() {
  const [marches, setMarches] = useState<Marche[]>([])
  const [filtered, setFiltered] = useState<Marche[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')

  const fetchMarches = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/modules/marches')
      const data = await res.json()
      setMarches(data.data || [])
      setFiltered(data.data || [])
    } catch (e) {
      console.error('Erreur:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchMarches() }, [])

  useEffect(() => {
    let result = marches
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(m =>
        m.intitule?.toLowerCase().includes(s) ||
        m.numero_marche?.toLowerCase().includes(s) ||
        m.autorite_contractante?.toLowerCase().includes(s)
      )
    }
    if (filterStatut) result = result.filter(m => m.statut_paiement === filterStatut)
    setFiltered(result)
  }, [search, filterStatut, marches])

  const statuts = [...new Set(marches.map(m => m.statut_paiement).filter(Boolean))]
  const totalMontant = filtered.reduce((s, m) => s + (m.montant_ttc_fcfa || 0), 0)
  const tauxMoyen = filtered.length > 0 ? (filtered.reduce((s, m) => s + (m.taux_execution || 0), 0) / filtered.length).toFixed(1) : '0'

  return (
    <AppLayout title="Marchés (GESMA)" subtitle={`${filtered.length} marchés • ${formatMontant(totalMontant)}`} onRefresh={fetchMarches} isLoading={isLoading}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Total Marchés</p>
          <p className="text-2xl font-bold text-blue-600">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Montant Total TTC</p>
          <p className="text-lg font-bold text-green-600">{formatMontant(totalMontant)}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            <p className="text-sm text-gray-500">Taux Exéc. Moyen</p>
          </div>
          <p className="text-2xl font-bold text-purple-600">{tauxMoyen}%</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Financeurs</p>
          <p className="text-2xl font-bold text-orange-600">{[...new Set(marches.map(m => m.source_financement).filter(Boolean))].length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Tous statuts</option>
            {statuts.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Marché</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Intitulé</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Autorité</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Montant TTC</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Taux Exéc.</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Financement</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Paiement</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Aucun marché trouvé</td></tr>
              ) : (
                filtered.map((m, idx) => (
                  <tr key={`${m.marche_id}-${m.projet_id}-${idx}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{m.numero_marche}</p>
                      <p className="text-xs text-gray-500">{m.marche_id} / {m.projet_id}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700 truncate max-w-[200px]">{m.intitule}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{m.autorite_contractante}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatMontant(m.montant_ttc_fcfa)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${m.taux_execution >= 80 ? 'bg-green-500' : m.taux_execution >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(m.taux_execution, 100)}%` }} />
                        </div>
                        <span className="text-xs font-medium">{m.taux_execution}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{m.source_financement}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${m.statut_paiement === 'Payé' || m.statut_paiement === 'Soldé' ? 'bg-green-100 text-green-800' : m.statut_paiement === 'Partiel' ? 'bg-yellow-100 text-yellow-800' : 'bg-orange-100 text-orange-800'}`}>{m.statut_paiement}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  )
}
