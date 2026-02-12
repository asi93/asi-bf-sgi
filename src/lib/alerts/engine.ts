import { createServerClient } from '@/lib/supabase'
import { Resend } from 'resend'
import { sendWhatsAppMessage } from '@/lib/whatsapp/client'

const resend = new Resend(process.env.RESEND_API_KEY)

interface AlertRule {
    id: string
    type: 'budget' | 'stock' | 'incident'
    condition: (data: any) => boolean
    message: (data: any) => string
    priority: 'high' | 'medium' | 'low'
}

export async function runAlertChecks() {
    const supabase = createServerClient()
    const results = {
        checks: 0,
        alertsCreated: 0,
        notificationsSent: 0,
        errors: [] as string[]
    }

    try {
        // 1. Fetch Operations Data
        const [budgetData, stockData, incidentData] = await Promise.all([
            supabase.from('gife').select('*'),
            supabase.from('stocks').select('*'),
            supabase.from('incidents').select('*').eq('statut', 'ouvert')
        ])

        // 2. Define Rules
        // Rule: Budget > 90%
        const budgetAlerts = (budgetData.data || []).filter(b => {
            const exec = (b.montant_liquide_fcfa / b.montant_engage_fcfa) * 100
            return exec > 90
        }).map(b => ({
            title: 'Alerte Budget',
            message: `Attention: Le budget ${b.ligne_budgetaire} est exécuté à ${Math.round((b.montant_liquide_fcfa / b.montant_engage_fcfa) * 100)}%`,
            type: 'budget',
            priority: 2
        }))

        // Rule: Stock < Seuil Alerte
        const stockAlerts = (stockData.data || []).filter(s => {
            return s.stock_actuel <= s.stock_alerte
        }).map(s => ({
            title: 'Alerte Stock',
            message: `Stock critique: ${s.article} (${s.stock_actuel} restant, seuil: ${s.stock_alerte})`,
            type: 'stock',
            priority: s.stock_actuel === 0 ? 1 : 2
        }))

        // Rule: Incidents non résolus > 48h (simulation)
        const incidentAlerts = (incidentData.data || []).length > 5 ? [{
            title: 'Volume Incidents Élevé',
            message: `${incidentData.data?.length} incidents ouverts nécessitent une attention immédiate.`,
            type: 'incident',
            priority: 1
        }] : []

        const allAlerts = [...budgetAlerts, ...stockAlerts, ...incidentAlerts]
        results.checks = allAlerts.length

        // 3. Process Alerts
        for (const alert of allAlerts) {
            // Check if alert already exists today to avoid spam
            const today = new Date().toISOString().split('T')[0]
            const { data: existing } = await supabase
                .from('alertes')
                .select('id')
                .eq('titre', alert.title)
                .gte('date_creation', today)
                .single()

            if (!existing) {
                // Create Alert in DB
                await supabase.from('alertes').insert({
                    titre: alert.title,
                    message: alert.message,
                    type: alert.type,
                    priorite: alert.priority,
                    statut: 'active',
                    date_creation: new Date().toISOString()
                })
                results.alertsCreated++

                // Send Notifications (if priority is high)
                if (alert.priority <= 2) {
                    // 1. Fetch Email Recipients
                    const { data: emailSubs } = await supabase
                        .from('email_subscriptions')
                        .select('email')
                        .eq('is_active', true)
                        .or(`alert_type.eq.all,alert_type.eq.${alert.type}`)

                    if (emailSubs && emailSubs.length > 0 && process.env.RESEND_API_KEY) {
                        for (const sub of emailSubs) {
                            try {
                                await resend.emails.send({
                                    from: 'ASI-BI <alerts@resend.dev>',
                                    to: sub.email,
                                    subject: `🚨 ${alert.title}`,
                                    html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                                            <h2 style="color: #d32f2f;">${alert.title}</h2>
                                            <p style="font-size: 16px; color: #333;">${alert.message}</p>
                                            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                                            <p style="font-size: 12px; text-align: center; color: #888;">Ceci est une notification automatique de votre assistant ASI-TRACK.</p>
                                           </div>`
                                })
                                results.notificationsSent++
                            } catch (e) {
                                console.error(`Erreur envoi email à ${sub.email}:`, e)
                            }
                        }
                    }

                    // 2. Fetch WhatsApp Recipients
                    const { data: whatsappSubs } = await supabase
                        .from('whatsapp_subscriptions')
                        .select('phone_number')
                        .eq('is_active', true)
                        .or(`alert_type.eq.all,alert_type.eq.${alert.type}`)

                    if (whatsappSubs && whatsappSubs.length > 0 && process.env.WHATSAPP_PHONE_NUMBER_ID) {
                        for (const sub of whatsappSubs) {
                            try {
                                await sendWhatsAppMessage(
                                    sub.phone_number,
                                    process.env.WHATSAPP_PHONE_NUMBER_ID,
                                    `🚨 *${alert.title}*\n\n${alert.message}\n\n_Consultez votre tableau de bord pour plus de détails._`
                                )
                                results.notificationsSent++
                            } catch (e) {
                                console.error(`Erreur envoi WhatsApp à ${sub.phone_number}:`, e)
                            }
                        }
                    }
                }
            }
        }

    } catch (error) {
        console.error('Error running alert checks:', error)
        results.errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    return results
}
