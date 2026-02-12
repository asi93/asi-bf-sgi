import { NextRequest, NextResponse } from 'next/server'
import { processQueryWithAI } from '@/agents/sgi-agent'

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message requis' },
        { status: 400 }
      )
    }

    // Utiliser le MÊME orchestrateur IA que WhatsApp (Sprint 14)
    const result = await processQueryWithAI(message, '', history || [])

    return NextResponse.json({
      response: result.response,
      data: result.data,
      action: result.action,
    })

  } catch (error) {
    console.error('Erreur API chat:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
