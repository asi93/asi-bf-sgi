/**
 * WhatsApp Webhook - ASI-BF-SGI
 * Endpoint pour recevoir les messages WhatsApp Business API
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { processQuery } from '@/agents/sgi-agent'
import { sendWhatsAppMessage, sendWhatsAppInteractiveMessage } from '@/lib/whatsapp/client'
import { processMedia } from '@/lib/whatsapp/media'

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'asi-bf-2026-secure'
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID

// Logs au démarrage pour diagnostic
if (!ACCESS_TOKEN) console.error('❌ ERREUR: WHATSAPP_ACCESS_TOKEN manquant')
if (!PHONE_NUMBER_ID) console.error('❌ ERREUR: WHATSAPP_PHONE_NUMBER_ID manquant')

// ========================================
// GET - Vérification Webhook Meta
// ========================================
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  console.log('📝 Tentative vérification webhook WhatsApp')
  console.log({ mode, token: token?.substring(0, 10) + '...', challenge })

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook vérifié avec succès')
    return new NextResponse(challenge, { status: 200 })
  }

  console.error('❌ Vérification échouée - Token invalide')
  return NextResponse.json(
    { error: 'Verification failed' },
    { status: 403 }
  )
}

// ========================================
// POST - Réception Messages WhatsApp
// ========================================
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    console.log('📨 Webhook WhatsApp reçu:', JSON.stringify(body, null, 2))

    // Extraire les données du message
    const entry = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const messages = value?.messages

    // Vérifier qu'il y a bien un message
    if (!messages || messages.length === 0) {
      console.log('ℹ️ Pas de message dans webhook (probablement un statut)')
      return NextResponse.json({ status: 'ok', message: 'No messages' })
    }

    const message = messages[0]
    const phoneNumberId = value.metadata.phone_number_id
    const from = message.from
    const messageId = message.id
    const timestamp = message.timestamp

    // Déterminer le contenu du message selon le type
    let messageText = ''
    let interactiveContext: { type: 'button' | 'list', id: string, title: string } | null = null

    if (message.type === 'text') {
      messageText = message.text?.body || ''
    } else if (message.type === 'interactive') {
      // Message interactif (réponse à un bouton ou une liste)
      const buttonReply = message.interactive.button_reply
      const listReply = message.interactive.list_reply

      if (buttonReply) {
        interactiveContext = {
          type: 'button',
          id: buttonReply.id,
          title: buttonReply.title
        }

        // Convertir l'ID du bouton en requête naturelle
        if (buttonReply.id === 'menu') {
          // Afficher le menu d'actions
          messageText = '[SHOW_ACTION_MENU]'
        } else if (buttonReply.id === 'stocks') {
          messageText = 'Affiche-moi les stocks disponibles'
        } else if (buttonReply.id === 'projets') {
          messageText = 'Liste des projets en cours'
        } else if (buttonReply.id === 'incidents') {
          messageText = 'Incidents ouverts'
        } else {
          messageText = buttonReply.title || buttonReply.id
        }

        console.log('🔘 Réponse bouton:', interactiveContext, '→', messageText)
      } else if (listReply) {
        interactiveContext = {
          type: 'list',
          id: listReply.id,
          title: listReply.title
        }

        // === Sélection dans les menus d'actions ===
        // Actions Incidents
        if (listReply.id === 'action_signaler_incident') {
          // Démarrer workflow incident
          const { getSession, updateSession } = await import('@/lib/whatsapp/session')
          await updateSession(from, 'WORKFLOW_INCIDENT_PROJECT_SEARCH', {})

          await sendWhatsAppMessage(
            from,
            phoneNumberId,
            `🚨 **Signaler un Incident**\n\n🔍 Tapez le nom du projet ou de la ville :\n\n_Exemple : "Ecole", "Route", "Atakpamé"_`
          )
          return NextResponse.json({ status: 'ok' })
        } else if (listReply.id === 'action_carte_incidents') {
          // 🔧 FIX: Envoyer lien direct au lieu de passer par l'IA
          await sendWhatsAppMessage(
            from,
            phoneNumberId,
            `📊 **Liste des Incidents**\n\nConsultez tous les incidents signalés :\n\nhttps://asi-bi.netlify.app/signalements`
          )
          return NextResponse.json({ status: 'ok' })
        }
        // Actions Médias
        else if (listReply.id === 'action_ajouter_medias') {
          // Démarrer workflow médias avec recherche projet
          const { getSession, updateSession } = await import('@/lib/whatsapp/session')
          await updateSession(from, 'WORKFLOW_MEDIA_PROJECT_SEARCH', {})

          await sendWhatsAppMessage(
            from,
            phoneNumberId,
            `📸 **Ajouter des Médias**\n\n🔍 Tapez le nom du chantier/projet :\n\n_Exemple : "Route", "AEP", "Tenkodogo"_`
          )
          return NextResponse.json({ status: 'ok' })
        } else if (listReply.id === 'action_documents') {
          messageText = 'Affiche les documents du projet'
        } else if (listReply.id === 'action_galerie' || listReply.id === 'action_galerie_photos') {
          // 🔧 FIX: Envoyer lien direct au lieu de passer par l'IA
          await sendWhatsAppMessage(
            from,
            phoneNumberId,
            `📸 **Galerie Photos**\n\nAccédez à la galerie complète :\n\nhttps://asi-bi.netlify.app/gallery`
          )
          return NextResponse.json({ status: 'ok' })
        }
        // KPIs & Analyses (new menu V2)
        else if (listReply.id === 'action_kpis') {
          messageText = 'action_kpis'
        } else if (listReply.id === 'action_projets') {
          messageText = 'action_projets'
        } else if (listReply.id === 'action_stocks') {
          messageText = 'action_stocks'
        } else if (listReply.id === 'action_gife') {
          messageText = 'action_gife'
        }
        // Intelligence
        else if (listReply.id === 'action_insights_ia') {
          messageText = 'action_insights_ia'
        } else if (listReply.id === 'action_timeline_risques') {
          messageText = 'action_timeline_risques'
        }
        // KPIs (legacy)
        else if (listReply.id === 'kpi_global') {
          messageText = 'Montre-moi les KPIs globaux (vue d\'ensemble de tous les projets, budgets, avancement, incidents)'
        } else if (listReply.id === 'kpi_finances') {
          messageText = 'Affiche les KPIs financiers: budgets consommés, dépenses, trésorerie'
        } else if (listReply.id === 'kpi_operations') {
          messageText = 'Affiche les KPIs opérationnels: avancement des chantiers et délais'
        } else if (listReply.id === 'kpi_securite') {
          messageText = 'Affiche les KPIs de sécurité: incidents, taux de gravité, zones à risque'
        } else if (listReply.id === 'kpi_ressources') {
          messageText = 'Affiche les KPIs ressources: niveau des stocks, disponibilité véhicules et équipements, personnel'
        }
        // === Sélection de ressources (projets/incidents) ===
        else if (listReply.id.startsWith('project_')) {
          const projectId = listReply.id.replace('project_', '')
          messageText = `Détails du projet ${projectId}`
        } else if (listReply.id.startsWith('incident_')) {
          const incidentId = listReply.id.replace('incident_', '')
          messageText = `Détails de l'incident ${incidentId}`
        } else {
          messageText = listReply.title || listReply.id
        }

        console.log('📜 Réponse liste:', interactiveContext, '→', messageText)
      } else {
        messageText = message.interactive.button_reply?.id || message.interactive.list_reply?.id || ''
      }
    } else if (message.type === 'image') {
      // Pour les images, on passe un identifiant spécial
      const imageId = message.image?.id

      // Télécharger et traiter l'image
      const publicUrl = await processMedia(imageId)

      if (publicUrl) {
        messageText = `[IMAGE:${publicUrl}]`
        console.log(`📷 Image traitée et uploadée: ${publicUrl}`)
      } else {
        messageText = `[IMAGE:${imageId}]`
        console.log(`⚠️ Échec traitement image, utilisation ID: ${imageId}`)
      }
    }

    const messageType = message.type

    console.log('📱 Message reçu:', {
      from,
      phoneNumberId,
      messageId,
      messageType,
      text: messageText.substring(0, 50) + '...',
    })

    // On ne traite que les messages supportés
    if (messageType !== 'text' && messageType !== 'interactive' && messageType !== 'image') {
      console.log(`⚠️ Type non supporté: ${messageType}`)
      return NextResponse.json({ status: 'ok', message: 'Type not supported' })
    }

    // Vérifier que le message n'est pas vide
    if (!messageText || messageText.trim().length === 0) {
      console.log('⚠️ Message vide')
      return NextResponse.json({ status: 'ok', message: 'Empty message' })
    }

    // ========================================
    // ⭐ COMMANDE GLOBALE "MENU" / "ANNULER"
    // ========================================
    if (messageType === 'text') {
      const commandText = messageText.toLowerCase().trim()

      if (['menu', 'annuler', 'quitter', 'stop', 'retour'].includes(commandText)) {
        console.log(`🔄 Commande globale détectée: ${commandText}`)

        const { getSession: getSess, clearSession: clearSess } = await import('@/lib/whatsapp/session')
        const currentSession = await getSess(from)

        // Si workflow actif, nettoyer
        if (currentSession.state?.startsWith('WORKFLOW_')) {
          console.log(`✅ Workflow ${currentSession.state} annulé par commande globale`)
          await clearSess(from)
        }

        // Afficher menu principal
        const { createActionMenu } = await import('@/lib/whatsapp/interactive')
        await sendWhatsAppInteractiveMessage(from, phoneNumberId, createActionMenu())

        return NextResponse.json({ status: 'ok', message: 'Menu displayed' })
      }
    }

    // ========================================
    // Sauvegarder le message reçu dans Supabase
    // ========================================
    const supabase = createServerClient()
    await supabase.from('whatsapp_messages').insert({
      phone_number: from,
      message_type: 'received',
      content: messageText,
      metadata: {
        message_id: messageId,
        timestamp,
        phone_number_id: phoneNumberId,
        message_type: messageType
      },
      status: 'received',
    })

    // ========================================
    // WORKFLOW INCIDENTS - Gestion des étapes
    // ========================================
    const { getSession, updateSession, clearSession } = await import('@/lib/whatsapp/session')
    const session = await getSession(from)

    // Étape 2: Recherche projet
    if (session.state === 'WORKFLOW_INCIDENT_PROJECT_SEARCH') {
      const searchTerm = messageText.toLowerCase().trim()

      if (searchTerm === 'annuler' || searchTerm === 'menu') {
        await clearSession(from)
        const { createActionMenu } = await import('@/lib/whatsapp/interactive')
        await sendWhatsAppInteractiveMessage(from, phoneNumberId, createActionMenu())
        return NextResponse.json({ status: 'ok' })
      }

      const { data: projets } = await supabase
        .from('projets')
        .select('projet_id, nom, localisation')
        .or(`nom.ilike.%${searchTerm}%,localisation.ilike.%${searchTerm}%`)
        .order('nom')
        .limit(10)

      if (!projets || projets.length === 0) {
        await sendWhatsAppMessage(
          from,
          phoneNumberId,
          `❌ Aucun projet trouvé pour "${searchTerm}".\n\n🔄 Essayez un autre nom ou tapez "Menu" pour quitter.`
        )
        return NextResponse.json({ status: 'ok' })
      }

      await updateSession(from, 'WORKFLOW_INCIDENT_PROJECT_SELECT', { searchTerm })

      const { createListMessage } = await import('@/lib/whatsapp/interactive')
      const rows = projets.map(p => ({
        id: `incident_project_${p.projet_id}`,
        title: p.nom.substring(0, 24),
        description: p.localisation ? p.localisation.substring(0, 72) : '...'
      }))

      const listMessage = createListMessage(
        'Sélectionnez le projet concerné :',
        'Projets trouvés',
        [{ title: 'Résultats', rows }]
      )

      await sendWhatsAppInteractiveMessage(from, phoneNumberId, listMessage)
      return NextResponse.json({ status: 'ok' })
    }

    // Étape 3: Sélection Projet -> Catégorie
    if (session.state === 'WORKFLOW_INCIDENT_PROJECT_SELECT' && interactiveContext?.id.startsWith('incident_project_')) {
      const projectId = interactiveContext.id.replace('incident_project_', '')

      const { data: projet } = await supabase
        .from('projets')
        .select('nom')
        .eq('projet_id', projectId)
        .single()

      await updateSession(from, 'WORKFLOW_INCIDENT_CATEGORY', {
        projectId,
        projectName: projet?.nom
      })

      const { createCategoryList } = await import('@/lib/whatsapp/interactive')
      await sendWhatsAppInteractiveMessage(from, phoneNumberId, createCategoryList())
      return NextResponse.json({ status: 'ok' })
    }

    // Étape 4: Sélection Catégorie -> Gravité
    if (session.state === 'WORKFLOW_INCIDENT_CATEGORY' && interactiveContext?.id.startsWith('cat_')) {
      const categoryId = interactiveContext.id.replace('cat_', '')

      await updateSession(from, 'WORKFLOW_INCIDENT_SEVERITY', {
        ...session.data,
        categoryId
      })

      const { createSeverityList } = await import('@/lib/whatsapp/interactive')
      await sendWhatsAppInteractiveMessage(from, phoneNumberId, createSeverityList())
      return NextResponse.json({ status: 'ok' })
    }

    // Étape 5: Sélection Gravité -> Description
    if (session.state === 'WORKFLOW_INCIDENT_SEVERITY' && interactiveContext?.id.startsWith('sev_')) {
      const severityId = interactiveContext.id.replace('sev_', '')

      await updateSession(from, 'WORKFLOW_INCIDENT_DESCRIPTION', {
        ...session.data,
        severityId
      })

      await sendWhatsAppMessage(
        from,
        phoneNumberId,
        `📝 **Description de l'incident**\n\nDécrivez le problème en quelques mots :\n_(Lieu exact, nature du problème, etc.)_`
      )
      return NextResponse.json({ status: 'ok' })
    }

    // Étape 6: Description -> Photo
    if (session.state === 'WORKFLOW_INCIDENT_DESCRIPTION') {
      const description = messageText.trim()

      if (description.length < 3) {
        await sendWhatsAppMessage(from, phoneNumberId, '⚠️ Description trop courte. Veuillez détailler le problème.')
        return NextResponse.json({ status: 'ok' })
      }

      await updateSession(from, 'WORKFLOW_INCIDENT_PHOTO', {
        ...session.data,
        description
      })

      const { createButtonsMessage } = await import('@/lib/whatsapp/interactive')
      const photoPrompt = createButtonsMessage(
        '📸 **Ajouter une photo ?**\n\nSouhaitez-vous joindre une photo de l\'incident ?',
        [
          { id: 'skip_photo', title: 'Non, passer' }
        ],
        { footer: 'Envoyez une photo directement ou cliquez sur "Passer"' }
      )

      await sendWhatsAppInteractiveMessage(from, phoneNumberId, photoPrompt)
      return NextResponse.json({ status: 'ok' })
    }

    // Étape 7: Photo (ou Skip) -> Validation
    if (session.state === 'WORKFLOW_INCIDENT_PHOTO') {
      let photoUrl = null

      if (messageType === 'image' && messageText.startsWith('[IMAGE:')) {
        photoUrl = messageText.replace('[IMAGE:', '').replace(']', '')
      } else if (interactiveContext?.id === 'skip_photo' || messageText.toLowerCase() === 'non' || messageText.toLowerCase() === 'passer') {
        photoUrl = null
      } else {
        // Ignorer les autres messages ou redemander
        await sendWhatsAppMessage(from, phoneNumberId, '📸 Envoyez une photo ou cliquez sur "Passer".')
        return NextResponse.json({ status: 'ok' })
      }

      // ENREGISTREMENT DB
      const incidentData = {
        signalement_id: `SIG-${Date.now()}`, // Fallback ID, DB trigger should handle usually
        projet_id: session.data.projectId,
        categorie: session.data.categoryId,
        gravite: session.data.severityId,
        probleme: session.data.description, // Mapping description -> probleme
        photo_url: photoUrl,
        created_by_phone: from,
        statut: 'non_echue',
        date_echeance: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // +48h par défaut
        // Champs obligatoires legacy
        item: 'Incident WhatsApp',
        action_entreprendre: 'A analyser'
      }

      const { error } = await supabase.from('signalements').insert(incidentData)

      await clearSession(from)

      if (error) {
        console.error('Error creating incident:', error)
        await sendWhatsAppMessage(from, phoneNumberId, '❌ Erreur lors de l\'enregistrement. Veuillez réessayer.')
      } else {
        await sendWhatsAppMessage(
          from,
          phoneNumberId,
          `✅ **Incident Enregistré !**\n\n📋 **Récapitulatif** :\n• Projet : ${session.data.projectName}\n• Type : ${session.data.categoryId}\n• Gravité : ${session.data.severityId}\n\n🔗 Voir le suivi :\nhttps://asi-bi.netlify.app/signalements`
        )
      }

      // Retour menu
      const { createActionMenu } = await import('@/lib/whatsapp/interactive')
      await sendWhatsAppInteractiveMessage(from, phoneNumberId, createActionMenu())
      return NextResponse.json({ status: 'ok' })
    }

    // ========================================
    // WORKFLOW MÉDIAS - Gestion des étapes
    // ========================================

    // Étape 2: Recherche projet (user tape le nom)
    if (session.state === 'WORKFLOW_MEDIA_PROJECT_SEARCH') {
      const searchTerm = messageText.toLowerCase().trim()

      if (searchTerm === 'annuler') {
        await clearSession(from)
        const { createActionMenu } = await import('@/lib/whatsapp/interactive')
        await sendWhatsAppInteractiveMessage(from, phoneNumberId, createActionMenu())
        return NextResponse.json({ status: 'ok' })
      }

      // Rechercher projets
      const { data: projets } = await supabase
        .from('projets')
        .select('projet_id, nom, statut')
        .or(`nom.ilike.%${searchTerm}%,localisation.ilike.%${searchTerm}%`)
        .order('nom')
        .limit(20)

      if (!projets || projets.length === 0) {
        await sendWhatsAppMessage(
          from,
          phoneNumberId,
          `❌ Aucun projet trouvé pour "${searchTerm}".\n\n🔄 Essayez un autre nom ou tapez "annuler" pour quitter.`
        )
        return NextResponse.json({ status: 'ok' })
      }

      await updateSession(from, 'WORKFLOW_MEDIA_PROJECT_SELECT', { searchTerm })

      const { createListMessage } = await import('@/lib/whatsapp/interactive')
      const rows = projets.map(p => ({
        id: `media_project_${p.projet_id}`,
        title: p.nom.substring(0, 24),
        description: p.statut
      }))

      const listMessage = createListMessage(
        'Sélectionnez le projet :',
        'Projets trouvés',
        [{ title: 'Projets trouvés', rows }]
      )

      await sendWhatsAppInteractiveMessage(from, phoneNumberId, listMessage)
      return NextResponse.json({ status: 'ok' })
    }

    // Étape 3: Sélection projet (via liste interactive)
    if (session.state === 'WORKFLOW_MEDIA_PROJECT_SELECT' && interactiveContext?.id.startsWith('media_project_')) {
      const projectId = interactiveContext.id.replace('media_project_', '')

      const { data: projet } = await supabase
        .from('projets')
        .select('nom')
        .eq('projet_id', projectId)
        .single()

      await updateSession(from, 'WORKFLOW_MEDIA_UPLOAD', {
        projectId,
        projectName: projet?.nom || 'Projet inconnu',
        mediaUrls: []
      })

      await sendWhatsAppMessage(
        from,
        phoneNumberId,
        `Projet : **${projet?.nom}** ✅\n\n📸 Envoyez vos photos/vidéos :\n\n_Vous pouvez envoyer plusieurs médias. Tapez "terminé" quand vous avez fini._`
      )
      return NextResponse.json({ status: 'ok' })
    }

    // Étape 4: Upload médias (images reçues)
    if (session.state === 'WORKFLOW_MEDIA_UPLOAD') {
      // Si c'est une image
      if (messageType === 'image' && messageText.startsWith('[IMAGE:')) {
        const imageUrl = messageText.replace('[IMAGE:', '').replace(']', '')
        const mediaUrls = session.data.mediaUrls || []
        mediaUrls.push(imageUrl)

        // BATCHING LOGIC
        const now = Date.now()
        const lastUpdate = new Date(session.updated_at).getTime()
        const timeDiff = now - lastUpdate

        // Si c'est la 1ère photo ou si ça fait > 30s qu'on a rien reçu
        // On notifie. Sinon on reste silencieux (mode rafale)
        const isBatchStart = mediaUrls.length === 1 || timeDiff > 30000

        await updateSession(from, 'WORKFLOW_MEDIA_UPLOAD', {
          ...session.data,
          mediaUrls
        }) // Update timestamp implicitly

        if (isBatchStart) {
          await sendWhatsAppMessage(
            from,
            phoneNumberId,
            `📸 **${mediaUrls.length}** média(s) reçu(s)...\n\n_Continuez d'envoyer vos photos._\n_Tapez "Terminé" pour valider._`
          )
        } else {
          // SILENT MODE - Log only
          console.log(`📸 Batch upload: ${mediaUrls.length} photos (Silent)`)
        }

        return NextResponse.json({ status: 'ok' })
      }

      // Si user tape "terminé"
      if (messageText.toLowerCase() === 'terminé' || messageText.toLowerCase() === 'termine') {
        const mediaCount = session.data.mediaUrls?.length || 0

        if (mediaCount === 0) {
          await sendWhatsAppMessage(
            from,
            phoneNumberId,
            `❌ Aucun média envoyé.\n\nEnvoyez au moins une photo ou tapez "annuler" pour quitter.`
          )
          return NextResponse.json({ status: 'ok' })
        }

        await updateSession(from, 'WORKFLOW_MEDIA_VALIDATE', session.data)

        const { createListMessage } = await import('@/lib/whatsapp/interactive')
        const summary = `📋 **Récapitulatif** :\n\n• Projet : ${session.data.projectName}\n• Médias : ${mediaCount} photo(s) 📸\n\n✅ Confirmer l'envoi ?`

        const confirmMessage = createListMessage(
          'Confirmer ?',
          'Actions',
          [{
            title: 'Actions',
            rows: [
              { id: 'media_confirm', title: '✅ Confirmer', description: 'Enregistrer les médias' },
              { id: 'media_cancel', title: '❌ Annuler', description: 'Recommencer' }
            ]
          }]
        )

        await sendWhatsAppMessage(from, phoneNumberId, summary)
        await sendWhatsAppInteractiveMessage(from, phoneNumberId, confirmMessage)
        return NextResponse.json({ status: 'ok' })
      }
    }

    // Étape 5: Validation finale
    if (session.state === 'WORKFLOW_MEDIA_VALIDATE') {
      if (interactiveContext?.id === 'media_cancel') {
        await clearSession(from)
        const { createActionMenu } = await import('@/lib/whatsapp/interactive')
        await sendWhatsAppMessage(
          from,
          phoneNumberId,
          `❌ Upload annulé.\n\nRetour au menu principal.`
        )
        await sendWhatsAppInteractiveMessage(from, phoneNumberId, createActionMenu())
        return NextResponse.json({ status: 'ok' })
      }

      if (interactiveContext?.id === 'media_confirm') {
        const mediaUrls = session.data.mediaUrls || []

        // Insérer toutes les photos dans la table photos
        const photosToInsert = mediaUrls.map(url => ({
          projet_id: session.data.projectId,
          url,
          uploaded_by: from,
          created_at: new Date().toISOString()
        }))

        const { error } = await supabase
          .from('photos')
          .insert(photosToInsert)

        await clearSession(from)

        if (error) {
          console.error('Error saving photos:', error)
          await sendWhatsAppMessage(
            from,
            phoneNumberId,
            `❌ Erreur lors de l'enregistrement des médias.\n\nVeuillez réessayer.`
          )
        } else {
          await sendWhatsAppMessage(
            from,
            phoneNumberId,
            `✅ **Médias Enregistrés**\n\n📋 **Détails** :\n• Projet : ${session.data.projectName}\n• Médias : ${mediaUrls.length} photo(s) ajoutées ✅\n\n🔗 Voir la galerie complète :\nhttps://asi-bi.netlify.app/gallery`
          )
        }

        const { createActionMenu } = await import('@/lib/whatsapp/interactive')
        await sendWhatsAppInteractiveMessage(from, phoneNumberId, createActionMenu())
        return NextResponse.json({ status: 'ok' })
      }
    }

    // ========================================
    // ⭐ Vérifier et nettoyer session avant IA
    // ========================================
    const { getSession: getSessionBeforeAI, clearSession: clearSessionBeforeAI } = await import('@/lib/whatsapp/session')
    const sessionBeforeAI = await getSessionBeforeAI(from)

    // Si session workflow active MAIS on arrive ici = user veut poser question libre
    if (sessionBeforeAI.state?.startsWith('WORKFLOW_')) {
      console.log(`⚠️ Session workflow active: ${sessionBeforeAI.state}`)
      console.log(`💡 Mais message ne correspond à aucun workflow → Question libre détectée`)
      console.log(`🔄 Nettoyage de la session pour permettre usage libre de l'IA`)

      await clearSessionBeforeAI(from)

      // Optionnel : Informer l'utilisateur (mais bref pour ne pas polluer)
      await sendWhatsAppMessage(
        from,
        phoneNumberId,
        `ℹ️ Workflow précédent annulé.\n\n💬 Je réponds à votre question...`
      )
    }

    // ========================================
    // Appeler l'Agent IA pour traiter la question
    // ========================================
    console.log(`🤖 Envoi à l'agent IA: "${messageText}"`)

    let aiResponse
    try {
      aiResponse = await processQuery(messageText, [], from)
      console.log('✅ Réponse agent IA reçue')
    } catch (aiError) {
      console.error('❌ Erreur agent IA:', aiError)

      // Message d'erreur à l'utilisateur
      await sendWhatsAppMessage(
        from,
        phoneNumberId,
        '⚠️ Désolé, le système est temporairement indisponible. Veuillez réessayer dans quelques instants.'
      )

      return NextResponse.json({
        status: 'error',
        message: 'AI processing failed',
      })
    }

    // ========================================
    // Extraire et formater la réponse
    // ========================================

    let replyContent = ''
    let replyType = 'text'

    // Si réponse interactive
    if (aiResponse.interactive) {
      console.log('📤 Sending interactive message:', JSON.stringify(aiResponse.interactive, null, 2))
      await sendWhatsAppInteractiveMessage(from, phoneNumberId, aiResponse.interactive as any)
      replyContent = JSON.stringify(aiResponse.interactive)
      replyType = 'interactive'
    } else {
      // Réponse texte standard
      let text = aiResponse.response || (typeof aiResponse === 'string' ? aiResponse : 'Réponse reçue.')

      // Adapter pour WhatsApp (limite 4000 caractères)
      if (text.length > 3900) {
        text = text.substring(0, 3900) + '... (tronqué)'
      }

      await sendWhatsAppMessage(from, phoneNumberId, text)
      replyContent = text
    }

    const duration = Date.now() - startTime
    console.log(`✅ Traitement terminé en ${duration}ms`)

    // Sauvegarder le message envoyé
    await supabase.from('whatsapp_messages').insert({
      phone_number: from,
      message_type: 'sent',
      content: replyContent,
      metadata: {
        in_reply_to: messageId,
        phone_number_id: phoneNumberId,
        type: replyType
      },
      status: 'sent',
    })

    return NextResponse.json({
      status: 'success',
      message: 'Message processed',
      duration: `${duration}ms`,
    })

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : ''
    console.error('❌ Erreur générale Webhook WhatsApp:', {
      message: errorMsg,
      stack: errorStack,
      env: {
        hasToken: !!ACCESS_TOKEN,
        hasPhoneId: !!PHONE_NUMBER_ID,
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL
      }
    })

    return NextResponse.json(
      {
        status: 'error',
        message: errorMsg,
        diagnostic: 'Check server logs for full stack trace'
      },
      { status: 500 }
    )
  }
}
