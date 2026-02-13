'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface Photo {
    id: number
    url: string
    created_at: string
}

interface ProjectGallery {
    projet_id: string
    projet_nom: string
    photos: Photo[]
}

export default function GalleryPage() {
    const [galleries, setGalleries] = useState<ProjectGallery[]>([])
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
    const [lightboxImage, setLightboxImage] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadGalleries()
    }, [])

    async function loadGalleries() {
        const supabase = createBrowserClient()

        // Récupérer photos de la table photos
        const { data: photosData } = await supabase
            .from('photos')
            .select('id, url, created_at, projet_id, projets(nom_projet)')
            .order('created_at', { ascending: false })

        // Récupérer photos des signalements
        const { data: signalementsData } = await supabase
            .from('signalements')
            .select('id, photo_url, created_at, projet_id, projets(nom_projet)')
            .not('photo_url', 'is', null)
            .order('created_at', { ascending: false })

        // Grouper par projet
        const projectMap = new Map<string, ProjectGallery>()

        // Ajouter photos de la table photos
        photosData?.forEach((photo: any) => {
            const projectId = photo.projet_id
            const projectName = photo.projets?.nom_projet || 'Projet inconnu'

            if (!projectMap.has(projectId)) {
                projectMap.set(projectId, {
                    projet_id: projectId,
                    projet_nom: projectName,
                    photos: []
                })
            }

            projectMap.get(projectId)!.photos.push({
                id: photo.id,
                url: photo.url,
                created_at: photo.created_at
            })
        })

        // Ajouter photos des signalements
        signalementsData?.forEach((signalement: any) => {
            const projectId = signalement.projet_id
            const projectName = signalement.projets?.nom_projet || 'Projet inconnu'

            if (!projectMap.has(projectId)) {
                projectMap.set(projectId, {
                    projet_id: projectId,
                    projet_nom: projectName,
                    photos: []
                })
            }

            projectMap.get(projectId)!.photos.push({
                id: signalement.id,
                url: signalement.photo_url,
                created_at: signalement.created_at
            })
        })

        // Convertir en array et trier par nombre de photos
        const galleriesArray = Array.from(projectMap.values())
            .sort((a, b) => b.photos.length - a.photos.length)

        setGalleries(galleriesArray)
        setLoading(false)
    }

    const toggleProject = (projectId: string) => {
        const newExpanded = new Set(expandedProjects)
        if (newExpanded.has(projectId)) {
            newExpanded.delete(projectId)
        } else {
            newExpanded.add(projectId)
        }
        setExpandedProjects(newExpanded)
    }

    if (loading) {
        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <h2 className="text-3xl font-bold tracking-tight">Galerie Média 📸</h2>
                <p className="text-muted-foreground">Chargement...</p>
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Galerie Média 📸</h2>
                <p className="text-sm text-muted-foreground">
                    {galleries.length} projet(s) • {galleries.reduce((sum, g) => sum + g.photos.length, 0)} photo(s)
                </p>
            </div>

            <div className="space-y-4">
                {galleries.map((gallery) => {
                    const isExpanded = expandedProjects.has(gallery.projet_id)

                    return (
                        <Card key={gallery.projet_id} className="overflow-hidden">
                            <CardHeader
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => toggleProject(gallery.projet_id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <CardTitle className="text-lg">{gallery.projet_nom}</CardTitle>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {gallery.photos.length} photo(s)
                                            </p>
                                        </div>
                                    </div>
                                    {isExpanded ? (
                                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                    ) : (
                                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                    )}
                                </div>
                            </CardHeader>

                            {isExpanded && (
                                <CardContent className="pt-0">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {gallery.photos.map((photo) => (
                                            <div
                                                key={photo.id}
                                                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                                                onClick={() => setLightboxImage(photo.url)}
                                            >
                                                <Image
                                                    src={photo.url}
                                                    alt={`Photo ${photo.id}`}
                                                    fill
                                                    className="object-cover transition-transform group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    )
                })}

                {galleries.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Aucune photo pour le moment.</p>
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setLightboxImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] w-full h-full">
                        <Image
                            src={lightboxImage}
                            alt="Photo en plein écran"
                            fill
                            className="object-contain"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
