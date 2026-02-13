import { OpenAI } from 'openai'
import { createServerClient } from '@/lib/supabase'
import { tools, openAITools } from '@/lib/ai/tools'
import { createActionMenu, createGreetingResponse } from '@/lib/whatsapp/interactive'
import { generateMagicLink } from '@/lib/magic-links/generator'

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

⚠️ ACTIONS SPÉCIFIQUES (GUIDÉES) :
- Pour "Signaler un incident" ou "Ajouter médias" : NE PAS essayer de le faire via l'IA. 
- Redirige TOUJOURS vers le MENU INTERACTIF.
- Réponds : "Pour cette action, veuillez utiliser le menu interactif : [Menu] > [🚨 Signaler un incident] ou [📸 Ajouter médias]".

📝 FORMAT DE SORTIE (DIFFÉRENT DU WEB) :
- Chiffre clé + 1 insight si critique
- Émojis pour lisibilité mobile (🔴 🟢 ⚠️ ✅)
- Pas de tableaux (cassés sur mobile)
- Format : "12 projets, 8 alertes 🔴. Plus critique: Route X (40% exec vs 65% attendu = -25pts)"

TON STYLE : Professionnel, concis, direct.`



// ═══════════════════════════════════════════════════════════════
// WEB SYSTEM PROMPT - Full Analytical Power + Charts
// ═══════════════════════════════════════════════════════════════
const WEB_SYSTEM_PROMPT = `Tu es l'assistant intelligent du SGI (Système de Gestion Intégré) d'ASI-Track.
Tu aides les directeurs et chefs de chantier à accéder aux données (stocks, finances, projets, incidents).

SCHÉMA DE DONNÉES (RELATIONS IMPORTANTES) :
- projets (projet_id) → gife (projet_id) [dépenses engagées]
- projets (projet_id) → marches (projet_id) [contrats]
- projets (projet_id) → incidents (projet_id)
- projets (projet_id) → signalements (projet_id) [Top 20]

CALCULS FINANCIERS :
- Chiffre d'Affaires (CA) = projets.montant_ht_fcfa
- Dépenses = SUM(gife.montant_liquide_fcfa)
- Marge = CA - Dépenses
- Taux d'exécution = (Dépenses / CA) * 100

RÈGLES STRICTES D'UTILISATION DES OUTILS :
1. **Recherche spécifique** : Si l'utilisateur demande un projet, article ou incident SPÉCIFIQUE, utilise TOUJOURS le paramètre 'search'.

2. **Questions financières** :
   - Pour une analyse financière COMPLÈTE d'un projet → get_project_finances_detailed (CA, dépenses, marchés, marge)
   - Pour un aperçu global → get_finances
   - JAMAIS inventer de chiffres, toujours utiliser les outils

3. **Vue d'ensemble** :
   - Pour un résumé complet d'un projet → get_project_overview
   - Pour des KPIs globaux → get_global_stats

4. **Données volumineuses** : Si les données retournées sont volumineuses (tableaux), fais un résumé très court et précise qu'un lien complet est disponible.

5. **Actions** :
   - Déclarer un incident → Pour WhatsApp, rediriger vers le MENU. Pour le WEB, utiliser create_incident.
   - Créer un signalement Top 20 → Pour WhatsApp, rediriger vers le MENU. Pour le WEB, utiliser create_signalement.

6. **Graphiques** (NOUVEAU) :
   - Pour visualiser des tendances, comparaisons, distributions → generate_chart
   - Types disponibles : bar (comparaisons), line (tendances), pie (répartitions), scatter (corrélations)
   - Exemples : "budgets par projet" → bar chart, "incidents par mois" → line chart, "répartition dépenses" → pie chart

═══════════════════════════════════════════════════════════════
🧠 RÈGLES D'INTELLIGENCE ET D'ANALYSE (PRIORITÉ ABSOLUE)
═══════════════════════════════════════════════════════════════

Tu n'es PAS un simple listeur de données. Tu es un ANALYSTE INTELLIGENT.

📊 RÈGLE 1 : PROUVER CHAQUE AFFIRMATION
❌ INTERDIT : "Ce projet a des alertes critiques"
✅ OBLIGATOIRE : "Ce projet a 8 incidents ouverts (vs moyenne de 3 pour les autres projets)"

→ Chaque chiffre, tendance ou observation DOIT être justifié par des données concrètes.

📈 RÈGLE 2 : ANALYSES COMPARATIVES SYSTÉMATIQUES
Quand tu présentes des données :
- Calcule la MOYENNE des autres éléments similaires
- Identifie les ÉCARTS (en % ou en valeur absolue)
- Mentionne le MIN et MAX si pertinent
- Utilise des termes comparatifs : "40% de moins que", "2x plus que", "en dessous de la moyenne"

Exemple :
❌ "Route Tenkodogo : 180M FCFA dépensés"
✅ "Route Tenkodogo : 180M FCFA dépensés (36% du budget vs 65% en moyenne pour les autres projets = sous-exécution de -29 points)"

💡 RÈGLE 3 : INSIGHTS PROACTIFS OBLIGATOIRES
Après chaque réponse factuelle, AJOUTE une observation :
- 🔴 Alertes/Risques : "⚠️ Attention, ce taux suggère un blocage"
- 🟢 Points positifs : "✅ Bonne maîtrise budgétaire"
- 💡 Suggestions : "Recommandation : audit de ce chantier"
- 📊 Tendances : "Tendance à la hausse depuis 2 mois"

📋 RÈGLE 4 : FORMAT RICHE ET COMPLET
Quand tu listes des projets/stocks/incidents :
- Utilise des TABLEAUX avec TOUTES les colonnes pertinentes
- Ajoute une colonne "Observation" ou "Statut" pour contextualiser
- Inclus les métriques clés même si non demandées explicitement

Exemple pour "projets avec alertes critiques" :
| Projet | Incidents | FE Liquidés | Dépenses | Taux Exec. | Observation |
|--------|-----------|-------------|----------|------------|-------------|
| Route X | 8 🔴 | 12/45 (27%) | 180M | 36% | ⚠️ Sous-exécution sévère |

🎯 RÈGLE 5 : CONTEXTUALISER LES CHIFFRES
Ne jamais donner un chiffre brut sans contexte :
- "12 incidents" → "12 incidents (vs 5 en moyenne)"
- "500M FCFA" → "500M FCFA (2e plus gros budget après Projet Y)"
- "30% d'exécution" → "30% d'exécution (retard de 35 points par rapport au planning)"

📊 RÈGLE 6 : UTILISER LES GRAPHIQUES INTELLIGEMMENT
Quand les données s'y prêtent, propose ou génère un graphique :
- Comparaisons multiples (>3 éléments) → bar chart
- Évolution temporelle → line chart
- Répartitions/proportions → pie chart
- Corrélations → scatter chart

Exemple : "Voici les budgets par projet [génère bar chart]. On observe que Route X représente 35% du budget total."

═══════════════════════════════════════════════════════════════

Toujours en Français, professionnel mais ANALYTIQUE. Ne te limite pas à 3-4 lignes si l'analyse le justifie.`

// Formater les montants en FCFA
function fmtFCFA(montant: number | null | undefined): string {
  if (!montant && montant !== 0) return '0 FCFA'
  return new Intl.NumberFormat('fr-FR').format(Math.round(montant)) + ' FCFA'
}


export interface AIResponse {
  response: string
  data?: any
  action?: string
  interactive?: any
  error?: string
  tool_calls?: any
}

// Formater la date
function fmtDate(date: string | null): string {
  if (!date) return '-'
  try {
    return new Date(date).toLocaleDateString('fr-FR')
  } catch {
    return date
  }
}

// Détection de mots-clés pour routage intelligent
interface DetectedIntent {
  module: string
  action: string
  filters: Record<string, string>
}

function detectIntent(message: string): DetectedIntent {
  const msg = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  // Projets
  if (msg.includes('projet') || msg.includes('chantier') || msg.includes('ouvrage')) {
    const filters: Record<string, string> = {}
    if (msg.includes('en cours')) filters.statut = 'En cours'
    if (msg.includes('acheve') || msg.includes('termine')) filters.statut = 'Achevé'
    if (msg.includes('suspendu')) filters.statut = 'Suspendu'
    if (msg.includes('burkina')) filters.pays = 'Burkina Faso'
    if (msg.includes('benin')) filters.pays = 'Bénin'
    if (msg.includes('togo')) filters.pays = 'Togo'
    if (msg.includes('niger')) filters.pays = 'Niger'
    if (msg.includes('mali')) filters.pays = 'Mali'
    return { module: 'projets', action: msg.includes('combien') || msg.includes('nombre') ? 'count' : 'list', filters }
  }

  // Stocks
  if (msg.includes('stock') || msg.includes('inventaire') || msg.includes('article') || msg.includes('tuyau') || msg.includes('vanne') || msg.includes('pompe')) {
    if (msg.includes('critique') || msg.includes('alerte') || msg.includes('rupture')) {
      return { module: 'stocks', action: 'alerte', filters: {} }
    }
    return { module: 'stocks', action: 'list', filters: {} }
  }

  // Equipements
  if (msg.includes('equipement') || msg.includes('vehicule') || msg.includes('engin') || msg.includes('camion') || msg.includes('pick-up') || msg.includes('parc')) {
    if (msg.includes('maintenance') || msg.includes('panne')) {
      return { module: 'equipements', action: 'maintenance', filters: {} }
    }
    if (msg.includes('visite technique')) {
      return { module: 'equipements', action: 'visite', filters: {} }
    }
    return { module: 'equipements', action: 'list', filters: {} }
  }

  // Finances / Budget / GIFE
  if (msg.includes('financ') || msg.includes('budget') || msg.includes('execution') || msg.includes('engage') || msg.includes('liquide') || msg.includes('depense') || msg.includes('gife')) {
    if (msg.includes('taux') || msg.includes('execution')) {
      return { module: 'finances', action: 'taux', filters: {} }
    }
    return { module: 'finances', action: 'resume', filters: {} }
  }

  // Incidents
  if (msg.includes('incident') || msg.includes('accident') || msg.includes('sinistre') || msg.includes('probleme')) {
    if (msg.includes('ouvert') || msg.includes('non resolu') || msg.includes('actif')) {
      return { module: 'incidents', action: 'ouverts', filters: {} }
    }
    return { module: 'incidents', action: 'list', filters: {} }
  }

  // Assurances
  if (msg.includes('assurance') || msg.includes('police') || msg.includes('expir') || msg.includes('echeance') || msg.includes('renouvel')) {
    if (msg.includes('expir') || msg.includes('echeance') || msg.includes('renouvel')) {
      return { module: 'assurances', action: 'expiration', filters: {} }
    }
    return { module: 'assurances', action: 'list', filters: {} }
  }

  // Marchés
  if (msg.includes('marche') || msg.includes('contrat') || msg.includes('gesma')) {
    return { module: 'marches', action: 'list', filters: {} }
  }

  // Missions
  if (msg.includes('mission') || msg.includes('deplacement') || msg.includes('voyage') || msg.includes('giom')) {
    return { module: 'missions', action: 'list', filters: {} }
  }

  // Commandes
  if (msg.includes('commande') || msg.includes('fournisseur') || msg.includes('achat') || msg.includes('bon de commande') || msg.includes('gic')) {
    return { module: 'commandes', action: 'list', filters: {} }
  }

  // Imports
  if (msg.includes('import') || msg.includes('douane') || msg.includes('transit') || msg.includes('conteneur')) {
    return { module: 'imports', action: 'list', filters: {} }
  }

  // RH / Candidatures
  if (msg.includes('candidat') || msg.includes('recrutement') || msg.includes('embauche') || msg.includes('rh') || msg.includes('ressource') || msg.includes('gide')) {
    return { module: 'candidatures', action: 'list', filters: {} }
  }

  // Signalements (Incident Reporting)
  if (msg.includes('signalement') || msg.includes('signaler') || msg.includes('top 20') || msg.includes('top20')) {
    if (msg.includes('top 20') || msg.includes('top20')) {
      return { module: 'signalements', action: 'top20', filters: {} }
    }
    if (msg.includes('creer') || msg.includes('nouveau') || msg.includes('signaler')) {
      return { module: 'signalements', action: 'create', filters: {} }
    }
    if (msg.includes('mettre a jour') || msg.includes('modifier') || msg.includes('update')) {
      return { module: 'signalements', action: 'update', filters: {} }
    }
    return { module: 'signalements', action: 'list', filters: {} }
  }

  // Stats globales
  if (msg.includes('stat') || msg.includes('resume') || msg.includes('global') || msg.includes('tableau') || msg.includes('synthese') || msg.includes('kpi')) {
    return { module: 'stats', action: 'global', filters: {} }
  }

  // Par défaut: stats globales
  return { module: 'unknown', action: 'unknown', filters: {} }
}


/**
 * Traite une requête utilisateur via l'IA OpenAI
 */
export async function processQuery(query: string, history: any[] = [], phoneNumber?: string): Promise<AIResponse> {
  let userMessage = query
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
    // Détection des salutations simples → Menu principal
    const normalizedMsg = userMessage.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const isSimpleGreeting = greetings.some(g => normalizedMsg === g || normalizedMsg === g + '!')

    if (isSimpleGreeting) {
      console.log('👋 [AI Agent] Greeting detected, showing greeting with menu button')
      return {
        response: "Bonjour ! Je suis l'assistant SGI.",
        interactive: createGreetingResponse()
      }
    }

    // Détection du clic sur bouton "Menu" → Afficher menu d'actions
    if (userMessage === '[SHOW_ACTION_MENU]') {
      console.log('📋 [AI Agent] Showing action menu')
      return {
        response: "Voici les actions rapides disponibles :",
        interactive: createActionMenu()
      }
    }

    // === HANDLERS MENU ACTIONS ===

    // 🚨 INCIDENTS - Liste complète
    if (userMessage.includes('Affiche la liste complète des incidents')) {
      console.log('📋 [AI Agent] Generating Magic Link for incidents list')
      const magicLink = await generateMagicLink({
        resourceType: 'custom',
        phoneNumber,
        expiryHours: 48,
        metadata: {
          title: 'Liste des Incidents',
          description: 'Tous les incidents signalés',
          customRoute: '/signalements'
        }
      })

      return {
        response: `📊 **Liste des Incidents**\n\nConsultez tous les incidents signalés :\n\n${magicLink.url}\n\n_Lien valide 48h_`,
        data: { magicLink: magicLink.url }
      }
    }

    // 📸 GALERIE - Photos par projet
    if (userMessage.includes('Affiche la galerie des photos par projet')) {
      console.log('📸 [AI Agent] Generating Magic Link for gallery')
      const magicLink = await generateMagicLink({
        resourceType: 'custom',
        phoneNumber,
        expiryHours: 48,
        metadata: {
          title: 'Galerie Photos',
          description: 'Photos des incidents par projet',
          customRoute: '/gallery'
        }
      })

      return {
        response: `📸 **Galerie Photos**\n\nAccédez à la galerie complète :\n\n${magicLink.url}\n\n_Lien valide 48h_`,
        data: { magicLink: magicLink.url }
      }
    }

    // 📄 DOCUMENTS - Par projet (placeholder)
    if (userMessage.includes('Affiche les documents du projet')) {
      return {
        response: `📄 **Documents Projet**\n\n⚠️ Fonctionnalité en cours de développement.\n\nEn attendant, vous pouvez :\n• Demander un projet spécifique\n• Consulter les rapports financiers`,
        data: { status: 'coming_soon' }
      }
    }

    // 📊 KPIs - Vue d'ensemble globale
    if (userMessage.includes('Montre-moi les KPIs globaux')) {
      // Laisser l'AI traiter avec ses outils
      userMessage = 'Donne-moi une vue d\'ensemble complète : nombre de projets actifs, budget total, dépenses totales, incidents ouverts, niveau des stocks critiques'
    }

    // Action: KPIs globaux
    if (userMessage === 'action_kpis') {
      userMessage = 'Donne-moi une vue d\'ensemble complète des KPIs : projets, finances, stocks, équipements, incidents, et alertes.'
    }

    // Action: Projets en cours
    if (userMessage === 'action_projets' || userMessage === 'Affiche les projets en cours') {
      userMessage = 'Liste les projets en cours avec leur avancement et statut'
    }

    // Action: Stocks et alertes
    if (userMessage === 'action_stocks' || userMessage === 'Affiche les stocks et alertes') {
      userMessage = 'Quels articles sont en stock critique ou en alerte? Montre les stocks faibles.'
    }

    // Action: Analyse financière
    if (userMessage === 'action_gife' || userMessage === 'Analyse financière globale') {
      userMessage = 'Analyse financière globale : budgets totaux, dépenses engagées et liquidées, taux d\'exécution moyen'
    }

    // Action: Insights IA
    if (userMessage === 'action_insights_ia') {
      try {
        // Fetch stats
        const supabase = createServerClient()
        const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/stats`)
        if (!statsResponse.ok) throw new Error('Failed to fetch stats')
        const { stats } = await statsResponse.json()

        // Fetch insights
        const insightsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/insights/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stats })
        })
        if (!insightsResponse.ok) throw new Error('Failed to fetch insights')
        const { insights } = await insightsResponse.json()

        // Format pour WhatsApp (top 3)
        const top3 = insights.slice(0, 3)
        const emojis = { critical: '🔴', warning: '🟠', info: '🔵', success: '🟢' }

        let msg = '💡 *Insights IA*\n\n'
        top3.forEach((insight: any, idx: number) => {
          msg += `${idx + 1}. ${emojis[insight.type as keyof typeof emojis]} *${insight.title}*\n`
          msg += `   ${insight.message}\n`
          if (insight.action) {
            msg += `   ▸ ${insight.action.label}\n`
          }
          msg += '\n'
        })
        msg += '\n_Analyses générées par IA_'

        return { response: msg }
      } catch (error) {
        console.error('[WhatsApp] Insights error:', error)
        return { response: '❌ Impossible de récupérer les insights IA pour le moment.' }
      }
    }

    // Action: Timeline Risques
    if (userMessage === 'action_timeline_risques') {
      try {
        // Fetch timeline
        const timelineResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/timeline/predict`)
        if (!timelineResponse.ok) throw new Error('Failed to fetch timeline')
        const { events } = await timelineResponse.json()

        if (!events || events.length === 0) {
          return { response: '📅 *Radar - Alertes*\n\n🟢 Aucun événement critique détecté.\n\n_Le système fonctionne normalement._' }
        }

        // Grouper par timeframe
        const urgent = events.filter((e: any) => e.timeframe === '0-3j')
        const attention = events.filter((e: any) => e.timeframe === '3-7j')
        const surveiller = events.filter((e: any) => e.timeframe === '7-15j')

        let msg = '📅 *Radar - Prochains 30 jours*\n\n'

        if (urgent.length > 0) {
          msg += '🔴 *URGENT (0-3 jours)*\n'
          urgent.slice(0, 3).forEach((event: any) => {
            msg += `• ${event.title}\n`
            if (event.impact.operational) {
              msg += `  ${event.impact.operational}\n`
            }
          })
          msg += '\n'
        }

        if (attention.length > 0) {
          msg += '🟠 *ATTENTION (3-7 jours)*\n'
          attention.slice(0, 3).forEach((event: any) => {
            msg += `• ${event.title}\n`
          })
          msg += '\n'
        }

        if (surveiller.length > 0 && (urgent.length + attention.length) < 4) {
          msg += '🟡 *SURVEILLER (7-15 jours)*\n'
          surveiller.slice(0, 2).forEach((event: any) => {
            msg += `• ${event.title}\n`
          })
          msg += '\n'
        }

        msg += `\n_${events.length} événement(s) détecté(s)_`

        return { response: msg }
      } catch (error) {
        console.error('[WhatsApp] Timeline error:', error)
        return { response: '❌ Impossible de récupérer la timeline pour le moment.' }
      }
    }

    // 💰 KPIs Finances
    if (userMessage.includes('Affiche les KPIs financiers')) {
      userMessage = 'Analyse financière globale : budgets totaux, dépenses engagées et liquidées, taux d\'exécution moyen, projets en dépassement'
    }

    // 🏗️ KPIs Opérations
    if (userMessage.includes('Affiche les KPIs opérationnels')) {
      userMessage = 'KPIs opérationnels : avancement moyen des projets, projets en retard, délais critiques'
    }

    // 🚨 KPIs Sécurité
    if (userMessage.includes('Affiche les KPIs de sécurité')) {
      userMessage = 'Analyse sécurité : nombre d\'incidents ouverts vs résolus, incidents par type, zones à risque, tendances'
    }

    // 📦 KPIs Ressources
    if (userMessage.includes('Affiche les KPIs ressources')) {
      userMessage = 'État des ressources : stocks en alerte, articles critiques, disponibilité véhicules et équipements'
    }

    console.log(`🤖 Using ${isWhatsApp ? 'WHATSAPP' : 'WEB'} prompt`)
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-2024-08-06',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userMessage }
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
        const args = JSON.parse(toolCall.function.arguments)

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
          { role: 'user', content: userMessage },
          message as any,
          ...toolResults as any
        ]
      })

      return {
        response: secondResponse.choices[0].message.content || "",
        tool_calls: message.tool_calls
      }
    }

    return {
      response: message.content || ""
    }

  } catch (error) {
    console.error('❌ Erreur processQuery:', error)
    throw error
  }
}
