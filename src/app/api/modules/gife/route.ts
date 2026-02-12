import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('gife')
      .select('*')
      .order('gife_id', { ascending: true })
      .limit(500)

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Erreur gife:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
