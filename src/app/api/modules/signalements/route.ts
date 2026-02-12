import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const view = searchParams.get('view')
        const id = searchParams.get('id')
        const supabase = createServerClient()

        // 1. Single signalement detail
        if (id) {
            const { data, error } = await supabase
                .from('signalements')
                .select('*')
                .eq('signalement_id', id)
                .single()

            if (error) throw error
            return NextResponse.json({ data })
        }

        // 2. Top 20 view
        if (view === 'top20') {
            const { data, error } = await supabase
                .from('v_top20_signalements')
                .select('*')
                .limit(20)

            if (error) throw error
            return NextResponse.json({ data })
        }

        // 3. Stats view
        if (view === 'stats') {
            const { data, error } = await supabase
                .from('v_stats_signalements')
                .select('*')
                .single()

            if (error) throw error
            return NextResponse.json({ data })
        }

        // 4. Default: all signalements
        const { data, error } = await supabase
            .from('signalements')
            .select('*')
            .order('date_echeance', { ascending: true })

        if (error) throw error
        return NextResponse.json({ data })
    } catch (error) {
        console.error('Erreur signalements:', error)
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const supabase = createServerClient()

        // Generate ID if not provided
        if (!body.signalement_id) {
            const { data: idData } = await supabase.rpc('generate_signalement_id')
            body.signalement_id = idData
        }

        const { data, error } = await supabase
            .from('signalements')
            .insert(body)
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ data })
    } catch (error) {
        console.error('Erreur creation signalement:', error)
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json()
        const { signalement_id, ...updates } = body

        if (!signalement_id) {
            return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
        }

        const supabase = createServerClient()
        const { data, error } = await supabase
            .from('signalements')
            .update(updates)
            .eq('signalement_id', signalement_id)
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ data })
    } catch (error) {
        console.error('Erreur mise à jour signalement:', error)
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}
