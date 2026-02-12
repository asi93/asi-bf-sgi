/**
 * API Route pour envoyer des messages WhatsApp proactifs
 * Utilisé pour les alertes automatiques et notifications
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendProactiveMessage } from '@/lib/whatsapp/client'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { to, message, type } = await request.json()

    // Validation
    if (!to || !message) {
      return NextResponse.json(
        { error: 'Paramètres "to" et "message" requis' },
        { status: 400 }
      )
    }

    // Envoyer le message WhatsApp
    await sendProactiveMessage(to, message)

    // Sauvegarder dans Supabase
    const supabase = createServerClient()
    await supabase.from('whatsapp_messages').insert({
      phone_number: to,
      message_type: 'sent',
      content: message,
      metadata: {
        type: type || 'proactive',
        sent_at: new Date().toISOString(),
      },
      status: 'sent',
    })

    console.log(`✅ Message proactif envoyé à ${to}`)

    return NextResponse.json({
      status: 'success',
      message: 'Message envoyé',
    })

  } catch (error) {
    console.error('❌ Erreur envoi message:', error)
    return NextResponse.json(
      { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
