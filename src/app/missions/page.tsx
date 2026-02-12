'use client'

import React, { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { formatMontant, formatDate } from '@/lib/utils'
import { Search, MapPin, Plane } from 'lucide-react'

interface OrdreMission {
  om_id: string
  numero_om: string
  employe_id: string
  date_emission: string | null
  date_debut_mission: string | null
  date_fin_mission: string | null
  duree_jours: number
  destination: string
  pays: string
  objet_mission: string
  frais_transport_fcfa: number
  frais_hebergement_fcfa: number
  per_diem_fcfa: number
  autres_frais_fcfa: number
  total_frais_fcfa: number
  avance_percue_fcfa: number
  moyen_transport: string
  statut: string
  validateur: string
}

export default function MissionsPage() {
  const [missions, setMissions] = useState<OrdreMission[]>([])
  const [filtered, setFiltered] = useState<OrdreMission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [filterPays, setFilterPays] = useState('')

  const fetchMissions = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/modules/missions')
      const data = await res.json()
      setMissions(data.data || [])
      setFiltered(data.data || [])
    } catch (e) {
      console.error('Erreur:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchMissions() }, [])

  useEffect(() => {
    let result = missions
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(m =>
        m.objet_mission?.toLowerCase().includes(s) ||
        m.destination?.toLowerCase().includes(s) ||
        m.numero_om?.toLowerCase().includes(s)
      )
    }
    if (filterStatut) result = result.filter(m => m.statut === filterStatut)
    if (filterPays) result = result.filter(m => m.pays === filterPays)
    setFiltered(result)
  }, [search, filterStatut, filterPays, missions])

  const statuts = [...new Set(missions.map(m => m.statut).filter(Boolean))]
  const paysList = [...new Set(missions.map(m => m.pays).filter(Boolean))]
  const totalFrais = filtered.reduce((s, m) => s + (m.total_frais_fcfa || 0), 0)

  return (
    <AppLayout title="Ordres de Mission (GIOM)" subtitle={`${filtered.length} missions • ${formatMontant(totalFrais)}`} onRefresh={fetchMissions} isLoading={isLoading}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Total Missions</p>
          <p className="text-2xl font-bold text-blue-600">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">En Cours</p>
          <p className="text-2xl font-bold text-green-600">{filtered.filter(m => m.statut === 'En cours').length}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Total Frais</p>
          <p className="text-lg font-bold text-purple-600">{formatMontant(totalFrais)}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-orange-500" />
            <p className="text-sm text-gray-500">Pays</p>
          </div>
          <p className="text-2xl font-bold text-orange-600">{paysList.length}</p>
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
          <select value={filterPays} onChange={e => setFilterPays(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Tous pays</option>
            {paysList.map(p => <option key={p} value={p}>{p}</option>)}
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
                <th className="text-left px-4 py-3 font-medium text-gray-600">N° OM</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Objet</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Destination</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Durée</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Total Frais</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Transport</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Aucune mission trouvée</td></tr>
              ) : (
                filtered.slice(0, 100).map(m => (
                  <tr key={m.om_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{m.numero_om}</td>
                    <td className="px-4 py-3 text-gray-700 truncate max-w-[200px]">{m.objet_mission}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span>{m.destination}, {m.pays}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">{m.duree_jours}j</td>
                    <td className="px-4 py-3 text-right font-medium">{formatMontant(m.total_frais_fcfa)}</td>
                    <td className="px-4 py-3 text-gray-600">{m.moyen_transport}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${m.statut === 'Terminé' || m.statut === 'Terminée' ? 'bg-green-100 text-green-800' : m.statut === 'En cours' ? 'bg-blue-100 text-blue-800' : m.statut === 'Annulé' || m.statut === 'Annulée' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{m.statut}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 100 && (
          <div className="px-4 py-3 bg-gray-50 border-t text-sm text-gray-500 text-center">
            Affichage des 100 premières sur {filtered.length} missions
          </div>
        )}
      </div>
    </AppLayout>
  )
}
