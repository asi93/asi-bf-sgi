
import { createServerClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default async function GalleryPage() {
    const supabase = createServerClient()

    // Récupérer les incidents avec photos
    const { data: incidents, error } = await supabase
        .from('incidents')
        .select('*')
        .not('photo_url', 'is', null)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Erreur chargement galerie:', error)
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Galerie Média 📸</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {incidents?.map((incident) => (
                    <Card key={incident.id} className="overflow-hidden">
                        <CardHeader className="p-4 bg-muted/50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-sm font-medium">#{incident.id} - {incident.type}</CardTitle>
                                    <p className="text-xs text-muted-foreground">{new Date(incident.created_at).toLocaleDateString()}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${incident.statut?.toLowerCase() === 'ouvert' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                    }`}>
                                    {incident.statut}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="relative aspect-video w-full">
                                {incident.photo_url && (
                                    <Image
                                        src={incident.photo_url}
                                        alt={`Photo incident ${incident.id}`}
                                        fill
                                        className="object-cover transition-transform hover:scale-105"
                                    />
                                )}
                            </div>
                            <div className="p-4">
                                <p className="text-sm text-gray-700 font-medium">📍 {incident.localisation}</p>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{incident.description}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {(!incidents || incidents.length === 0) && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        <p>Aucune photo d'incident pour le moment.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
