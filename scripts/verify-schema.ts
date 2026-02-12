
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifySchema() {
    console.log('🔍 Verifying signalements table schema...')

    // We can't directly query information_schema easily with js client without sql function usually,
    // but we can try to insert a dummy record and see if it fails on missing columns, 
    // OR just check if we can select the columns.

    const { data, error } = await supabase
        .from('signalements')
        .select('categorie, gravite, photo_url')
        .limit(1)

    if (error) {
        console.error('❌ Schema verification failed:', error.message)
        console.log('   The columns (categorie, gravite, photo_url) might be missing.')
        return
    }

    console.log('✅ Columns exist! Query returned successfully.')
    console.log('✅ Schema verification passed.')
}

verifySchema()
