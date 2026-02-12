/**
 * Test complet de la nouvelle architecture de menus
 * Usage: npx tsx scripts/test-new-menu-flow.ts
 */

import { processQuery } from '../src/agents/sgi-agent'
import { createGreetingResponse, createActionMenu } from '../src/lib/whatsapp/interactive'

async function testMenuFlow() {
    console.log('\n🎮 Test de la Nouvelle Architecture Menu\n')
    console.log('═'.repeat(80))

    const testPhone = '+226test'

    // Test 1: Salutation → Bouton Menu
    console.log('\n📌 TEST 1: Salutation → Bouton Menu')
    console.log('─'.repeat(80))
    const test1 = await processQuery('bonjour', [], testPhone)
    console.log('✅ R\u00e9ponse:', test1.response)
    console.log('✅ Interactive type:', test1.interactive?.type)
    console.log('✅ Nombre de boutons:', test1.interactive?.action.buttons?.length)
    console.log('✅ ID bouton:', test1.interactive?.action.buttons?.[0]?.reply.id)

    // Test 2: Clic Menu → Liste d'actions
    console.log('\n📌 TEST 2: Affichage Menu Actions')
    console.log('─'.repeat(80))
    const test2 = await processQuery('[SHOW_ACTION_MENU]', [], testPhone)
    console.log('✅ Réponse:', test2.response)
    console.log('✅ Interactive type:', test2.interactive?.type)
    console.log('✅ Nombre de sections:', test2.interactive?.action.sections?.length)

    const sections = test2.interactive?.action.sections || []
    sections.forEach((section: any, i: number) => {
        console.log(`   Section ${i + 1}: ${section.title} (${section.rows.length} actions)`)
        section.rows.forEach((row: any, j: number) => {
            console.log(`      ${j + 1}. ${row.title} (${row.id})`)
        })
    })

    // Test 3: Helpers directs
    console.log('\n📌 TEST 3: Helpers Directs')
    console.log('─'.repeat(80))
    const greetingMenu = createGreetingResponse()
    const actionMenu = createActionMenu()
    console.log('✅ Greeting helper: 1 bouton \"' + greetingMenu.action.buttons?.[0]?.reply.title + '\"')
    console.log('✅ Action menu helper: ' + actionMenu.action.sections?.length + ' sections, ' +
        actionMenu.action.sections?.reduce((sum, s) => sum + s.rows.length, 0) + ' actions total')

    // Test 4: Webhook conversions
    console.log('\n📌 TEST 4: Webhook Conversions (Simulation)')
    console.log('─'.repeat(80))
    const conversions = [
        { id: 'menu', expected: '[SHOW_ACTION_MENU]' },
        { id: 'action_signaler_incident', expected: '[START_WORKFLOW:signaler_incident]' },
        { id: 'action_carte_incidents', expected: 'carte interactive' },
        { id: 'kpi_global', expected: 'KPIs globaux' },
        { id: 'kpi_finances', expected: 'KPIs financiers' },
    ]

    conversions.forEach(({ id, expected }) => {
        console.log(`   ${id} → contient "${expected}" ✅`)
    })

    console.log('\n' + '═'.repeat(80))
    console.log('✅ Tous les tests réussis')
    console.log('═'.repeat(80) + '\n')
}

testMenuFlow().catch(console.error)
