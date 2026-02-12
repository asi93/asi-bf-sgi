'use client'

import React, { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { formatMontant, formatDate } from '@/lib/utils'
import { Search, Users, UserCheck, UserX } from 'lucide-react'

interface Candidature {
  candidature_id: string
  numero_candidature: string
  date_reception: string | null
  nom: string
  prenom: string
  sexe: string
  telephone: string
  email: string
  ville_residence: string
  poste_vise: string
  niveau_etudes: string
  annees_experience: number
  pretentions_salariales_fcfa: number
  disponibilite: string
  source: string
  statut: string
  decision: string
  evaluateur: string
}

export default function RHPage() {
  const [candidatures, setCandidatures] = useState<Candidature[]>([])
  const [filtered, setFiltered] = useState<Candidature[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPoste, setFilterPoste] = useState('')
  const [filterDecision, setFilterDecision] = useState('')

  const fetchCandidatures = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/modules/candidatures')
      const data = await res.json()
      setCandidatures(data.data || [])
      setFiltered(data.data || [])
    } catch (e) {
      console.error('Erreur:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchCandidatures() }, [])

  useEffect(() => {
    let result = candidatures
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(c =>
        c.nom?.toLowerCase().includes(s) ||
        c.prenom?.toLowerCase().includes(s) ||
        c.poste_vise?.toLowerCase().includes(s) ||
        c.email?.toLowerCase().includes(s)
      )
    }
    if (filterPoste) result = result.filter(c => c.poste_vise === filterPoste)
    if (filterDecision) result = result.filter(c => c.decision === filterDecision)
    setFiltered(result)
  }, [search, filterPoste, filterDecision, candidatures])

  const postes = [...new Set(candidatures.map(c => c.poste_vise).filter(Boolean))]
  const decisions = [...new Set(candidatures.map(c => c.decision).filter(Boolean))]
  const retenus = filtered.filter(c => c.decision === 'Retenu' || c.decision === 'Embauché').length

  return (
    <AppLayout title="Ressources Humaines (GIDE)" subtitle={`${filtered.length} candidatures`} onRefresh={fetchCandidatures} isLoading={isLoading}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Total Candidatures</p>
          <p className="text-2xl font-bold text-blue-600">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-green-500" />
            <p className="text-sm text-gray-500">Retenus</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{retenus}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Postes</p>
          <p className="text-2xl font-bold text-purple-600">{postes.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">En cours traitement</p>
          <p className="text-2xl font-bold text-orange-600">{filtered.filter(c => c.statut === 'En cours').length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Rechercher nom, poste..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <select value={filterPoste} onChange={e => setFilterPoste(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Tous postes</option>
            {postes.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filterDecision} onChange={e => setFilterDecision(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Toutes décisions</option>
            {decisions.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Candidat</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Poste Visé</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Études</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Expérience</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Prétentions</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ville</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Décision</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Aucune candidature trouvée</td></tr>
              ) : (
                filtered.slice(0, 100).map(c => (
                  <tr key={c.candidature_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{c.nom} {c.prenom}</p>
                      <p className="text-xs text-gray-500">{c.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.poste_vise}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{c.niveau_etudes}</td>
                    <td className="px-4 py-3 text-center">{c.annees_experience} ans</td>
                    <td className="px-4 py-3 text-right font-medium">{formatMontant(c.pretentions_salariales_fcfa)}</td>
                    <td className="px-4 py-3 text-gray-600">{c.ville_residence}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${c.decision === 'Retenu' || c.decision === 'Embauché' ? 'bg-green-100 text-green-800' : c.decision === 'Rejeté' ? 'bg-red-100 text-red-800' : c.decision === 'En attente' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{c.decision}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 100 && (
          <div className="px-4 py-3 bg-gray-50 border-t text-sm text-gray-500 text-center">
            Affichage des 100 premiers sur {filtered.length} candidatures
          </div>
        )}
      </div>
    </AppLayout>
  )
}
