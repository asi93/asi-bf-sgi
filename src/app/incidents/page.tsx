'use client'

import React, { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { formatMontant, formatDate } from '@/lib/utils'
import { Search, AlertTriangle, AlertCircle, CheckCircle, X, ExternalLink, Camera } from 'lucide-react'

interface Incident {
  incident_id: string
  numero_incident: string
  date_incident: string | null
  type_incident: string
  categorie: string
  gravite: string
  lieu: string
  description: string
  cause_identifiee: string
  impact_financier_fcfa: number
  impact_delai_jours: number
  declarant: string
  statut: string
  cout_resolution_fcfa: number
  assurance_sollicitee: string
  photo_url?: string | null
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [filtered, setFiltered] = useState<Incident[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterGravite, setFilterGravite] = useState('')
  const [filterStatut, setFilterStatut] = useState('')

  const getGraviteColor = (gravite: string) => {
    switch (gravite) {
      case 'Critique': return 'bg-red-100 text-red-800'
      case 'Majeur': case 'Majeure': return 'bg-orange-100 text-orange-800'
      case 'Modéré': case 'Modérée': return 'bg-yellow-100 text-yellow-800'
      case 'Mineur': case 'Mineure': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const fetchIncidents = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/modules/incidents')
      const data = await res.json()
      setIncidents(data.data || [])
      setFiltered(data.data || [])
    } catch (e) {
      console.error('Erreur:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchIncidents() }, [])

  useEffect(() => {
    let result = incidents
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(i =>
        i.description?.toLowerCase().includes(s) ||
        i.lieu?.toLowerCase().includes(s) ||
        i.type_incident?.toLowerCase().includes(s)
      )
    }
    if (filterGravite) result = result.filter(i => i.gravite === filterGravite)
    if (filterStatut) result = result.filter(i => i.statut === filterStatut)
    setFiltered(result)
  }, [search, filterGravite, filterStatut, incidents])

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)

  const gravites = [...new Set(incidents.map(i => i.gravite).filter(Boolean))]
  // ... (rest of the state logic)

  // (In the return, after the table)
  {
    selectedIncident && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white px-6 py-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-bold">Détails Incident {selectedIncident.numero_incident}</h3>
            <button onClick={() => setSelectedIncident(null)} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-6">
            {selectedIncident.photo_url && (
              <div className="relative aspect-video w-full rounded-lg overflow-hidden border">
                <img src={selectedIncident.photo_url} alt="Photo incident" className="object-cover w-full h-full" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Type</p>
                <p className="text-sm font-medium">{selectedIncident.type_incident}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Date</p>
                <p className="text-sm font-medium">{selectedIncident.date_incident ? formatDate(selectedIncident.date_incident) : '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Lieu</p>
                <p className="text-sm font-medium">{selectedIncident.lieu}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Déclarant</p>
                <p className="text-sm font-medium">{selectedIncident.declarant}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Description</p>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border">{selectedIncident.description}</p>
            </div>
            <div className="flex justify-between items-center pt-4 border-t">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getGraviteColor(selectedIncident.gravite)}`}>
                Gravité: {selectedIncident.gravite}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedIncident.statut === 'Résolu' || selectedIncident.statut === 'Clos' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                Statut: {selectedIncident.statut}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }
  const statuts = [...new Set(incidents.map(i => i.statut).filter(Boolean))]
  const ouverts = filtered.filter(i => i.statut !== 'Résolu' && i.statut !== 'Clos').length
  const impactTotal = filtered.reduce((s, i) => s + (i.impact_financier_fcfa || 0), 0)


  return (
    <AppLayout title="Incidents (GIH)" subtitle={`${filtered.length} incidents • ${ouverts} ouverts`} onRefresh={fetchIncidents} isLoading={isLoading}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Total Incidents</p>
          <p className="text-2xl font-bold text-blue-600">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-gray-500">Ouverts</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{ouverts}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Impact Financier</p>
          <p className="text-lg font-bold text-orange-600">{formatMontant(impactTotal)}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <p className="text-sm text-gray-500">Résolus</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{filtered.length - ouverts}</p>
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
          <select value={filterGravite} onChange={e => setFilterGravite(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Toutes gravités</option>
            {gravites.map(g => <option key={g} value={g}>{g}</option>)}
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
                <th className="text-left px-4 py-3 font-medium text-gray-600">Incident</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Lieu</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Gravité</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Impact FCFA</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Statut</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Aucun incident trouvé</td></tr>
              ) : (
                filtered.map(inc => (
                  <tr
                    key={inc.incident_id}
                    className="hover:bg-gray-50 cursor-pointer group"
                    onClick={() => setSelectedIncident(inc)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{inc.numero_incident}</p>
                        {inc.photo_url && <Camera className="w-3 h-3 text-blue-500" />}
                      </div>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">{inc.description}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{inc.date_incident ? formatDate(inc.date_incident) : '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{inc.type_incident}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{inc.lieu}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getGraviteColor(inc.gravite)}`}>{inc.gravite}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatMontant(inc.impact_financier_fcfa)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${inc.statut === 'Résolu' || inc.statut === 'Clos' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{inc.statut}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-500 inline-block" />
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
