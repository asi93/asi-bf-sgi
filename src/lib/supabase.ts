import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client pour le côté client (browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const createBrowserClient = () => createClient(supabaseUrl, supabaseAnonKey)

// Client pour le côté serveur avec service role (admin)
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Fonction utilitaire pour exécuter des requêtes SQL directes
export async function executeQuery(sql: string) {
  const client = createServerClient()
  const { data, error } = await client.rpc('execute_sql', { query: sql })
  if (error) throw error
  return data
}
