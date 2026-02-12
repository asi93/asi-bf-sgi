'use client'

import React, { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { formatMontant, formatDate } from '@/lib/utils'
import { Search, Ship, Globe } from 'lucide-react'

interface ImportRegistre {
  import_id: string
  numero_import: string
  date_commande: string | null
  fournisseur: string
  pays_origine: string
  categorie_produit: string
  description: string
  montant_fob_fcfa: number
  cout_total_fcfa: number
  incoterm: string
  mode_transport: string
  port_arrivee: string
  statut: string
  transitaire: string
}

export default function ImportsPage() {
  const [imports, setImports] = useState<ImportRegistre[]>([])
  const [filtered, setFiltered] = useState<ImportRegistre[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [filterPays, setFilterPays] = useState('')

  const fetchImports = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/modules/imports')
      const data = await res.json()
      setImports(data.data || [])
      setFiltered(data.data || [])
    } catch (e) {
      console.error('Erreur:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchImports() }, [])

  useEffect(() => {
    let result = imports
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(i =>
        i.fournisseur?.toLowerCase().includes(s) ||
        i.description?.toLowerCase().includes(s) ||
        i.numero_import?.toLowerCase().includes(s)
      )
    }
    if (filterStatut) result = result.filter(i => i.statut === filterStatut)
    if (filterPays) result = result.filter(i => i.pays_origine === filterPays)
    setFiltered(result)
  }, [search, filterStatut, filterPays, imports])

  const statuts = [...new Set(imports.map(i => i.statut).filter(Boolean))]
  const paysOrigine = [...new Set(imports.map(i => i.pays_origine).filter(Boolean))]
  const totalCout = filtered.reduce((s, i) => s + (i.cout_total_fcfa || 0), 0)

  return (
    <AppLayout title="Imports" subtitle={`${filtered.length} importations • ${formatMontant(totalCout)}`} onRefresh={fetchImports} isLoading={isLoading}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Total Imports</p>
          <p className="text-2xl font-bold text-blue-600">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Coût Total</p>
          <p className="text-lg font-bold text-green-600">{formatMontant(totalCout)}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-purple-500" />
            <p className="text-sm text-gray-500">Pays Origine</p>
          </div>
          <p className="text-2xl font-bold text-purple-600">{paysOrigine.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">En Transit</p>
          <p className="text-2xl font-bold text-orange-600">{filtered.filter(i => i.statut === 'En transit').length}</p>
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
            {paysOrigine.map(p => <option key={p} value={p}>{p}</option>)}
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
                <th className="text-left px-4 py-3 font-medium text-gray-600">Import</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Fournisseur</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Pays</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Transport</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Coût Total</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Transitaire</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Aucune importation trouvée</td></tr>
              ) : (
                filtered.map(imp => (
                  <tr key={imp.import_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{imp.numero_import}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">{imp.description}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{imp.fournisseur}</td>
                    <td className="px-4 py-3 text-gray-600">{imp.pays_origine}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{imp.mode_transport} - {imp.incoterm}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatMontant(imp.cout_total_fcfa)}</td>
                    <td className="px-4 py-3 text-gray-600">{imp.transitaire}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${imp.statut === 'Livré' ? 'bg-green-100 text-green-800' : imp.statut === 'En transit' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>{imp.statut}</span>
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
