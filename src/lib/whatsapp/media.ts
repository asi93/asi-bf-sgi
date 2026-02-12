
import { createServerClient } from '@/lib/supabase'

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN

/**
 * Télécharge un média depuis WhatsApp API et l'upload sur Supabase Storage
 * Retourne l'URL publique du fichier ou null en cas d'erreur
 */
export async function processMedia(mediaId: string): Promise<string | null> {
    if (!WHATSAPP_ACCESS_TOKEN) {
        console.error('WHATSAPP_ACCESS_TOKEN non configuré')
        return null
    }

    try {
        console.log(`📥 Traitement média WhatsApp: ${mediaId}`)

        // 1. Obtenir l'URL de téléchargement (Graph API)
        const metadataUrl = `https://graph.facebook.com/v21.0/${mediaId}`
        const metadataResponse = await fetch(metadataUrl, {
            headers: {
                'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`
            }
        })

        if (!metadataResponse.ok) {
            throw new Error(`Erreur récupération métadonnées: ${metadataResponse.status} ${metadataResponse.statusText}`)
        }

        const metadata = await metadataResponse.json()
        const downloadUrl = metadata.url
        const mimeType = metadata.mime_type

        if (!downloadUrl) throw new Error('URL de téléchargement manquante')

        console.log(`🔗 URL de téléchargement obtenue (Mime: ${mimeType})`)

        // 2. Télécharger le fichier binaire
        const mediaResponse = await fetch(downloadUrl, {
            headers: {
                'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                'User-Agent': 'ASI-BI-Bot/1.0' // Sometimes helpful
            }
        })

        if (!mediaResponse.ok) {
            throw new Error(`Erreur téléchargement média: ${mediaResponse.status} ${mediaResponse.statusText}`)
        }

        const buffer = await mediaResponse.arrayBuffer()

        // 3. Upload vers Supabase Storage
        const supabase = createServerClient()
        const extension = mimeType.split('/')[1] || 'bin'
        const filename = `${new Date().toISOString().split('T')[0]}/${mediaId}_${Date.now()}.${extension}`

        // Assurer que le bucket existe (déjà fait, mais bon)
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('whatsapp-media')
            .upload(filename, buffer, {
                contentType: mimeType,
                upsert: false
            })

        if (uploadError) {
            console.error('❌ Erreur upload Supabase:', uploadError)
            return null
        }

        // 4. Retourner l'URL Publique
        const { data: { publicUrl } } = supabase.storage
            .from('whatsapp-media')
            .getPublicUrl(filename)

        console.log(`✅ Média uploadé avec succès: ${publicUrl}`)
        return publicUrl

    } catch (error) {
        console.error('❌ Erreur processMedia:', error)
        return null
    }
}
