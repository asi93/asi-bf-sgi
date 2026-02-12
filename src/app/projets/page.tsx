'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AppLayout from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/badge'
import { formatMontant } from '@/lib/utils'
import { Search, Filter, MapPin, Calendar, TrendingUp, ExternalLink } from 'lucide-react'

interface Projet {
  projet_id: string
  nom_projet: string
  acronyme: string
  type_projet: string
  pays: string
  region: string
  province: string
  commune: string
  statut: string
  montant_ttc_fcfa: number
  source_financement: string
  date_os: string | null
  duree_prevue_mois: number | null
  niveau_performance: string
}

export default function ProjetsPage() {
  const router = useRouter()
  const [projets, setProjets] = useState<Projet[]>([])
  const [filtered, setFiltered] = useState<Projet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [filterPays, setFilterPays] = useState('')

  const fetchProjets = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/modules/projets')
      const data = await res.json()
      setProjets(data.data || [])
      setFiltered(data.data || [])
    } catch (e) {
      console.error('Erreur:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchProjets() }, [])

  useEffect(() => {
    let result = projets
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(p =>
        p.nom_projet?.toLowerCase().includes(s) ||
        p.acronyme?.toLowerCase().includes(s) ||
        p.projet_id?.toLowerCase().includes(s)
      )
    }
    if (filterStatut) result = result.filter(p => p.statut === filterStatut)
    if (filterPays) result = result.filter(p => p.pays === filterPays)
    setFiltered(result)
  }, [search, filterStatut, filterPays, projets])

  const statuts = [...new Set(projets.map(p => p.statut).filter(Boolean))]
  const pays = [...new Set(projets.map(p => p.pays).filter(Boolean))]

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'En cours': return 'bg-blue-100 text-blue-800'
      case 'Achevé': return 'bg-green-100 text-green-800'
      case 'En attente': return 'bg-yellow-100 text-yellow-800'
      case 'Suspendu': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPerformanceColor = (perf: string) => {
    switch (perf) {
      case 'Très bon': return 'bg-green-100 text-green-800'
      case 'Bon': return 'bg-blue-100 text-blue-800'
      case 'Moyen': return 'bg-yellow-100 text-yellow-800'
      case 'Faible': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const totalMontant = filtered.reduce((s, p) => s + (p.montant_ttc_fcfa || 0), 0)
  const enCours = filtered.filter(p => p.statut === 'En cours').length

  return (
    <AppLayout title="Projets" subtitle={`${filtered.length} projets • ${formatMontant(totalMontant)}`} onRefresh={fetchProjets} isLoading={isLoading}>
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Total Projets</p>
          <p className="text-2xl font-bold text-blue-600">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">En Cours</p>
          <p className="text-2xl font-bold text-green-600">{enCours}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Montant Total TTC</p>
          <p className="text-lg font-bold text-gray-900">{formatMontant(totalMontant)}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Pays</p>
          <p className="text-2xl font-bold text-purple-600">{pays.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un projet..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={filterStatut}
            onChange={e => setFilterStatut(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les statuts</option>
            {statuts.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filterPays}
            onChange={e => setFilterPays(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les pays</option>
            {pays.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Projet</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Pays / Région</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Montant TTC</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Financement</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Statut</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Performance</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Aucun projet trouvé</td></tr>
              ) : (
                filtered.map(projet => (
                  <tr
                    key={projet.projet_id}
                    className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                    onClick={() => router.push(`/projets/${projet.projet_id}`)}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{projet.acronyme || projet.projet_id}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[250px]">{projet.nom_projet}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span>{projet.pays}</span>
                      </div>
                      <p className="text-xs text-gray-500">{projet.region}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{projet.type_projet}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatMontant(projet.montant_ttc_fcfa)}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{projet.source_financement}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatutColor(projet.statut)}`}>
                        {projet.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(projet.niveau_performance)}`}>
                        {projet.niveau_performance}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="p-1.5 hover:bg-white rounded-lg transition-all group-hover:scale-110 group-hover:text-blue-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/projets/${projet.projet_id}`)
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
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
