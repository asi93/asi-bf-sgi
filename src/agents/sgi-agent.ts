import { OpenAI } from 'openai'
import { createServerClient } from '@/lib/supabase'
import { tools, openAITools } from '@/lib/ai/tools'
import { createActionMenu, createGreetingResponse } from '@/lib/whatsapp/interactive'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const WHATSAPP_SYSTEM_PROMPT = `Tu es l'assistant SGI d'ASI-Track pour WhatsApp.
Ton rôle est d'aider les chefs de chantier et responsables à accéder aux données et à signaler des événements.

📱 CONTRAINTE WHATSAPP : Réponses concises. Émojis (🔴 🟢 ⚠️ ✅) autorisés.
Pas de tableaux Markdown complexes (illisibles sur mobile).

CONSIGNES DE SÉCURITÉ ET FLUX :
1. Pour "Signaler un incident" ou "Ajouter médias" : NE PAS essayer de le faire via l'IA. 
2. Redirige TOUJOURS vers le MENU INTERACTIF.
3. Réponds : "Pour cette action, veuillez utiliser le menu interactif : [Menu] > [🚨 Signaler un incident] ou [📸 Ajouter médias]".

DOMAINES DE COMPÉTENCE (IA) :
- Analyse financière (Dépenses GIFE, rentabilité)
- Suivi de projet (Statuts, localisation)
- Logistique (Stocks, Imports, BC, Équipements)
- RH (Missions, Candidatures)

TON STYLE : Professionnel, concis, direct.`

const WEB_SYSTEM_PROMPT = `Tu es l'assistant intelligent du SGI ASI-Track.
Tu as accès à l'ensemble des données de gestion de l'entreprise :
- Finances (GIFE, Marchés, Budgets)
- Opérations (Projets, Incidents, Signalements)
- Logistique (Stocks, Équipements, BC, Imports)
- RH (Missions, Recrutement)

Utilise les outils à ta disposition pour répondre précisément aux questions des utilisateurs.
Si une donnée manque, demande des précisions (ex: ID du projet).`

/**
 * Traite une requête utilisateur via l'IA OpenAI
 */
export async function processQuery(query: string, history: any[] = [], phoneNumber?: string) {
  const isWhatsApp = phoneNumber && !phoneNumber.startsWith('WEB_')
  const systemPrompt = isWhatsApp ? WHATSAPP_SYSTEM_PROMPT : WEB_SYSTEM_PROMPT

  // Handle special command for WhatsApp menu
  if (query === '[SHOW_ACTION_MENU]') {
    return {
      response: "Menu d'actions ASI-Track",
      interactive: createActionMenu()
    }
  }

  // Handle common greetings
  const normalizedQuery = query.toLowerCase().trim()
  const greetings = ['bonjour', 'salut', 'hello', 'menu']
  if (greetings.includes(normalizedQuery) && isWhatsApp) {
    return {
      response: "Bonjour ! Je suis l'assistant SGI.",
      interactive: createGreetingResponse()
    }
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-2024-08-06',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: query }
      ],
      tools: openAITools as any,
      tool_choice: 'auto'
    })

    const message = response.choices[0].message

    // Gérer les appels d'outils
    if (message.tool_calls) {
      const toolResults = []

      for (const toolCall of message.tool_calls) {
        const functionName = toolCall.function.name as keyof typeof tools
        const args = JSON.parse(toolCall.function.body || toolCall.function.arguments)

        console.log(`🛠️ Appel outil: ${functionName}`, args)

        try {
          const result = await (tools[functionName] as any)(args, phoneNumber)
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name: functionName,
            content: JSON.stringify(result)
          })
        } catch (error) {
          console.error(`❌ Erreur outil ${functionName}:`, error)
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name: functionName,
            content: JSON.stringify({ error: "Erreur lors de l'exécution" })
          })
        }
      }

      // Générer la réponse finale avec les résultats des outils
      const secondResponse = await openai.chat.completions.create({
        model: 'gpt-4o-2024-08-06',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: query },
          message as any,
          ...toolResults as any
        ]
      })

      return {
        response: secondResponse.choices[0].message.content,
        tool_calls: message.tool_calls
      }
    }

    return {
      response: message.content
    }

  } catch (error) {
    console.error('❌ Erreur processQuery:', error)
    throw error
  }
}
