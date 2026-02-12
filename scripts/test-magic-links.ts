/**
 * Test complet des Magic Links
 * Usage: npx tsx scripts/test-magic-links.ts
 */

async function testMagicLink(question: string, expectedToolName: string) {
    console.log('\n' + '═'.repeat(80))
    console.log('📝 QUESTION:', question)
    console.log('🔧 Tool attendu:', expectedToolName)
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
        console.log(data.response.substring(0, 200) + '...')

        if (data.magicLink) {
            console.log('\n✅ Magic Link généré:', data.magicLink)

            // Extraire le token
            const token = data.magicLink.split('/ml/')[1]
            console.log('🔑 Token:', token?.substring(0, 20) + '...')

            // Tester le Magic Link
            console.log('\n🔍 Test du Magic Link...')
            const mlResponse = await fetch(data.magicLink)

            if (mlResponse.ok) {
                console.log('✅ Magic Link fonctionne (Status:', mlResponse.status, ')')
            } else {
                console.log('❌ Magic Link échoué (Status:', mlResponse.status, ')')
            }
        } else {
            console.log('\n⚠️ Pas de Magic Link généré')
        }

    } catch (error: any) {
        console.error('❌ Exception:', error.message)
    }
}

async function runTests() {
    console.log('🔗 Test Complet des Magic Links\n')

    const tests = [
        { question: 'Quels sont les stocks en alerte ?', tool: 'get_stocks' },
        { question: 'Liste des projets en cours', tool: 'get_projects' },
        { question: 'Incidents ouverts', tool: 'get_incidents' },
        { question: 'Liste des équipements', tool: 'get_equipments' }
    ]

    for (const test of tests) {
        await testMagicLink(test.question, test.tool)
        // Pause entre les tests
        await new Promise(resolve => setTimeout(resolve, 3000))
    }

    console.log('\n' + '═'.repeat(80))
    console.log('✅ Tests terminés')
    console.log('═'.repeat(80))
}

runTests()
