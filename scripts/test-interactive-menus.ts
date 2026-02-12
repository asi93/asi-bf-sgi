/**
 * Test des menus interactifs WhatsApp
 * Usage: npx tsx scripts/test-interactive-menus.ts
 */

async function testInteractiveMenu(question: string, expectedType: 'greeting' | 'list' | 'none') {
    console.log('\n' + '═'.repeat(80))
    console.log('📝 QUESTION:', question)
    console.log('🎯 Type attendu:', expectedType)
    console.log('═'.repeat(80))

    try {
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: question,
                history: []
            })
        })

        if (!response.ok) {
            console.error('❌ Erreur HTTP:', response.status)
            return
        }

        const data = await response.json()

        console.log('\n🤖 RÉPONSE:')
        console.log(data.response.substring(0, 150) + '...')

        if (data.interactive) {
            console.log('\n✅ Menu interactif généré!')
            console.log('📋 Type:', data.interactive.type)

            if (data.interactive.type === 'button') {
                console.log('🔘 Boutons:', data.interactive.action.buttons?.length || 0)
                data.interactive.action.buttons?.forEach((btn: any, i: number) => {
                    console.log(`   ${i + 1}. ${btn.reply.title} (ID: ${btn.reply.id})`)
                })
            } else if (data.interactive.type === 'list') {
                console.log('📜 Sections:', data.interactive.action.sections?.length || 0)
                data.interactive.action.sections?.forEach((section: any) => {
                    console.log(`   - ${section.title}: ${section.rows.length} items`)
                })
            }
        } else {
            console.log('\n⚠️ Pas de menu interactif (réponse texte uniquement)')
        }

    } catch (error: any) {
        console.error('❌ Exception:', error.message)
    }
}

async function runTests() {
    console.log('🎮 Test des Menus Interactifs WhatsApp\n')

    const tests = [
        { question: 'Bonjour', expectedType: 'greeting' as const },
        { question: 'menu', expectedType: 'greeting' as const },
        { question: 'Liste des projets en cours', expectedType: 'list' as const },
        { question: 'Incidents ouverts', expectedType: 'list' as const },
        { question: 'Quel est le budget total ?', expectedType: 'none' as const }
    ]

    for (const test of tests) {
        await testInteractiveMenu(test.question, test.expectedType)
        // Pause entre les tests
        await new Promise(resolve => setTimeout(resolve, 3000))
    }

    console.log('\n' + '═'.repeat(80))
    console.log('✅ Tests terminés')
    console.log('═'.repeat(80))
}

runTests()

export { }
