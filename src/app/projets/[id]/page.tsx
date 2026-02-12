import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Building, MapPin, User, Calendar, DollarSign, TrendingUp, AlertTriangle, Package, Truck, FileText, Plus } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface ProjectDetailPageProps {
    params: {
        id: string
    }
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
    const supabase = createServerClient()

    // Récupérer le projet
    const { data: projet, error } = await supabase
        .from('projets')
        .select('*')
        .eq('projet_id', params.id)
        .single()

    if (error || !projet) {
        notFound()
    }

    // Récupérer les dépenses GIFE
    const { data: depenses } = await supabase
        .from('gife')
        .select('montant_liquide_fcfa')
        .eq('projet_id', params.id)

    const totalDepenses = depenses?.reduce((sum, d) => sum + (d.montant_liquide_fcfa || 0), 0) || 0
    const ca = projet.montant_ht_fcfa || 0
    const marge = ca - totalDepenses
    const tauxExecution = ca > 0 ? ((totalDepenses / ca) * 100).toFixed(1) : '0'

    // Récupérer les incidents/signalements
    const { data: incidents } = await supabase
        .from('signalements')
        .select('*')
        .eq('projet_id', params.id)
        .eq('statut', 'Ouvert')
        .order('created_at', { ascending: false })
        .limit(5)

    // Récupérer les équipements
    const { data: equipements } = await supabase
        .from('equipements')
        .select('*')
        .eq('projet_id', params.id)
        .limit(5)

    // Récupérer les marchés
    const { data: marches } = await supabase
        .from('marches')
        .select('*')
        .eq('projet_id', params.id)
        .limit(5)

    // Statut badge
    const getStatusBadge = (statut: string) => {
        const variants: Record<string, { variant: any; color: string }> = {
            'En cours': { variant: 'default', color: 'bg-blue-500' },
            'Démarrage': { variant: 'secondary', color: 'bg-yellow-500' },
            'Terminé': { variant: 'success', color: 'bg-green-500' },
            'Suspendu': { variant: 'destructive', color: 'bg-red-500' }
        }
        const config = variants[statut] || variants['En cours']
        return (
            <Badge variant={config.variant as any}>
                {statut}
            </Badge>
        )
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0
        }).format(amount)
    }

    return (
        <div className="container mx-auto py-6 px-4 max-w-7xl">
            {/* En-tête */}
            <div className="mb-6">
                <Link href="/projets">
                    <Button variant="ghost" size="sm" className="mb-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Retour aux projets
                    </Button>
                </Link>

                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{projet.nom}</h1>
                        <div className="flex items-center gap-4 text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {projet.pays}
                            </div>
                            <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {projet.chef_projet || 'Non assigné'}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {getStatusBadge(projet.statut)}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Colonne principale */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Informations générales */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building className="h-5 w-5" />
                                Informations Générales
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Pays</label>
                                    <p className="text-lg">{projet.pays}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Statut</label>
                                    <p className="text-lg">{projet.statut}</p>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Chef de projet</label>
                                    <p>{projet.chef_projet || 'Non assigné'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Date de création</label>
                                    <p>{projet.created_at ? formatDate(projet.created_at) : 'N/A'}</p>
                                </div>
                            </div>

                            {projet.description && (
                                <>
                                    <Separator />
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Description</label>
                                        <p className="mt-1 text-base whitespace-pre-wrap">{projet.description}</p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Finances */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Finances
                            </CardTitle>
                            <CardDescription>Vue d'ensemble financière du projet</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <label className="text-sm font-medium text-blue-700">Chiffre d'Affaires</label>
                                    <p className="text-2xl font-bold text-blue-900">{formatCurrency(ca)}</p>
                                </div>
                                <div className="p-4 bg-red-50 rounded-lg">
                                    <label className="text-sm font-medium text-red-700">Dépenses</label>
                                    <p className="text-2xl font-bold text-red-900">{formatCurrency(totalDepenses)}</p>
                                </div>
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <label className="text-sm font-medium text-green-700">Marge</label>
                                    <p className="text-2xl font-bold text-green-900">{formatCurrency(marge)}</p>
                                </div>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Taux d'exécution</label>
                                    <p className="text-lg font-semibold">{tauxExecution}%</p>
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/finances?projet=${params.id}`}>
                                        <TrendingUp className="h-4 w-4 mr-2" />
                                        Voir détails
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Incidents & Signalements */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5" />
                                    Incidents & Signalements
                                </CardTitle>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/signalements?projet=${params.id}`}>
                                        Voir tous
                                    </Link>
                                </Button>
                            </div>
                            <CardDescription>
                                {incidents?.length || 0} incident(s) ouvert(s)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {incidents && incidents.length > 0 ? (
                                <div className="space-y-3">
                                    {incidents.map((incident) => (
                                        <Link
                                            key={incident.id}
                                            href={`/signalements/${incident.id}`}
                                            className="block p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className="font-semibold">{incident.item}</p>
                                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                                        {incident.probleme}
                                                    </p>
                                                </div>
                                                <Badge variant="destructive" className="ml-2">Ouvert</Badge>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">
                                    Aucun incident ouvert
                                </p>
                            )}

                            <Separator className="my-4" />

                            <Button className="w-full" variant="outline" asChild>
                                <Link href={`/signalements/new?projet=${params.id}`}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Signaler un incident
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Équipements */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Truck className="h-5 w-5" />
                                    Équipements
                                </CardTitle>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/equipements?projet=${params.id}`}>
                                        Voir tous
                                    </Link>
                                </Button>
                            </div>
                            <CardDescription>
                                {equipements?.length || 0} équipement(s) affecté(s)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {equipements && equipements.length > 0 ? (
                                <div className="space-y-2">
                                    {equipements.map((equip) => (
                                        <div
                                            key={equip.equipement_id}
                                            className="flex items-center justify-between p-3 border rounded-lg"
                                        >
                                            <div>
                                                <p className="font-semibold">{equip.nom}</p>
                                                <p className="text-sm text-muted-foreground">{equip.type}</p>
                                            </div>
                                            <Badge variant="outline">{equip.statut}</Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">
                                    Aucun équipement affecté
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Marchés */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Marchés
                                </CardTitle>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/marches?projet=${params.id}`}>
                                        Voir tous
                                    </Link>
                                </Button>
                            </div>
                            <CardDescription>
                                {marches?.length || 0} marché(s)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {marches && marches.length > 0 ? (
                                <div className="space-y-2">
                                    {marches.map((marche) => (
                                        <div
                                            key={marche.marche_id}
                                            className="flex items-center justify-between p-3 border rounded-lg"
                                        >
                                            <div className="flex-1">
                                                <p className="font-semibold">{marche.titre}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {marche.fournisseur}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold">{formatCurrency(marche.montant || 0)}</p>
                                                <Badge variant="outline" className="mt-1">{marche.statut}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">
                                    Aucun marché
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Colonne latérale - Actions */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Actions Rapides</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button className="w-full" variant="default" asChild>
                                <Link href={`/signalements/new?projet=${params.id}`}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Signaler incident
                                </Link>
                            </Button>

                            <Button className="w-full" variant="outline" asChild>
                                <Link href={`/finances?projet=${params.id}`}>
                                    <DollarSign className="h-4 w-4 mr-2" />
                                    Voir finances
                                </Link>
                            </Button>

                            <Button className="w-full" variant="outline" asChild>
                                <Link href={`/equipements?projet=${params.id}`}>
                                    <Truck className="h-4 w-4 mr-2" />
                                    Gérer équipements
                                </Link>
                            </Button>

                            <Separator className="my-4" />

                            <Button className="w-full" variant="ghost" asChild>
                                <Link href={`/projets?highlight=${params.id}`}>
                                    Voir dans la liste
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Métadonnées */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Métadonnées</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div>
                                <label className="text-muted-foreground">ID Projet</label>
                                <p className="font-mono text-xs">{projet.projet_id}</p>
                            </div>

                            <div>
                                <label className="text-muted-foreground">Créé le</label>
                                <p>{projet.created_at ? formatDate(projet.created_at) : 'N/A'}</p>
                            </div>

                            {projet.updated_at && (
                                <div>
                                    <label className="text-muted-foreground">Modifié le</label>
                                    <p>{formatDate(projet.updated_at)}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
