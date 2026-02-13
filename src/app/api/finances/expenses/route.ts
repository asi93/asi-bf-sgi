import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendEmail, createBaseEmailTemplate } from '@/lib/email/client'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { projet_id, montant, libelle, type_depense } = body

        if (!projet_id || !montant) {
            return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
        }

        const supabase = createServerClient()

        // 1. Get Project Name
        const { data: projet } = await supabase
            .from('projets')
            .select('nom_projet')
            .eq('projet_id', projet_id)
            .single()

        const projetNom = projet?.nom_projet || 'Projet Inconnu'

        // 2. Insert Expense (GIFE)
        const { data, error } = await supabase
            .from('gife')
            .insert({
                projet_id,
                montant_engage_fcfa: montant, // Assume engagement by default
                description_evenement: libelle || 'Nouvelle dépense',
                date_operation: new Date().toISOString(),
                // Add other required fields if necessary (defaults)
            })
            .select()
            .single()

        if (error) {
            console.error('Erreur insertion dépense:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // 3. Send Alert Email
        if (process.env.RESEND_API_KEY) {
            const formattedAmount = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(montant)

            const emailHtml = createBaseEmailTemplate(
                '💰 Nouvelle Dépense Engagée',
                `
                <div class="stat-box">
                  <p><strong>Projet:</strong> ${projetNom}</p>
                  <p><strong>Montant:</strong> <span style="font-size: 1.2em; color: green;">${formattedAmount}</span></p>
                  <p><strong>Libellé:</strong> ${libelle || 'N/A'}</p>
                  <p><strong>Type:</strong> ${type_depense || 'Engagement'}</p>
                </div>
                <p>Une nouvelle dépense a été enregistrée dans le système.</p>
                <p><a href="https://asi-bi.netlify.app/finances?projet=${projet_id}" class="button">Voir les finances</a></p>
                `,
                'Notification de Dépense'
            )

            await sendEmail({
                to: ['asibfmail@gmail.com'],
                subject: `[FINANCES] Nouvelle Dépense - ${projetNom}`,
                html: emailHtml
            })
        }

        return NextResponse.json({ success: true, data })

    } catch (error) {
        console.error('Erreur API Dépense:', error)
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}
