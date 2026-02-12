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
          messageText = '[START_WORKFLOW:signaler_incident]'
        } else if (listReply.id === 'action_carte_incidents') {
          messageText = 'Affiche la liste complète des incidents'
        }
        // Actions Médias
        else if (listReply.id === 'action_ajouter_medias') {
          messageText = '[START_WORKFLOW:ajouter_medias]'
        } else if (listReply.id === 'action_documents') {
          messageText = 'Affiche les documents du projet'
        } else if (listReply.id === 'action_galerie_photos') {
          messageText = 'Affiche la galerie des photos par projet'
        }
        // KPIs
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
