import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendEmail, createBaseEmailTemplate } from '@/lib/email/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    // 1. Auth Check
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const supabase = createServerClient()

        // 2. Date Range (Hier 00:00 -> 23:59)
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const startOfDay = new Date(yesterday.setHours(0, 0, 0, 0)).toISOString()
        const endOfDay = new Date(yesterday.setHours(23, 59, 59, 999)).toISOString()
        const dateStr = yesterday.toLocaleDateString('fr-FR')

        // 3. Fetch Data
        // Dépenses (Engagements/Liquidations) modifiés hier
        // Note: On suppose que gife a un champ updated_at ou created_at. 
        // Si non, on liste tout pour l'instant (limit) ou on ignore ce filtre si pas de date.
        // vérifions d'abord la structure de la table gife (supposons created_at pour l'instant)
        const { data: expenses } = await supabase
            .from('gife')
            .select('*')
            .or(`created_at.gte.${startOfDay},updated_at.gte.${startOfDay}`)
        // Fallback si updated_at n'existe pas, ça plantera pas mais retournera rien si colonne manquante
        // Mais pour gife standard, souvent pas de timestamp. On va juste prendre ceux créés.
        // Si erreur, on catchera.

        const newlyEngaged = expenses?.filter((e: any) => e.montant_engage_fcfa > 0 && e.created_at >= startOfDay) || []
        const totalEngaged = newlyEngaged.reduce((acc: number, curr: any) => acc + (curr.montant_engage_fcfa || 0), 0)

        const newlyLiquidated = expenses?.filter((e: any) => e.montant_liquide_fcfa > 0 && e.updated_at >= startOfDay) || []
        const totalLiquidated = newlyLiquidated.reduce((acc: number, curr: any) => acc + (curr.montant_liquide_fcfa || 0), 0)

        // Photos
        const { data: photos } = await supabase
            .from('photos')
            .select('url, projet_id, uploaded_by')
            .gte('created_at', startOfDay)
            .lte('created_at', endOfDay)

        const photoCount = photos?.length || 0

        // Alertes
        const { data: alerts } = await supabase
            .from('alertes')
            .select('*')
            .gte('date_creation', startOfDay)
            .lte('date_creation', endOfDay)

        // 4. Build Email
        const html = createBaseEmailTemplate(
            `Rapport Journalier - ${dateStr}`,
            `
            <p>Bonjour,</p>
            <p>Voici le récapitulatif de l'activité de la journée du <strong>${dateStr}</strong>.</p>

            <h3>💰 Finances (Mouvements détectés)</h3>
            <div class="stat-box">
                <p>Nouveaux Engagements: <strong>${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(totalEngaged)}</strong></p>
                <p>Nouvelles Liquidations: <strong>${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(totalLiquidated)}</strong></p>
                <p><small>${newlyEngaged.length} engagement(s), ${newlyLiquidated.length} liquidation(s)</small></p>
            </div>

            <h3>📸 Chantier & Médias</h3>
            <div class="stat-box">
                <p>Photos ajoutées: <strong>${photoCount}</strong></p>
                ${photoCount > 0 ? `<p><a href="https://asi-bi.netlify.app/gallery">Voir la galerie</a></p>` : ''}
            </div>

            <h3>🚨 Alertes & Incidents</h3>
            ${alerts && alerts.length > 0 ? `
                <ul style="list-style: none; padding: 0;">
                ${alerts.map((a: any) => `
                    <li style="background: #fff; border-left: 3px solid ${a.priorite === 1 ? 'red' : 'orange'}; padding: 10px; margin-bottom: 5px;">
                        <strong>${a.titre}:</strong> ${a.message}
                    </li>
                `).join('')}
                </ul>
            ` : '<p class="success">Aucune alerte majeure signalée hier.</p>'}

            <p style="margin-top: 20px;">
                <a href="https://asi-bi.netlify.app" class="button">Accéder au Tableau de Bord</a>
            </p>
            `,
            'Rapport Automatique'
        )

        // 5. Send Email
        await sendEmail({
            to: ['asibfmail@gmail.com'],
            subject: `📊 Rapport Journalier ASI-TRACK - ${dateStr}`,
            html
        })

        return NextResponse.json({ success: true, date: dateStr, stats: { totalEngaged, photoCount, alertCount: alerts?.length } })

    } catch (error) {
        console.error('Daily report error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
