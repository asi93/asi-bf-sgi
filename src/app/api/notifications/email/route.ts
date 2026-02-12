/**
 * API Route pour envoyer des notifications email
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email/client'
import { EmailTemplates } from '@/lib/email/templates'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, to, data } = body

    if (!type || !to) {
      return NextResponse.json(
        { error: 'Paramètres "type" et "to" requis' },
        { status: 400 }
      )
    }

    let subject = ''
    let html = ''

    // Générer email selon le type
    switch (type) {
      case 'daily_report':
        subject = `☀️ Rapport Quotidien ASI-BF - ${data.date}`
        html = EmailTemplates.rapportQuotidien(data)
        break

      case 'weekly_report':
        subject = `📊 Rapport Hebdomadaire - Semaine ${data.semaine}`
        html = EmailTemplates.rapportHebdomadaire(data)
        break

      case 'stock_alert':
        subject = '🚨 Alerte Stock Critique'
        html = EmailTemplates.alerteStockCritique(data.articles)
        break

      case 'budget_alert':
        subject = `🔴 Dépassement Budget ${data.module}`
        html = EmailTemplates.alerteBudget(data)
        break

      case 'maintenance_alert':
        subject = '⚠️ Alertes Maintenance Véhicules'
        html = EmailTemplates.alerteMaintenance(data.equipements)
        break

      default:
        return NextResponse.json(
          { error: `Type "${type}" non reconnu` },
          { status: 400 }
        )
    }

    // Envoyer l'email
    await sendEmail({
      to,
      subject,
      html,
    })

    console.log(`✅ Email "${type}" envoyé à ${to}`)

    return NextResponse.json({
      status: 'success',
      message: 'Email envoyé',
      type,
    })

  } catch (error) {
    console.error('❌ Erreur envoi email:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
