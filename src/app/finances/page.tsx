'use client'

import React, { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { formatMontant } from '@/lib/utils'
import { Search, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

interface GIFE {
  gife_id: string
  projet_id: string
  numero_gife: string
  date_emission: string | null
  objet: string
  type_depense: string
  montant_engage_fcfa: number
  montant_liquide_fcfa: number
  date_limite_utilisation: string | null
  beneficiaire: string
  statut: string
  service_emetteur: string
  validateur: string
}

export default function FinancesPage() {
  const [gife, setGife] = useState<GIFE[]>([])
  const [filtered, setFiltered] = useState<GIFE[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatut, setFilterStatut] = useState('')

  const fetchGife = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/modules/gife')
      const data = await res.json()
      setGife(data.data || [])
      setFiltered(data.data || [])
    } catch (e) {
      console.error('Erreur:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchGife() }, [])

  useEffect(() => {
    let result = gife
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(g =>
        g.objet?.toLowerCase().includes(s) ||
        g.beneficiaire?.toLowerCase().includes(s) ||
        g.numero_gife?.toLowerCase().includes(s)
      )
    }
    if (filterType) result = result.filter(g => g.type_depense === filterType)
    if (filterStatut) result = result.filter(g => g.statut === filterStatut)
    setFiltered(result)
  }, [search, filterType, filterStatut, gife])

  const types = [...new Set(gife.map(g => g.type_depense).filter(Boolean))]
  const statuts = [...new Set(gife.map(g => g.statut).filter(Boolean))]
  const totalEngage = filtered.reduce((s, g) => s + (g.montant_engage_fcfa || 0), 0)
  const totalLiquide = filtered.reduce((s, g) => s + (g.montant_liquide_fcfa || 0), 0)
  const tauxExec = totalEngage > 0 ? ((totalLiquide / totalEngage) * 100).toFixed(1) : '0'

  return (
    <AppLayout title="Finances (GIFE)" subtitle={`${filtered.length} engagements`} onRefresh={fetchGife} isLoading={isLoading}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-blue-500" />
            <p className="text-sm text-gray-500">Engagé</p>
          </div>
          <p className="text-lg font-bold text-blue-600">{formatMontant(totalEngage)}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <p className="text-sm text-gray-500">Liquidé</p>
          </div>
          <p className="text-lg font-bold text-green-600">{formatMontant(totalLiquide)}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Taux Exécution</p>
          <p className="text-2xl font-bold text-purple-600">{tauxExec}%</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Nb Engagements</p>
          <p className="text-2xl font-bold text-gray-900">{filtered.length}</p>
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
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Tous types</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
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
                <th className="text-left px-4 py-3 font-medium text-gray-600">N° GIFE</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Objet</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Bénéficiaire</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Engagé</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Liquidé</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Taux</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Aucun engagement trouvé</td></tr>
              ) : (
                filtered.slice(0, 100).map(g => {
                  const taux = g.montant_engage_fcfa > 0 ? ((g.montant_liquide_fcfa / g.montant_engage_fcfa) * 100).toFixed(0) : '0'
                  return (
                    <tr key={g.gife_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{g.numero_gife}</p>
                        <p className="text-xs text-gray-500">{g.projet_id}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">{g.objet}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{g.type_depense}</td>
                      <td className="px-4 py-3 text-gray-600">{g.beneficiaire}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatMontant(g.montant_engage_fcfa)}</td>
                      <td className="px-4 py-3 text-right font-medium text-green-700">{formatMontant(g.montant_liquide_fcfa)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-medium ${parseInt(taux) >= 80 ? 'text-green-600' : parseInt(taux) >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{taux}%</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${g.statut === 'Liquidé' ? 'bg-green-100 text-green-800' : g.statut === 'En cours' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{g.statut}</span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 100 && (
          <div className="px-4 py-3 bg-gray-50 border-t text-sm text-gray-500 text-center">
            Affichage des 100 premiers sur {filtered.length} engagements
          </div>
        )}
      </div>
    </AppLayout>
  )
}
