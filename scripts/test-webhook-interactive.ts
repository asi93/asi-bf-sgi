/**
 * Test de la gestion des réponses interactives
 * Simule les webhooks WhatsApp pour boutons et listes
 * Usage: npx tsx scripts/test-webhook-interactive.ts
 */

// Simuler une réponse de bouton
async function testButtonResponse(buttonId: string, buttonTitle: string) {
    console.log('\n' + '═'.repeat(80))
    console.log('🔘 TEST BOUTON:', buttonTitle)
    console.log('═'.repeat(80))

    const webhookPayload = {
        object: 'whatsapp_business_account',
        entry: [{
            id: 'test-entry',
            changes: [{
                value: {
                    messaging_product: 'whatsapp',
                    metadata: {
                        display_phone_number: '+22670000000',
                        phone_number_id: 'test-phone-id'
                    },
                    messages: [{
                        from: '+22670123456',
                        id: 'test-msg-' + Date.now(),
                        timestamp: String(Math.floor(Date.now() / 1000)),
                        type: 'interactive',
                        interactive: {
                            type: 'button_reply',
                            button_reply: {
                                id: buttonId,
                                title: buttonTitle
                            }
                        }
                    }]
                },
                field: 'messages'
            }]
        }]
    }

    try {
        const response = await fetch('http://localhost:3000/api/whatsapp/webhook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookPayload)
        })

        const data = await response.json()
        console.log('✅ Réponse webhook:', data.status)
        console.log('📝 Message converti attendu:', getExpectedMessage(buttonId))
    } catch (error: any) {
        console.error('❌ Erreur:', error.message)
    }
}

// Simuler une réponse de liste
async function testListResponse(listId: string, listTitle: string) {
    console.log('\n' + '═'.repeat(80))
    console.log('📜 TEST LISTE:', listTitle)
    console.log('═'.repeat(80))

    const webhookPayload = {
        object: 'whatsapp_business_account',
        entry: [{
            id: 'test-entry',
            changes: [{
                value: {
                    messaging_product: 'whatsapp',
                    metadata: {
                        display_phone_number: '+22670000000',
                        phone_number_id: 'test-phone-id'
                    },
                    messages: [{
                        from: '+22670123456',
                        id: 'test-msg-' + Date.now(),
                        timestamp: String(Math.floor(Date.now() / 1000)),
                        type: 'interactive',
                        interactive: {
                            type: 'list_reply',
                            list_reply: {
                                id: listId,
                                title: listTitle
                            }
                        }
                    }]
                },
                field: 'messages'
            }]
        }]
    }

    try {
        const response = await fetch('http://localhost:3000/api/whatsapp/webhook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookPayload)
        })

        const data = await response.json()
        console.log('✅ Réponse webhook:', data.status)
        console.log('📝 Message converti attendu:', getExpectedMessage(listId))
    } catch (error: any) {
        console.error('❌ Erreur:', error.message)
    }
}

function getExpectedMessage(id: string): string {
    if (id === 'stocks') return 'Affiche-moi les stocks disponibles'
    if (id === 'projets') return 'Liste des projets en cours'
    if (id === 'incidents') return 'Incidents ouverts'
    if (id.startsWith('project_')) return `Détails du projet ${id.replace('project_', '')}`
    if (id.startsWith('incident_')) return `Détails de l'incident ${id.replace('incident_', '')}`
    return id
}

async function runTests() {
    console.log('🧪 Test de Gestion des Réponses Interactives\n')

    // Tests boutons
    await testButtonResponse('stocks', '📦 Stocks')
    await new Promise(resolve => setTimeout(resolve, 2000))

    await testButtonResponse('projets', '🏗️ Projets')
    await new Promise(resolve => setTimeout(resolve, 2000))

    await testButtonResponse('incidents', '🚨 Incidents')
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Tests listes
    await testListResponse('project_123', 'Route Tenkodogo')
    await new Promise(resolve => setTimeout(resolve, 2000))

    await testListResponse('incident_456', 'Incident Sécurité')

    console.log('\n' + '═'.repeat(80))
    console.log('✅ Tests terminés')
    console.log('═'.repeat(80))
    console.log('\n💡 Vérifiez les logs du serveur pour voir les conversions')
}

runTests()
