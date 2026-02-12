/**
 * Test complet de l'intelligence du bot avec plusieurs questions
 * Usage: npx tsx scripts/test-ai-complete.ts
 */

async function testQuestion(question: string) {
    console.log('\n' + '═'.repeat(80))
    console.log('📝 QUESTION:', question)
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
        console.log(data.response)

        if (data.magicLink) {
            console.log('\n🔗 Magic Link:', data.magicLink)
        }

    } catch (error: any) {
        console.error('❌ Exception:', error.message)
    }
}

async function runTests() {
    console.log('🧠 Test Complet de l\'Intelligence du Bot IA\n')

    const questions = [
        // Test 1: Question simple avec comparaison attendue
        'Combien de projets en cours ?',

        // Test 2: Question complexe nécessitant analyse
        'Quels sont les projets avec le plus d\'incidents ?',

        // Test 3: Question financière nécessitant insights
        'Quel est le projet avec le taux d\'exécution le plus faible ?'
    ]

    for (const question of questions) {
        await testQuestion(question)
        // Pause entre les questions
        await new Promise(resolve => setTimeout(resolve, 2000))
    }

    console.log('\n' + '═'.repeat(80))
    console.log('✅ Tests terminés')
    console.log('═'.repeat(80))
}

runTests()
