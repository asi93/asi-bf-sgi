/**
 * Script pour tester l'API /api/chat en local
 * Usage: npx tsx scripts/test-chat-api.ts
 */

async function testChatAPI() {
    console.log('🧪 Test de l\'API /api/chat...\n')

    const testMessage = 'Combien de projets en cours ?'

    try {
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: testMessage,
                history: []
            })
        })

        if (!response.ok) {
            console.error('❌ Erreur HTTP:', response.status, response.statusText)
            const text = await response.text()
            console.error('   Réponse:', text)
            return
        }

        const data = await response.json()

        console.log('✅ Réponse reçue:')
        console.log('   Message:', data.response)
        if (data.data) {
            console.log('   Données:', JSON.stringify(data.data).substring(0, 200))
        }
        if (data.action) {
            console.log('   Action:', data.action)
        }
        if (data.error) {
            console.error('   ⚠️ Erreur:', data.error)
        }

    } catch (error: any) {
        console.error('❌ Exception:', error.message)
    }
}

testChatAPI()
