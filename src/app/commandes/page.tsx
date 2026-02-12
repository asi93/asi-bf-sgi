'use client'

import React, { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { formatMontant, formatDate } from '@/lib/utils'
import { Search, ShoppingCart } from 'lucide-react'

interface BonCommande {
  bc_id: string
  numero_bc: string
  date_emission: string | null
  fournisseur: string
  categorie_achat: string
  objet: string
  montant_ht_fcfa: number
  tva_fcfa: number
  montant_ttc_fcfa: number
  delai_livraison_jours: number
  date_livraison_prevue: string | null
  date_livraison_effective: string | null
  statut_livraison: string
  condition_paiement: string
  statut_paiement: string
  responsable_achat: string
}

export default function CommandesPage() {
  const [commandes, setCommandes] = useState<BonCommande[]>([])
  const [filtered, setFiltered] = useState<BonCommande[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterLivraison, setFilterLivraison] = useState('')
  const [filterPaiement, setFilterPaiement] = useState('')

  const fetchCommandes = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/modules/commandes')
      const data = await res.json()
      setCommandes(data.data || [])
      setFiltered(data.data || [])
    } catch (e) {
      console.error('Erreur:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchCommandes() }, [])

  useEffect(() => {
    let result = commandes
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(c =>
        c.fournisseur?.toLowerCase().includes(s) ||
        c.objet?.toLowerCase().includes(s) ||
        c.numero_bc?.toLowerCase().includes(s)
      )
    }
    if (filterLivraison) result = result.filter(c => c.statut_livraison === filterLivraison)
    if (filterPaiement) result = result.filter(c => c.statut_paiement === filterPaiement)
    setFiltered(result)
  }, [search, filterLivraison, filterPaiement, commandes])

  const statutsLivraison = [...new Set(commandes.map(c => c.statut_livraison).filter(Boolean))]
  const statutsPaiement = [...new Set(commandes.map(c => c.statut_paiement).filter(Boolean))]
  const totalMontant = filtered.reduce((s, c) => s + (c.montant_ttc_fcfa || 0), 0)

  return (
    <AppLayout title="Bons de Commande (GIC)" subtitle={`${filtered.length} commandes • ${formatMontant(totalMontant)}`} onRefresh={fetchCommandes} isLoading={isLoading}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Total Commandes</p>
          <p className="text-2xl font-bold text-blue-600">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Montant Total</p>
          <p className="text-lg font-bold text-green-600">{formatMontant(totalMontant)}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Livrées</p>
          <p className="text-2xl font-bold text-purple-600">{filtered.filter(c => c.statut_livraison === 'Livré' || c.statut_livraison === 'Livrée').length}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">En attente</p>
          <p className="text-2xl font-bold text-orange-600">{filtered.filter(c => c.statut_livraison === 'En attente' || c.statut_livraison === 'En cours').length}</p>
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
          <select value={filterLivraison} onChange={e => setFilterLivraison(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Toutes livraisons</option>
            {statutsLivraison.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterPaiement} onChange={e => setFilterPaiement(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">Tous paiements</option>
            {statutsPaiement.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">N° BC</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Fournisseur</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Objet</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Montant TTC</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Livraison</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Paiement</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Aucune commande trouvée</td></tr>
              ) : (
                filtered.slice(0, 100).map(c => (
                  <tr key={c.bc_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{c.numero_bc}</p>
                      <p className="text-xs text-gray-500">{c.date_emission ? formatDate(c.date_emission) : ''}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.fournisseur}</td>
                    <td className="px-4 py-3 text-gray-700 truncate max-w-[200px]">{c.objet}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatMontant(c.montant_ttc_fcfa)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${c.statut_livraison === 'Livré' || c.statut_livraison === 'Livrée' ? 'bg-green-100 text-green-800' : c.statut_livraison === 'En cours' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>{c.statut_livraison}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${c.statut_paiement === 'Payé' ? 'bg-green-100 text-green-800' : c.statut_paiement === 'En attente' ? 'bg-yellow-100 text-yellow-800' : 'bg-orange-100 text-orange-800'}`}>{c.statut_paiement}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 100 && (
          <div className="px-4 py-3 bg-gray-50 border-t text-sm text-gray-500 text-center">
            Affichage des 100 premières sur {filtered.length} commandes
          </div>
        )}
      </div>
    </AppLayout>
  )
}
