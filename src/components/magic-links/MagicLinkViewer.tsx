'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import dynamic from 'next/dynamic'
import { formatMontant } from '@/lib/utils'
import {
    Building2,
    Wallet,
    AlertTriangle,
    PackageSearch,
    Users,
    FileText,
    Truck,
    ShieldCheck,
    Globe
} from 'lucide-react'

// Dynamic imports for charts to avoid SSR issues
const BudgetEvolutionChart = dynamic(() => import('@/components/charts/BudgetEvolutionChart'), { ssr: false })
const StockStatusGauge = dynamic(() => import('@/components/charts/StockStatusGauge'), { ssr: false })
const IncidentsHeatmap = dynamic(() => import('@/components/charts/IncidentsHeatmap'), { ssr: false })
const GeographicDistributionChart = dynamic(() => import('@/components/charts/GeographicDistributionChart'), { ssr: false })

interface MagicLinkViewerProps {
    toolName: string
    data: any
    metadata?: any
}

export function MagicLinkViewer({ toolName, data, metadata }: MagicLinkViewerProps) {

    if (!data) return <div className="p-8 text-center text-gray-500">Aucune donnée disponible.</div>

    // --- 1. PROJETS (Liste ou Recherche) ---
    if (toolName === 'get_projects' && Array.isArray(data)) {
        return (
            <div className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-primary" />
                    Projets trouvés ({data.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {data.map((project: any) => (
                        <Card key={project.projet_id} className="hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <Badge variant={project.statut === 'En cours' ? 'default' : 'secondary'}>
                                        {project.statut}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">{project.projet_id}</span>
                                </div>
                                <CardTitle className="text-lg mt-2 line-clamp-2" title={project.nom_projet}>
                                    {project.nom_projet}
                                </CardTitle>
                                <CardDescription>{project.ville_village}, {project.pays}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm font-medium">
                                    Budget: {formatMontant(project.montant_ht_fcfa)}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Acronyme: {project.acronyme || 'N/A'}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    // --- 2. FINANCES DÉTAILLÉES (Projet Unique) ---
    if (toolName === 'get_project_finances_detailed') {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Wallet className="w-8 h-8 text-green-600" />
                        Finances: {data.project_name}
                    </h2>
                    <Badge variant="outline" className="text-lg">{data.status}</Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-blue-600">{formatMontant(data.chiffre_affaire)}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Dépenses GIFE</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-red-600">{formatMontant(data.depenses_gife)}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Marge Brute</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-green-600">{formatMontant(data.marge_brute)}</div></CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Taux Exécution</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{data.taux_execution?.toFixed(1)}%</div></CardContent>
                    </Card>
                </div>

                {/* Placeholder for chart if data available */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Détails des Marchés ({data.nombre_marches})</h3>
                    <div className="space-y-2">
                        {data.marches_details?.map((m: any) => (
                            <div key={m.numero_marche} className="flex justify-between items-center p-2 border-b last:border-0">
                                <div>
                                    <div className="font-medium">{m.objet}</div>
                                    <div className="text-xs text-muted-foreground">{m.numero_marche}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold">{formatMontant(m.montant)}</div>
                                    <Badge variant="secondary" className="text-xs">{m.statut}</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        )
    }

    // --- 3. INCIDENTS (Liste) ---
    if (toolName === 'get_incidents' && Array.isArray(data)) {
        return (
            <div className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-orange-500" />
                    Incidents ({data.length})
                </h2>
                <div className="space-y-3">
                    {data.map((inc: any) => (
                        <Card key={inc.incident_id || inc.numero_incident} className="border-l-4 border-l-orange-500">
                            <CardHeader className="pb-2 pt-4">
                                <div className="flex justify-between">
                                    <CardTitle className="text-base">{inc.type_incident}</CardTitle>
                                    <Badge variant={inc.gravite === 'Critique' ? 'destructive' : 'default'}>{inc.gravite}</Badge>
                                </div>
                                <CardDescription>{inc.lieu} • {new Date(inc.date_incident).toLocaleDateString()}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-700">{inc.description}</p>
                                {inc.cause_identifiee && (
                                    <p className="text-sm text-gray-500 mt-2">Cause: {inc.cause_identifiee}</p>
                                )}
                                <div className="mt-2 text-xs font-mono bg-gray-100 p-1 rounded inline-block">
                                    ID: {inc.numero_incident}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    // --- 4. ÉQUIPEMENTS (Liste) ---
    if (toolName === 'get_equipments' && Array.isArray(data)) {
        return (
            <div className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Truck className="w-6 h-6 text-blue-500" />
                    Équipements ({data.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                    {data.map((eq: any) => (
                        <Card key={eq.equipement_id}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between">
                                    <CardTitle className="text-base">{eq.designation}</CardTitle>
                                    <Badge variant={eq.statut === 'En service' ? 'default' : 'destructive'}>{eq.statut}</Badge>
                                </div>
                                <CardDescription>{eq.marque} • {eq.immatriculation || 'Non immatriculé'}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Catégorie</span>
                                        {eq.categorie}
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">État</span>
                                        {eq.etat}
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Affectation</span>
                                        {eq.affectation || 'Non assigné'}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    // --- 5. STOCKS (Liste) ---
    if (toolName === 'get_stocks' && Array.isArray(data)) {
        return (
            <div className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <PackageSearch className="w-6 h-6 text-purple-600" />
                    Stocks ({data.length})
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 text-left">
                            <tr>
                                <th className="p-2 rounded-tl">Désignation</th>
                                <th className="p-2">Actuel</th>
                                <th className="p-2">Alerte</th>
                                <th className="p-2 rounded-tr">Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item: any) => (
                                <tr key={item.article_id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="p-2 font-medium">{item.designation}</td>
                                    <td className="p-2">{item.stock_actuel} {item.unite}</td>
                                    <td className="p-2 text-gray-500">{item.stock_alerte}</td>
                                    <td className="p-2">
                                        {item.stock_actuel <= item.stock_alerte ? (
                                            <Badge variant="destructive" className="text-xs">Critique</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-xs text-green-600 border-green-200">OK</Badge>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    // --- FALLBACK: JSON Viewer Styled ---
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
                Données Brutes ({toolName})
            </h2>
            <Card>
                <CardContent className="pt-6">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto text-xs max-h-[80vh]">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </CardContent>
            </Card>
        </div>
    )
}
