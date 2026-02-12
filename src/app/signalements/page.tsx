'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import AppLayout from '@/components/layout/AppLayout'
import { formatDate } from '@/lib/utils'
import { Search, AlertTriangle, AlertCircle, CheckCircle, X, ExternalLink, Calendar, User, MapPin, Building, Info, FileText, ImageIcon } from 'lucide-react'

interface Signalement {
    id?: number
    signalement_id: string
    item: string
    pays: string
    chantier: string
    probleme: string
    action_entreprendre: string
    section: string
    personne_chargee: string
    date_debut: string
    date_echeance: string
    duree_jours: number
    statut: string
    rapport_avancement: any[]
    jours_restants: number
    priorite: number
    photo_url?: string
}

interface Stats {
    total_signalements: number
    en_retard: number
    non_echus: number
    resolus: number
    nombre_pays: number
    nombre_chantiers: number
}

export default function SignalementsPage() {
    const router = useRouter()
    const [signalements, setSignalements] = useState<Signalement[]>([])
    const [stats, setStats] = useState<Stats | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [view, setView] = useState<'all' | 'top20'>('all')
    const [selectedItem, setSelectedItem] = useState<Signalement | null>(null)

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/modules/signalements?view=stats')
            const data = await res.json()
            setStats(data.data)
        } catch (e) {
            console.error('Erreur stats:', e)
        }
    }

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const endpoint = view === 'top20' ? '/api/modules/signalements?view=top20' : '/api/modules/signalements'
            const res = await fetch(endpoint)
            const data = await res.json()
            setSignalements(data.data || [])
        } catch (e) {
            console.error('Erreur data:', e)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchStats()
        fetchData()
    }, [view])

    const filtered = signalements.filter(s =>
        s.probleme.toLowerCase().includes(search.toLowerCase()) ||
        s.chantier?.toLowerCase().includes(search.toLowerCase()) ||
        s.signalement_id.toLowerCase().includes(search.toLowerCase()) ||
        s.personne_chargee?.toLowerCase().includes(search.toLowerCase())
    )

    const getStatusConfig = (statut: string) => {
        switch (statut) {
            case 'en_retard': return { label: 'En retard', color: 'bg-red-100 text-red-800', icon: <AlertTriangle className="w-3 h-3" /> }
            case 'non_echue': return { label: 'En cours', color: 'bg-yellow-100 text-yellow-800', icon: <Calendar className="w-3 h-3" /> }
            case 'resolu': return { label: 'Résolu', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> }
            default: return { label: statut, color: 'bg-gray-100 text-gray-800', icon: <Info className="w-3 h-3" /> }
        }
    }

    return (
        <AppLayout
            title="Tableau de Bord - Signalements"
            subtitle="Suivi des incidents et actions correctives"
            onRefresh={() => { fetchStats(); fetchData(); }}
            isLoading={isLoading}
        >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl border p-4 shadow-sm">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Signalements</p>
                    <div className="flex items-end justify-between mt-1">
                        <p className="text-2xl font-bold text-gray-900">{stats?.total_signalements || 0}</p>
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <FileText className="w-5 h-5" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border p-4 shadow-sm ring-1 ring-red-100">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider text-red-600">En Retard</p>
                    <div className="flex items-end justify-between mt-1">
                        <p className="text-2xl font-bold text-red-600">{stats?.en_retard || 0}</p>
                        <div className="p-2 bg-red-50 rounded-lg text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border p-4 shadow-sm">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider text-yellow-600">En Cours</p>
                    <div className="flex items-end justify-between mt-1">
                        <p className="text-2xl font-bold text-yellow-600">{stats?.non_echus || 0}</p>
                        <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600">
                            <Calendar className="w-5 h-5" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border p-4 shadow-sm">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider text-green-600">Résolus</p>
                    <div className="flex items-end justify-between mt-1">
                        <p className="text-2xl font-bold text-green-600">{stats?.resolus || 0}</p>
                        <div className="p-2 bg-green-50 rounded-lg text-green-600">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-xl border p-4 mb-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher par ID, problème, chantier ou responsable..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setView('all')}
                            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${view === 'all' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Tous
                        </button>
                        <button
                            onClick={() => setView('top20')}
                            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${view === 'top20' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Top 20 Urgent
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden mb-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b text-gray-600 font-semibold">
                            <tr>
                                <th className="px-4 py-3 w-16">Photo</th>
                                <th className="px-4 py-3">Signalement</th>
                                <th className="px-4 py-3">Chantier / Pays</th>
                                <th className="px-4 py-3">Responsable</th>
                                <th className="px-4 py-3">Échéance</th>
                                <th className="px-4 py-3 text-center">Statut</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-gray-700">
                            {isLoading ? (
                                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">Chargement des données...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">Aucun signalement trouvé</td></tr>
                            ) : (
                                filtered.map(item => {
                                    const status = getStatusConfig(item.statut)

                                    const handleRowClick = () => {
                                        if (item.id) {
                                            router.push(`/signalements/${item.id}`)
                                        }
                                    }

                                    return (
                                        <tr key={item.signalement_id} className="hover:bg-blue-50/30 transition-colors cursor-pointer group" onClick={handleRowClick}>
                                            <td className="px-4 py-3">
                                                {item.photo_url ? (
                                                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                                                        <Image
                                                            src={item.photo_url}
                                                            alt="Photo"
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                                        <ImageIcon className="w-5 h-5 text-gray-300" />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900">{item.signalement_id}</span>
                                                    <span className="text-xs text-gray-500 line-clamp-1">{item.probleme}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1">
                                                        <Building className="w-3 h-3 text-gray-400" />
                                                        <span className="font-medium">{item.chantier}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3 text-gray-400" />
                                                        <span className="text-xs text-gray-500">{item.pays}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-[10px]">
                                                        {item.personne_chargee?.split(' ').map(n => n[0]).join('') || '?'}
                                                    </div>
                                                    <span className="text-xs font-semibold">{item.personne_chargee}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className={`text-xs font-bold ${item.statut === 'en_retard' ? 'text-red-600' : 'text-gray-700'}`}>
                                                        {formatDate(item.date_echeance)}
                                                    </span>
                                                    {item.statut !== 'resolu' && (
                                                        <span className="text-[10px] text-gray-400 italic">
                                                            {item.jours_restants < 0 ? `${Math.abs(item.jours_restants)} jours de retard` : `${item.jours_restants} jours restants`}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${status.color}`}>
                                                    {status.icon}
                                                    {status.label.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button className="p-1.5 hover:bg-white rounded-lg transition-all group-hover:scale-110 group-hover:text-blue-600" onClick={(e) => { e.stopPropagation(); handleRowClick(); }}>
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                        <div className={`px-6 py-4 flex items-center justify-between border-b ${selectedItem.statut === 'en_retard' ? 'bg-red-50' : selectedItem.statut === 'resolu' ? 'bg-green-50' : 'bg-blue-50'}`}>
                            <div className="flex items-center gap-3">
                                <span className="p-2 bg-white rounded-xl shadow-sm">
                                    <FileText className={`w-5 h-5 ${selectedItem.statut === 'en_retard' ? 'text-red-600' : 'text-blue-600'}`} />
                                </span>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900">{selectedItem.signalement_id}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusConfig(selectedItem.statut).color}`}>
                                            {getStatusConfig(selectedItem.statut).label}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-medium">Créé le {formatDate(selectedItem.date_debut)}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-white rounded-xl shadow-sm transition-all text-gray-400 hover:text-gray-900">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Problem Section */}
                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <AlertCircle className="w-3 h-3" /> Le Problème
                                </p>
                                <p className="text-sm font-medium text-gray-800 leading-relaxed italic border-l-4 border-blue-500 pl-3">
                                    "{selectedItem.probleme}"
                                </p>
                            </div>

                            {/* Action Section */}
                            <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100">
                                <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <CheckCircle className="w-3 h-3" /> Action à Entreprendre
                                </p>
                                <p className="text-sm font-bold text-blue-900 bg-white/50 p-3 rounded-xl border border-blue-200/50 shadow-sm">
                                    {selectedItem.action_entreprendre}
                                </p>
                            </div>

                            {/* Metadata Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-white border rounded-xl shadow-sm">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Responsable</p>
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-blue-500" />
                                        <span className="text-sm font-black">{selectedItem.personne_chargee}</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-white border rounded-xl shadow-sm">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Section</p>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-orange-500" />
                                        <span className="text-sm font-black">{selectedItem.section}</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-white border rounded-xl shadow-sm">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Chantier</p>
                                    <div className="flex items-center gap-2">
                                        <Building className="w-4 h-4 text-purple-500" />
                                        <span className="text-sm font-black text-gray-700">{selectedItem.chantier}</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-white border rounded-xl shadow-sm">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Échéance</p>
                                    <div className="flex items-center gap-2">
                                        <Calendar className={`w-4 h-4 ${selectedItem.statut === 'en_retard' ? 'text-red-500' : 'text-blue-500'}`} />
                                        <span className={`text-sm font-black ${selectedItem.statut === 'en_retard' ? 'text-red-600' : 'text-gray-900'}`}>{formatDate(selectedItem.date_echeance)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Progress History */}
                            <div>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-4 flex items-center gap-1.5 px-1">
                                    <FileText className="w-3 h-3" /> Historique de Rapport ({selectedItem.rapport_avancement?.length || 0})
                                </p>
                                <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-3 before:w-0.5 before:bg-gray-100 pl-8">
                                    {selectedItem.rapport_avancement && selectedItem.rapport_avancement.length > 0 ? (
                                        [...selectedItem.rapport_avancement].reverse().map((r, i) => (
                                            <div key={i} className="relative bg-white border rounded-2xl p-4 shadow-sm group">
                                                <div className="absolute -left-[25px] top-5 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-sm ring-4 ring-blue-50" />
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-black text-blue-600">{formatDate(r.date)}</span>
                                                    <span className="text-[10px] text-gray-400 italic">Par {r.auteur?.substring(0, 8)}...</span>
                                                </div>
                                                <p className="text-sm text-gray-700 leading-relaxed font-medium">{r.texte}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed text-gray-400 text-xs italic">
                                            Aucun rapport d'avancement pour le moment
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
                            <button onClick={() => setSelectedItem(null)} className="px-5 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">
                                Fermer
                            </button>
                            {selectedItem.statut !== 'resolu' && (
                                <button className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-black shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-105 transition-all">
                                    Mettre à jour
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    )
}
