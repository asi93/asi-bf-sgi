import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('bons_commande')
      .select('*')
      .order('date_emission', { ascending: false })
      .limit(500)

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Erreur commandes:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
