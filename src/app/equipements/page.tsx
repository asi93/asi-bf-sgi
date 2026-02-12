'use client'

import React, { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { formatMontant, formatDate } from '@/lib/utils'
import { Search, Truck, Wrench, CheckCircle } from 'lucide-react'

interface Equipement {
  equipement_id: string
  designation: string
  categorie: string
  marque: string
  numero_serie: string
  immatriculation: string | null
  annee_acquisition: number | null
  valeur_acquisition_fcfa: number
  valeur_actuelle_fcfa: number
  kilometrage_heures: number
  unite_utilisation: string
  etat: string
  affectation: string
  date_derniere_visite_technique: string | null
  date_prochaine_visite_technique: string | null
  statut: string
}

export default function EquipementsPage() {
  const [equipements, setEquipements] = useState<Equipement[]>([])
  const [filtered, setFiltered] = useState<Equipement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategorie, setFilterCategorie] = useState('')
  const [filterStatut, setFilterStatut] = useState('')

  const fetchEquipements = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/modules/equipements')
      const data = await res.json()
      setEquipements(data.data || [])
      setFiltered(data.data || [])
    } catch (e) {
      console.error('Erreur:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchEquipements() }, [])

  useEffect(() => {
    let result = equipements
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(e =>
        e.designation?.toLowerCase().includes(s) ||
        e.marque?.toLowerCase().includes(s) ||
        e.immatriculation?.toLowerCase().includes(s)
      )
    }
    if (filterCategorie) result = result.filter(e => e.categorie === filterCategorie)
    if (filterStatut) result = result.filter(e => e.statut === filterStatut)
    setFiltered(result)
  }, [search, filterCategorie, filterStatut, equipements])

  const categories = [...new Set(equipements.map(e => e.categorie).filter(Boolean))]
  const statutsList = [...new Set(equipements.map(e => e.statut).filter(Boolean))]
  const totalValeur = filtered.reduce((s, e) => s + (e.valeur_actuelle_fcfa || 0), 0)
  const enService = filtered.filter(e => e.statut === 'En service').length
  const enMaintenance = filtered.filter(e => e.statut === 'En maintenance').length

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'En service': return 'bg-green-100 text-green-800'
      case 'En maintenance': return 'bg-orange-100 text-orange-800'
      case 'En panne': return 'bg-red-100 text-red-800'
      case 'Hors service': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEtatColor = (etat: string) => {
    switch (etat) {
      case 'Excellent': case 'Bon': return 'text-green-600'
      case 'Moyen': return 'text-yellow-600'
      case 'Mauvais': case 'Critique': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <AppLayout title="Équipements (GIFL)" subtitle={`${filtered.length} équipements • Valeur: ${formatMontant(totalValeur)}`} onRefresh={fetchEquipements} isLoading={isLoading}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-blue-600">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <p className="text-sm text-gray-500">En Service</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{enService}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-orange-500" />
            <p className="text-sm text-gray-500">En Maintenance</p>
          </div>
          <p className="text-2xl font-bold text-orange-600">{enMaintenance}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Valeur Parc</p>
          <p className="text-lg font-bold text-gray-900">{formatMontant(totalValeur)}</p>
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
          <select value={filterCategorie} onChange={e => setFilterCategorie(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Toutes catégories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Tous statuts</option>
            {statutsList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Équipement</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Catégorie</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Marque</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Km/Heures</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">État</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Valeur</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Affectation</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Aucun équipement trouvé</td></tr>
              ) : (
                filtered.map(eq => (
                  <tr key={eq.equipement_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{eq.designation}</p>
                      <p className="text-xs text-gray-500">{eq.immatriculation || eq.numero_serie}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{eq.categorie}</td>
                    <td className="px-4 py-3 text-gray-600">{eq.marque}</td>
                    <td className="px-4 py-3 text-center">{eq.kilometrage_heures?.toLocaleString()} {eq.unite_utilisation}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${getEtatColor(eq.etat)}`}>{eq.etat}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatMontant(eq.valeur_actuelle_fcfa)}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{eq.affectation}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatutColor(eq.statut)}`}>{eq.statut}</span>
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
