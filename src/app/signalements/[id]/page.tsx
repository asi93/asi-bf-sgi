import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Calendar, User, MapPin, Building, FileText, Image as ImageIcon, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { formatDate } from '@/lib/utils'

interface SignalementDetailPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function SignalementDetailPage({ params }: SignalementDetailPageProps) {
    const supabase = createServerClient()
    const { id } = await params

    // Récupérer le signalement
    const { data: signalement, error } = await supabase
        .from('signalements')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !signalement) {
        notFound()
    }

    // Déterminer si c'est dans le Top 20
    const isTop20 = signalement.section && signalement.personne_chargee

    // Statut badge
    const getStatusBadge = (statut: string) => {
        const variants: Record<string, { variant: any; icon: any }> = {
            'Ouvert': { variant: 'destructive', icon: AlertTriangle },
            'En cours': { variant: 'default', icon: Clock },
            'Résolu': { variant: 'success', icon: CheckCircle },
            'Fermé': { variant: 'secondary', icon: CheckCircle }
        }
        const config = variants[statut] || variants['Ouvert']
        const Icon = config.icon
        return (
            <Badge variant={config.variant as any} className="flex items-center gap-1">
                <Icon className="h-3 w-3" />
                {statut}
            </Badge>
        )
    }

    return (
        <div className="container mx-auto py-6 px-4 max-w-5xl">
            {/* En-tête */}
            <div className="mb-6">
                <Link href="/signalements">
                    <Button variant="ghost" size="sm" className="mb-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Retour à la liste
                    </Button>
                </Link>

                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">
                            Signalement #{signalement.id}
                        </h1>
                        <p className="text-muted-foreground">
                            Créé le {formatDate(signalement.created_at)}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {getStatusBadge(signalement.statut || 'Ouvert')}
                        {isTop20 && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                                ⭐ Top 20
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Colonne principale */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Photo */}
                    {signalement.photo_url && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ImageIcon className="h-5 w-5" />
                                    Photo
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="relative w-full h-96 rounded-lg overflow-hidden bg-muted">
                                    <Image
                                        src={signalement.photo_url}
                                        alt="Photo du signalement"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Informations principales */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Type</label>
                                <p className="text-lg font-semibold">{signalement.item}</p>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        Pays
                                    </label>
                                    <p>{signalement.pays || 'Non spécifié'}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                        <Building className="h-4 w-4" />
                                        Chantier/Projet
                                    </label>
                                    <p>{signalement.chantier || 'Non spécifié'}</p>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Problème</label>
                                <p className="mt-1 text-base whitespace-pre-wrap">{signalement.probleme}</p>
                            </div>

                            {signalement.action_entreprendre && (
                                <>
                                    <Separator />
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Action à entreprendre</label>
                                        <p className="mt-1 text-base whitespace-pre-wrap">{signalement.action_entreprendre}</p>
                                    </div>
                                </>
                            )}

                            {signalement.created_by_phone && (
                                <>
                                    <Separator />
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                            <User className="h-4 w-4" />
                                            Créé par
                                        </label>
                                        <p>{signalement.created_by_phone}</p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Section Top 20 */}
                    {isTop20 && (
                        <Card className="border-yellow-300 bg-yellow-50/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    ⭐ Top 20 - Suivi
                                </CardTitle>
                                <CardDescription>
                                    Ce signalement est dans le Top 20 des priorités
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Section</label>
                                        <p className="font-semibold">{signalement.section}</p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                            <User className="h-4 w-4" />
                                            Personne chargée
                                        </label>
                                        <p className="font-semibold">{signalement.personne_chargee}</p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            Date début
                                        </label>
                                        <p>{signalement.date_debut ? formatDate(signalement.date_debut) : 'Non définie'}</p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            Date échéance
                                        </label>
                                        <p>{signalement.date_echeance ? formatDate(signalement.date_echeance) : 'Non définie'}</p>
                                    </div>
                                </div>

                                {signalement.rapport_avancement && signalement.rapport_avancement.length > 0 && (
                                    <>
                                        <Separator />
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                                <FileText className="h-4 w-4" />
                                                Rapport d'avancement
                                            </label>
                                            <div className="mt-2 space-y-2">
                                                {signalement.rapport_avancement.map((rapport: any, idx: number) => (
                                                    <div key={idx} className="p-3 bg-white rounded-lg border">
                                                        <p className="text-sm text-muted-foreground">
                                                            {formatDate(rapport.date)}
                                                        </p>
                                                        <p className="mt-1">{rapport.texte}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Colonne latérale - Actions */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {!isTop20 && (
                                <Button className="w-full" variant="default">
                                    ⭐ Assigner au Top 20
                                </Button>
                            )}

                            {isTop20 && (
                                <Button className="w-full" variant="outline">
                                    Retirer du Top 20
                                </Button>
                            )}

                            <Button className="w-full" variant="outline">
                                Modifier
                            </Button>

                            {signalement.statut !== 'Résolu' && signalement.statut !== 'Fermé' && (
                                <Button className="w-full" variant="outline">
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Marquer comme résolu
                                </Button>
                            )}

                            <Separator className="my-4" />

                            <Button className="w-full" variant="ghost" asChild>
                                <Link href={`/signalements?highlight=${signalement.id}`}>
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
                                <label className="text-muted-foreground">ID</label>
                                <p className="font-mono">{signalement.id}</p>
                            </div>

                            {signalement.projet_id && (
                                <div>
                                    <label className="text-muted-foreground">Projet ID</label>
                                    <p className="font-mono">{signalement.projet_id}</p>
                                </div>
                            )}

                            <div>
                                <label className="text-muted-foreground">Créé le</label>
                                <p>{formatDate(signalement.created_at)}</p>
                            </div>

                            {signalement.updated_at && (
                                <div>
                                    <label className="text-muted-foreground">Modifié le</label>
                                    <p>{formatDate(signalement.updated_at)}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
