import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('marches')
      .select('*')
      .order('marche_id', { ascending: true })

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Erreur marches:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
