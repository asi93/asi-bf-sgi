/**
 * Test de l'IA avec une question complexe
 * Usage: npx tsx scripts/test-ai-intelligence.ts
 */

async function testAIIntelligence() {
    console.log('🧠 Test de l\'intelligence du bot IA...\n')

    const complexQuestion = 'Quels sont les projets en cours avec le plus d\'incidents ouverts ?'

    try {
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: complexQuestion,
                history: []
            })
        })

        if (!response.ok) {
            console.error('❌ Erreur HTTP:', response.status)
            const text = await response.text()
            console.error('   Réponse:', text)
            return
        }

        const data = await response.json()

        console.log('📝 Question:', complexQuestion)
        console.log('\n🤖 Réponse du bot:')
        console.log('─'.repeat(80))
        console.log(data.response)
        console.log('─'.repeat(80))

        if (data.data) {
            console.log('\n📊 Données brutes:', JSON.stringify(data.data, null, 2).substring(0, 500))
        }

    } catch (error: any) {
        console.error('❌ Exception:', error.message)
    }
}

testAIIntelligence()
