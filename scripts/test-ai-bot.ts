/**
 * Script de diagnostic pour tester le bot IA
 * Usage: npx tsx scripts/test-ai-bot.ts
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import dotenv from 'dotenv'

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const openaiKey = process.env.OPENAI_API_KEY!

// Créer le client Supabase global pour les tests
const supabase = createClient(supabaseUrl, supabaseKey)

// Mock des outils AI pour les tests (sans dépendance Next.js)
const aiTools = {
    get_projects: async (args: any) => {
        let query = supabase.from('projets').select('*')
        if (args.search) {
            query = query.or(`nom_projet.ilike.%${args.search}%,projet_id.eq.${args.search}`)
        }
        const { data, error } = await query.limit(10)
        if (error) throw error
        return data
    }
}

console.log('🔍 Démarrage du diagnostic du bot IA...\n')

// Test 1: Connexion Supabase
async function testSupabaseConnection() {
    console.log('📡 Test 1: Connexion Supabase')
    try {
        const supabase = createClient(supabaseUrl, supabaseKey)
        const { data, error } = await supabase.from('projets').select('count').single()

        if (error) {
            console.error('❌ Erreur Supabase:', error.message)
            return false
        }

        console.log('✅ Connexion Supabase OK')
        return true
    } catch (err) {
        console.error('❌ Exception:', err)
        return false
    }
}

// Test 2: Lecture de données
async function testDataReading() {
    console.log('\n📊 Test 2: Lecture des données')
    try {
        const supabase = createClient(supabaseUrl, supabaseKey)
        const { data, error } = await supabase
            .from('projets')
            .select('projet_id, nom_projet, statut')
            .limit(5)

        if (error) {
            console.error('❌ Erreur lecture:', error.message)
            return false
        }

        console.log(`✅ ${data?.length || 0} projets trouvés`)
        if (data && data.length > 0) {
            console.log('   Exemple:', data[0].nom_projet)
        }
        return true
    } catch (err) {
        console.error('❌ Exception:', err)
        return false
    }
}

// Test 3: Outil get_projects
async function testGetProjectsTool() {
    console.log('\n🔧 Test 3: Outil get_projects')
    try {
        const result = await aiTools.get_projects({ search: '' })
        console.log(`✅ Outil get_projects OK - ${Array.isArray(result) ? result.length : 0} résultats`)
        if (Array.isArray(result) && result.length > 0) {
            console.log('   Premier projet:', result[0].nom_projet)
        }
        return true
    } catch (err: any) {
        console.error('❌ Erreur outil:', err.message)
        console.error('   Stack:', err.stack)
        return false
    }
}

// Test 4: Appel OpenAI simple
async function testOpenAIConnection() {
    console.log('\n🤖 Test 4: Connexion OpenAI')
    try {
        const openai = new OpenAI({ apiKey: openaiKey })
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: 'Réponds juste "OK"' }],
            max_tokens: 10
        })

        const reply = response.choices[0].message.content
        console.log('✅ OpenAI répond:', reply)
        return true
    } catch (err: any) {
        console.error('❌ Erreur OpenAI:', err.message)
        return false
    }
}

// Test 5: Appel OpenAI avec outil
async function testOpenAIWithTool() {
    console.log('\n🛠️ Test 5: OpenAI avec appel d\'outil')
    try {
        const openai = new OpenAI({ apiKey: openaiKey })

        const messages = [
            {
                role: 'system' as const,
                content: 'Tu es un assistant qui utilise des outils pour répondre aux questions sur les projets.'
            },
            {
                role: 'user' as const,
                content: 'Combien de projets y a-t-il ?'
            }
        ]

        const tools = [{
            type: 'function' as const,
            function: {
                name: 'get_projects',
                description: 'Récupère la liste des projets',
                parameters: {
                    type: 'object',
                    properties: {
                        search: { type: 'string', description: 'Recherche' }
                    }
                }
            }
        }]

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages,
            tools,
            tool_choice: 'auto'
        })

        const message = response.choices[0].message

        if (message.tool_calls && message.tool_calls.length > 0) {
            console.log('✅ OpenAI a demandé l\'outil:', message.tool_calls[0].function.name)

            // Exécuter l'outil
            const toolCall = message.tool_calls[0]
            const args = JSON.parse(toolCall.function.arguments)
            const toolResult = await aiTools.get_projects(args)

            console.log(`✅ Outil exécuté - ${Array.isArray(toolResult) ? toolResult.length : 0} résultats`)

            // Deuxième appel avec le résultat
            const secondMessages = [
                ...messages,
                message,
                {
                    role: 'tool' as const,
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(toolResult)
                }
            ]

            const finalResponse = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: secondMessages
            })

            console.log('✅ Réponse finale:', finalResponse.choices[0].message.content?.substring(0, 100))
            return true
        } else {
            console.log('⚠️ OpenAI n\'a pas appelé d\'outil')
            console.log('   Réponse:', message.content)
            return false
        }
    } catch (err: any) {
        console.error('❌ Erreur:', err.message)
        if (err.response) {
            console.error('   Détails:', err.response.data)
        }
        return false
    }
}

// Exécuter tous les tests
async function runAllTests() {
    const results = {
        supabase: await testSupabaseConnection(),
        dataReading: await testDataReading(),
        getTool: await testGetProjectsTool(),
        openai: await testOpenAIConnection(),
        openaiTool: await testOpenAIWithTool()
    }

    console.log('\n' + '='.repeat(50))
    console.log('📋 RÉSUMÉ DES TESTS')
    console.log('='.repeat(50))
    console.log(`Connexion Supabase:     ${results.supabase ? '✅' : '❌'}`)
    console.log(`Lecture données:        ${results.dataReading ? '✅' : '❌'}`)
    console.log(`Outil get_projects:     ${results.getTool ? '✅' : '❌'}`)
    console.log(`Connexion OpenAI:       ${results.openai ? '✅' : '❌'}`)
    console.log(`OpenAI avec outil:      ${results.openaiTool ? '✅' : '❌'}`)

    const allPassed = Object.values(results).every(r => r)
    console.log('\n' + (allPassed ? '🎉 TOUS LES TESTS PASSENT !' : '⚠️ CERTAINS TESTS ONT ÉCHOUÉ'))

    if (!allPassed) {
        console.log('\n💡 Prochaines étapes:')
        if (!results.supabase || !results.dataReading) {
            console.log('   - Vérifier la configuration Supabase')
            console.log('   - Vérifier les RLS policies')
        }
        if (!results.getTool) {
            console.log('   - Vérifier le code de tools.ts')
            console.log('   - Vérifier createServerClient()')
        }
        if (!results.openai) {
            console.log('   - Vérifier OPENAI_API_KEY')
        }
        if (!results.openaiTool) {
            console.log('   - Vérifier la définition des outils OpenAI')
        }
    }
}

runAllTests().catch(console.error)
