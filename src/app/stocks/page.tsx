'use client'

import React, { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import { formatMontant } from '@/lib/utils'
import { Search, AlertTriangle, Package } from 'lucide-react'

interface Stock {
  article_id: string
  code_article: string
  designation: string
  categorie: string
  unite: string
  stock_actuel: number
  stock_minimum: number
  stock_alerte: number
  prix_unitaire_moyen_fcfa: number
  valeur_stock_fcfa: number
  localisation: string
  statut: string
}

export default function StocksPage() {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [filtered, setFiltered] = useState<Stock[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategorie, setFilterCategorie] = useState('')
  const [filterStatut, setFilterStatut] = useState('')

  const fetchStocks = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/modules/stocks')
      const data = await res.json()
      setStocks(data.data || [])
      setFiltered(data.data || [])
    } catch (e) {
      console.error('Erreur:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchStocks() }, [])

  useEffect(() => {
    let result = stocks
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(a =>
        a.designation?.toLowerCase().includes(s) ||
        a.code_article?.toLowerCase().includes(s)
      )
    }
    if (filterCategorie) result = result.filter(a => a.categorie === filterCategorie)
    if (filterStatut) result = result.filter(a => a.statut === filterStatut)
    setFiltered(result)
  }, [search, filterCategorie, filterStatut, stocks])

  const categories = [...new Set(stocks.map(s => s.categorie).filter(Boolean))]
  const statutsList = [...new Set(stocks.map(s => s.statut).filter(Boolean))]
  const totalValeur = filtered.reduce((s, a) => s + (a.valeur_stock_fcfa || 0), 0)
  const enAlerte = filtered.filter(a => a.stock_actuel <= a.stock_alerte).length

  const getStockStatus = (stock: Stock) => {
    if (stock.stock_actuel <= stock.stock_minimum) return { label: 'Critique', color: 'bg-red-100 text-red-800' }
    if (stock.stock_actuel <= stock.stock_alerte) return { label: 'Alerte', color: 'bg-orange-100 text-orange-800' }
    return { label: 'Normal', color: 'bg-green-100 text-green-800' }
  }

  return (
    <AppLayout title="Stocks (GIS)" subtitle={`${filtered.length} articles • Valeur: ${formatMontant(totalValeur)}`} onRefresh={fetchStocks} isLoading={isLoading}>
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Total Articles</p>
          <p className="text-2xl font-bold text-blue-600">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">En Alerte</p>
          <p className="text-2xl font-bold text-orange-600">{enAlerte}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Valeur Totale</p>
          <p className="text-lg font-bold text-gray-900">{formatMontant(totalValeur)}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Catégories</p>
          <p className="text-2xl font-bold text-purple-600">{categories.length}</p>
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
                placeholder="Rechercher un article..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Article</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Catégorie</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Stock Actuel</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Seuil Alerte</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Seuil Min</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Valeur Stock</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Localisation</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Niveau</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Aucun article trouvé</td></tr>
              ) : (
                filtered.map(article => {
                  const status = getStockStatus(article)
                  return (
                    <tr key={article.article_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{article.designation}</p>
                          <p className="text-xs text-gray-500">{article.code_article}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{article.categorie}</td>
                      <td className="px-4 py-3 text-center font-bold">
                        <span className={article.stock_actuel <= article.stock_alerte ? 'text-red-600' : 'text-gray-900'}>
                          {article.stock_actuel} {article.unite}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500">{article.stock_alerte}</td>
                      <td className="px-4 py-3 text-center text-gray-500">{article.stock_minimum}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatMontant(article.valeur_stock_fcfa)}</td>
                      <td className="px-4 py-3 text-gray-600">{article.localisation}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  )
}
