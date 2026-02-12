import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createServerClient()

    const { data: alertes, error } = await supabase
      .from('alertes')
      .select('*')
      .eq('statut', 'active')
      .order('priorite', { ascending: true })
      .order('date_creation', { ascending: false })
      .limit(50)

    if (error) throw error

    return NextResponse.json({ alertes })

  } catch (error) {
    console.error('Erreur API alertes:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des alertes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { action } = await request.json()

    if (action === 'generate') {
      // Générer les alertes automatiques
      const { error } = await supabase.rpc('generer_alertes')
      if (error) throw error
      return NextResponse.json({ success: true, message: 'Alertes générées' })
    }

    return NextResponse.json(
      { error: 'Action non reconnue' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Erreur API alertes POST:', error)
    return NextResponse.json(
      { error: 'Erreur lors du traitement' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { id, statut, traite_par } = await request.json()

    if (!id || !statut) {
      return NextResponse.json(
        { error: 'ID et statut requis' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('alertes')
      .update({
        statut,
        traite_par,
        date_traitement: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ alerte: data })

  } catch (error) {
    console.error('Erreur API alertes PATCH:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    )
  }
}
