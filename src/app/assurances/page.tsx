'use client'

import React, { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { formatMontant, formatDate } from '@/lib/utils'
import { Search, Shield, AlertTriangle } from 'lucide-react'

interface Assurance {
  assurance_id: string
  numero_police: string
  type_assurance: string
  categorie: string
  compagnie: string
  date_effet: string | null
  date_echeance: string | null
  prime_annuelle_fcfa: number
  capital_assure_fcfa: number
  franchise_fcfa: number
  nombre_sinistres: number
  montant_sinistres_fcfa: number
  montant_indemnise_fcfa: number
  statut: string
  gestionnaire: string
}

export default function AssurancesPage() {
  const [assurances, setAssurances] = useState<Assurance[]>([])
  const [filtered, setFiltered] = useState<Assurance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatut, setFilterStatut] = useState('')

  const fetchAssurances = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/modules/assurances')
      const data = await res.json()
      setAssurances(data.data || [])
      setFiltered(data.data || [])
    } catch (e) {
      console.error('Erreur:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchAssurances() }, [])

  useEffect(() => {
    let result = assurances
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(a =>
        a.numero_police?.toLowerCase().includes(s) ||
        a.compagnie?.toLowerCase().includes(s) ||
        a.type_assurance?.toLowerCase().includes(s)
      )
    }
    if (filterType) result = result.filter(a => a.type_assurance === filterType)
    if (filterStatut) result = result.filter(a => a.statut === filterStatut)
    setFiltered(result)
  }, [search, filterType, filterStatut, assurances])

  const types = [...new Set(assurances.map(a => a.type_assurance).filter(Boolean))]
  const statuts = [...new Set(assurances.map(a => a.statut).filter(Boolean))]
  const totalPrimes = filtered.reduce((s, a) => s + (a.prime_annuelle_fcfa || 0), 0)
  const totalCapital = filtered.reduce((s, a) => s + (a.capital_assure_fcfa || 0), 0)

  const isExpiringSoon = (dateEcheance: string | null) => {
    if (!dateEcheance) return false
    const echeance = new Date(dateEcheance)
    const now = new Date()
    const diff = echeance.getTime() - now.getTime()
    return diff > 0 && diff < 60 * 24 * 60 * 60 * 1000
  }

  return (
    <AppLayout title="Assurances (GIASS)" subtitle={`${filtered.length} polices`} onRefresh={fetchAssurances} isLoading={isLoading}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Polices Actives</p>
          <p className="text-2xl font-bold text-blue-600">{filtered.filter(a => a.statut === 'Actif').length}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Total Primes</p>
          <p className="text-lg font-bold text-green-600">{formatMontant(totalPrimes)}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Capital Assuré</p>
          <p className="text-lg font-bold text-purple-600">{formatMontant(totalCapital)}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <p className="text-sm text-gray-500">Expirent bientôt</p>
          </div>
          <p className="text-2xl font-bold text-orange-600">{filtered.filter(a => isExpiringSoon(a.date_echeance)).length}</p>
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
                <th className="text-left px-4 py-3 font-medium text-gray-600">Police</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Compagnie</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Échéance</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Prime</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Capital</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Sinistres</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Aucune assurance trouvée</td></tr>
              ) : (
                filtered.map(ass => (
                  <tr key={ass.assurance_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{ass.numero_police}</p>
                      <p className="text-xs text-gray-500">{ass.categorie}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{ass.type_assurance}</td>
                    <td className="px-4 py-3 text-gray-600">{ass.compagnie}</td>
                    <td className="px-4 py-3">
                      <span className={isExpiringSoon(ass.date_echeance) ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                        {ass.date_echeance ? formatDate(ass.date_echeance) : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatMontant(ass.prime_annuelle_fcfa)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatMontant(ass.capital_assure_fcfa)}</td>
                    <td className="px-4 py-3 text-center">{ass.nombre_sinistres}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${ass.statut === 'Actif' ? 'bg-green-100 text-green-800' : ass.statut === 'Expiré' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{ass.statut}</span>
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
