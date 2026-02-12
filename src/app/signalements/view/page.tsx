'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { AlertTriangle, AlertCircle, CheckCircle, Calendar, User, MapPin, Building, FileText, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Signalement {
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
}

function SignalementReadOnlyContent() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id')
    const [item, setItem] = useState<Signalement | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!id) {
            setError('ID de signalement manquant')
            setIsLoading(false)
            return
        }

        const fetchData = async () => {
            try {
                const res = await fetch(`/api/modules/signalements?id=${id}`)
                if (!res.ok) throw new Error('Impossible de charger le signalement')
                const data = await res.json()
                setItem(data.data)
            } catch (e: any) {
                setError(e.message)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [id])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <p className="text-sm font-medium text-gray-500">Chargement du signalement...</p>
                </div>
            </div>
        )
    }

    if (error || !item) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur</h2>
                    <p className="text-gray-500 mb-6">{error || 'Signalement introuvable'}</p>
                    <Link href="/" className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">
                        <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
                    </Link>
                </div>
            </div>
        )
    }

    const getStatusConfig = (statut: string) => {
        switch (statut) {
            case 'en_retard': return { label: 'En retard', color: 'bg-red-100 text-red-800', icon: <AlertTriangle className="w-4 h-4" /> }
            case 'non_echue': return { label: 'En cours', color: 'bg-yellow-100 text-yellow-800', icon: <Calendar className="w-4 h-4" /> }
            case 'resolu': return { label: 'Résolu', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> }
            default: return { label: statut, color: 'bg-gray-100 text-gray-800', icon: <AlertCircle className="w-4 h-4" /> }
        }
    }

    const status = getStatusConfig(item.statut)

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden border-t-8 ${item.statut === 'en_retard' ? 'border-red-600' : 'border-blue-600'}`}>
                    {/* Header */}
                    <div className="px-6 py-8 border-b bg-gradient-to-br from-white to-gray-50">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-gray-900 leading-tight tracking-tight">{item.signalement_id}</h1>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Détails du Signalement</p>
                                </div>
                            </div>
                            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase shadow-sm ${status.color}`}>
                                {status.icon}
                                {status.label}
                            </span>
                        </div>

                        <div className="bg-white/80 backdrop-blur p-5 rounded-2xl border border-gray-100 shadow-inner">
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Problème Signalé</p>
                            <p className="text-lg font-bold text-gray-800 leading-snug">"{item.probleme}"</p>
                        </div>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* Action Required */}
                        <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-100 relative overflow-hidden group">
                            <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform">
                                <CheckCircle className="w-32 h-32" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest mb-3 opacity-70">Action à Entreprendre</p>
                            <p className="text-xl font-black leading-tight">{item.action_entreprendre}</p>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-gray-100">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-black uppercase">Responsable</p>
                                    <p className="text-sm font-black text-gray-900">{item.personne_chargee}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-600 shadow-sm border border-gray-100">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-black uppercase">Localisation</p>
                                    <p className="text-sm font-black text-gray-900">{item.chantier}, {item.pays}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-purple-600 shadow-sm border border-gray-100">
                                    <Building className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-black uppercase">Section</p>
                                    <p className="text-sm font-black text-gray-900">{item.section}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all">
                                <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100 ${item.statut === 'en_retard' ? 'text-red-600' : 'text-blue-600'}`}>
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-black uppercase">Échéance</p>
                                    <p className={`text-sm font-black ${item.statut === 'en_retard' ? 'text-red-600' : 'text-gray-900'}`}>{formatDate(item.date_echeance)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Progress History */}
                        <div>
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <div className="w-6 h-0.5 bg-gray-200"></div>
                                Historique des Rapports ({item.rapport_avancement?.length || 0})
                            </h3>

                            <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-4 before:w-0.5 before:bg-gray-100 pl-4">
                                {item.rapport_avancement && item.rapport_avancement.length > 0 ? (
                                    [...item.rapport_avancement].reverse().map((r, i) => (
                                        <div key={i} className="relative bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow transition-transform hover:-translate-y-0.5">
                                            <div className="absolute -left-[22px] top-6 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-white shadow-sm" />
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{formatDate(r.date)}</span>
                                                <span className="text-[10px] text-gray-400 font-bold">Par {r.auteur?.substring(0, 8)}...</span>
                                            </div>
                                            <p className="text-sm font-medium text-gray-700 leading-relaxed italic border-l-2 border-gray-100 pl-4">{r.texte}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400 font-bold text-xs">
                                        En attente du premier rapport d'avancement
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-gray-900 text-center">
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Système de Signalement ASI-BI</p>
                        <p className="text-gray-500 text-[10px] px-8 italic">
                            Ce lien est confidentiel et à usage unique. Pour toute question, veuillez contacter l'administrateur.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function SignalementReadOnlyPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <p className="text-sm font-medium text-gray-500">Chargement du signalement...</p>
                </div>
            </div>
        }>
            <SignalementReadOnlyContent />
        </Suspense>
    )
}
