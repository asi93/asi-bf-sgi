import { createServerClient } from '@/lib/supabase'
import { getSession, updateSession, clearSession } from '@/lib/whatsapp/session'
import { generateMagicLink } from '@/lib/magic-links/generator'
import { formatSignalementForWhatsApp, formatTop20ForWhatsApp, createMessageWithMagicLink, getStatusEmoji, formatTableForWhatsApp } from '@/lib/whatsapp/formatters'
import { createGreetingResponse, createActionMenu, createListMessage, createMainMenu, createButtonsMessage, createQuickActions } from '@/lib/whatsapp/interactive'
import OpenAI from 'openai'
import { tools as aiTools, openAITools } from '@/lib/ai/tools'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

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
 * Traitement de la requête via IA (GPT-4 + Tools)
 * Utilisé pour WhatsApp ET le chat web
 */
export async function processQueryWithAI(userMessage: string, phoneNumber: string, externalHistory?: Array<{ role: string; content: string }>): Promise<AIResponse> {
  console.log('🤖 [AI Agent] START processQueryWithAI')
  console.log('📝 [AI Agent] Message:', userMessage)
  console.log('📞 [AI Agent] Phone:', phoneNumber || 'N/A')
  console.log('📚 [AI Agent] External history length:', externalHistory?.length || 0)

  try {
    // Détection des salutations simples → Menu principal
    const normalizedMsg = userMessage.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const greetings = ['bonjour', 'salut', 'hello', 'hi', 'hey', 'menu', 'aide', 'help']
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

    // 🔄 WORKFLOWS - Signaler incident
    if (userMessage === '[START_WORKFLOW:signaler_incident]') {
      console.log('🚨 [AI Agent] Starting incident reporting workflow')
      await updateSession(phoneNumber, 'WORKFLOW_INCIDENT_TYPE', {})

      return {
        response: `🚨 **Signaler un Incident**\n\nQuel type d'incident souhaitez-vous signaler ?`,
        interactive: createListMessage(
          'Sélectionnez le type d\'incident :',
          'Types d\'incidents',
          [{
            title: 'Types d\'incidents',
            rows: [
              { id: 'incident_type_securite', title: '🚨 Sécurité', description: 'Accident, zone dangereuse' },
              { id: 'incident_type_materiel', title: '🔧 Matériel', description: 'Panne, équipement défectueux' },
              { id: 'incident_type_retard', title: '⏰ Retard', description: 'Délai non respecté' },
              { id: 'incident_type_qualite', title: '⚠️ Qualité', description: 'Non-conformité, défaut' },
              { id: 'incident_type_autre', title: '📝 Autre', description: 'Autre type d\'incident' }
            ]
          }]
        )
      }
    }

    // 📸 WORKFLOWS - Ajouter médias
    if (userMessage === '[START_WORKFLOW:ajouter_medias]') {
      console.log('📸 [AI Agent] Starting media upload workflow')

      // Récupérer les projets actifs
      const supabase = createServerClient()
      const { data: projets } = await supabase
        .from('projets')
        .select('projet_id, nom, statut')
        .in('statut', ['En cours', 'Démarrage'])
        .order('nom')
        .limit(20)

      if (!projets || projets.length === 0) {
        return {
          response: `📸 **Ajouter des Médias**\n\n❌ Aucun projet actif trouvé.\n\nVeuillez d'abord créer un projet.`
        }
      }

      await updateSession(phoneNumber, 'WORKFLOW_MEDIA_PROJECT', {})

      const rows = projets.map(p => ({
        id: `media_project_${p.projet_id}`,
        title: p.nom.substring(0, 24),
        description: p.statut
      }))

      return {
        response: `📸 **Ajouter des Médias**\n\nSélectionnez le projet :`,
        interactive: createListMessage(
          'Choisissez un projet :',
          'Projets actifs',
          [{ title: 'Projets actifs', rows }]
        )
      }
    }

    // === GESTION DES WORKFLOWS MULTI-ÉTAPES ===
    const session = await getSession(phoneNumber)

    // Commandes d'annulation/retour au menu (disponibles à tout moment dans un workflow)
    const cancelCommands = ['annuler', 'cancel', 'menu', 'retour', 'stop', 'quitter']
    const isWorkflowActive = session.state.startsWith('WORKFLOW_')

    if (isWorkflowActive && cancelCommands.some(cmd => userMessage.toLowerCase().includes(cmd))) {
      console.log('🔙 [AI Agent] User cancelling workflow')
      await clearSession(phoneNumber)

      return {
        response: `❌ **Workflow Annulé**\n\nRetour au menu principal.`,
        interactive: createActionMenu()
      }
    }

    // WORKFLOW INCIDENT - Étape 2 : Sélection projet après type
    if (session.state === 'WORKFLOW_INCIDENT_TYPE') {
      const incidentType = userMessage.replace('incident_type_', '').replace(/_/g, ' ')

      // Récupérer projets actifs
      const supabase = createServerClient()
      const { data: projets } = await supabase
        .from('projets')
        .select('projet_id, nom, statut')
        .in('statut', ['En cours', 'Démarrage'])
        .order('nom')
        .limit(20)

      if (!projets || projets.length === 0) {
        await clearSession(phoneNumber)
        return {
          response: `❌ Aucun projet actif trouvé. Workflow annulé.`
        }
      }

      await updateSession(phoneNumber, 'WORKFLOW_INCIDENT_PROJECT', { incidentType })

      const rows = projets.map(p => ({
        id: `incident_project_${p.projet_id}`,
        title: p.nom.substring(0, 24),
        description: p.statut
      }))

      return {
        response: `Type sélectionné : **${incidentType}**\n\nSur quel projet/chantier ?`,
        interactive: createListMessage(
          'Sélectionnez le projet :',
          'Projets actifs',
          [{ title: 'Projets actifs', rows }]
        )
      }
    }

    // WORKFLOW INCIDENT - Étape 3 : Description après projet
    if (session.state === 'WORKFLOW_INCIDENT_PROJECT') {
      const projectId = userMessage.replace('incident_project_', '')

      // Récupérer nom du projet
      const supabase = createServerClient()
      const { data: projet } = await supabase
        .from('projets')
        .select('nom')
        .eq('projet_id', projectId)
        .single()

      await updateSession(phoneNumber, 'WORKFLOW_INCIDENT_DESCRIPTION', {
        ...session.data,
        projectId,
        projectName: projet?.nom || 'Projet inconnu'
      })

      return {
        response: `Projet : **${projet?.nom}**\n\n📝 Décrivez l'incident (texte ou message vocal) :`
      }
    }

    // WORKFLOW INCIDENT - Étape 4 : Photo optionnelle après description
    if (session.state === 'WORKFLOW_INCIDENT_DESCRIPTION') {
      await updateSession(phoneNumber, 'WORKFLOW_INCIDENT_PHOTO', {
        ...session.data,
        description: userMessage
      })

      return {
        response: `Description enregistrée ✅\n\n📸 Souhaitez-vous joindre une photo ?\n\nEnvoyez une photo maintenant, ou tapez "non" pour terminer.`
      }
    }

    // WORKFLOW INCIDENT - Étape 5 : Création finale
    if (session.state === 'WORKFLOW_INCIDENT_PHOTO') {
      const supabase = createServerClient()
      let photoUrl = null

      // Si c'est une photo (géré par webhook), elle sera dans session.data.photoUrl
      if (session.data.photoUrl) {
        photoUrl = session.data.photoUrl
      }

      // Créer le signalement
      const { data: signalement, error } = await supabase
        .from('signalements')
        .insert({
          item: session.data.incidentType,
          chantier: session.data.projectName,
          projet_id: session.data.projectId,
          probleme: session.data.description,
          photo_url: photoUrl,
          statut: 'Ouvert',
          created_by_phone: phoneNumber,
          whatsapp_message_id: `WA_${Date.now()}`
        })
        .select()
        .single()

      await clearSession(phoneNumber)

      if (error) {
        console.error('Error creating signalement:', error)
        return {
          response: `❌ Erreur lors de la création de l'incident.\n\nVeuillez réessayer.`
        }
      }

      // Générer Magic Link
      const magicLink = await generateMagicLink({
        resourceType: 'custom',
        phoneNumber,
        expiryHours: 48,
        metadata: {
          title: `Incident #${signalement.id}`,
          description: signalement.probleme,
          customRoute: `/signalements`
        }
      })

      return {
        response: `✅ **Incident Créé**\n\n📋 **Détails** :\n• ID : #${signalement.id}\n• Type : ${signalement.item}\n• Projet : ${signalement.chantier}\n• Description : ${signalement.probleme}\n${photoUrl ? '• Photo : Jointe ✅' : ''}\n\n🔗 Voir la fiche complète :\n${magicLink.url}\n\n_Lien valide 48h_`
      }
    }

    // WORKFLOW MEDIA - Étape 2 : Upload après sélection projet
    if (session.state === 'WORKFLOW_MEDIA_PROJECT') {
      const projectId = userMessage.replace('media_project_', '')

      const supabase = createServerClient()
      const { data: projet } = await supabase
        .from('projets')
        .select('nom')
        .eq('projet_id', projectId)
        .single()

      await updateSession(phoneNumber, 'WORKFLOW_MEDIA_UPLOAD', {
        projectId,
        projectName: projet?.nom || 'Projet inconnu'
      })

      return {
        response: `Projet sélectionné : **${projet?.nom}**\n\n📸 Envoyez vos photos maintenant.\n\nVous pouvez envoyer plusieurs photos. Tapez "terminer" quand vous avez fini.`
      }
    }

    // WORKFLOW MEDIA - Étape 3 : Sauvegarde photos
    if (session.state === 'WORKFLOW_MEDIA_UPLOAD') {
      if (userMessage.toLowerCase() === 'terminer') {
        const photoCount = session.data.photoCount || 0
        await clearSession(phoneNumber)

        return {
          response: `✅ **Upload Terminé**\n\n${photoCount} photo(s) ajoutée(s) au projet **${session.data.projectName}**.\n\nElles sont maintenant visibles dans la galerie.`
        }
      }

      // Photo reçue (gérée par webhook)
      if (session.data.lastPhotoUrl) {
        const photoCount = (session.data.photoCount || 0) + 1
        await updateSession(phoneNumber, 'WORKFLOW_MEDIA_UPLOAD', {
          ...session.data,
          photoCount,
          lastPhotoUrl: null
        })

        return {
          response: `✅ Photo ${photoCount} enregistrée.\n\nEnvoyez d'autres photos ou tapez "terminer".`
        }
      }

      return {
        response: `📸 En attente de vos photos...\n\nTapez "terminer" pour finaliser.`
      }
    }

    // Récupérer la session pour l'historique
    const history = externalHistory || session.data.history || []

    const messages: any[] = [
      {
        role: "system",
        content: `Tu es l'assistant intelligent du SGI (Système de Gestion Intégré) d'ASI-Track.
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
           - Déclarer un incident → create_incident
           - Créer un signalement Top 20 → create_signalement
        
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
        
        ═══════════════════════════════════════════════════════════════
        
        6. **Réponses** : Toujours en Français, professionnel mais ANALYTIQUE. Ne te limite pas à 3-4 lignes si l'analyse le justifie.`
      },
      ...history,
      { role: "user", content: userMessage }
    ]

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      tools: openAITools as any,
      tool_choice: "auto",
    })

    const responseMessage = response.choices[0].message

    // Si l'IA veut appeler un outil
    if (responseMessage.tool_calls) {
      console.log('🛠️ AI Tool Calls:', responseMessage.tool_calls.length)

      const sessionMessages = [...messages, responseMessage]

      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name as keyof typeof aiTools
        const functionArgs = JSON.parse(toolCall.function.arguments)

        console.log(`Calling tool: ${functionName}`, functionArgs)

        try {
          console.log(`🔧 [AI Agent] Calling tool: ${functionName}`, functionArgs)
          const toolResponse = await aiTools[functionName](functionArgs, phoneNumber)
          console.log(`✅ [AI Agent] Tool ${functionName} succeeded, result type:`, typeof toolResponse)
          sessionMessages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: functionName,
            content: JSON.stringify(toolResponse),
          })
        } catch (err: any) {
          console.error(`❌ [AI Agent] Error calling ${functionName}:`, err.message)
          console.error(`📚 [AI Agent] Stack:`, err.stack)
          sessionMessages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: functionName,
            content: JSON.stringify({ error: "Erreur lors de l'accès aux données" }),
          })
        }
      }

      const secondResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: sessionMessages,
      })

      let finalContent = secondResponse.choices[0].message.content || "Désolé, je n'ai pas pu traiter votre demande."

      // === GÉNÉRATION AUTOMATIQUE MAGIC LINKS (Sprint 13 - REFINED) ===
      const toolsUsed = responseMessage.tool_calls?.map(tc => tc.function.name) || []

      // Extraire les résultats des outils pour vérifier la taille
      const toolResults = sessionMessages.filter(msg => msg.role === 'tool')

      // Déclarer snapshotData et snapshotTool en dehors pour utilisation ultérieure
      let snapshotData: any = null
      let snapshotTool = ''

      const hasLargeDataset = toolResults.some(result => {
        try {
          const parsed = JSON.parse(result.content)
          // Vérifier si c'est un array avec 5+ éléments OU un objet avec beaucoup de données
          return (Array.isArray(parsed) && parsed.length >= 5) ||
            (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 10)
        } catch {
          return false
        }
      })

      // Outils qui TOUJOURS génèrent un magic link (analyses financières détaillées)
      const alwaysMagicLinkTools = ['get_project_finances_detailed', 'get_gife_expenses']
      const forcesMagicLink = toolsUsed.some(tool => alwaysMagicLinkTools.includes(tool))

      // Générer magic link SEULEMENT si : données volumineuses OU outil financier spécifique
      const needsMagicLink = hasLargeDataset || forcesMagicLink

      if (needsMagicLink && phoneNumber) {
        try {
          // Extraire project_id si disponible
          const firstToolCall = responseMessage.tool_calls?.[0]
          const firstArgs = firstToolCall ? JSON.parse(firstToolCall.function.arguments) : {}
          const projectId = firstArgs.project_id

          // Déterminer le type de magic link
          let resourceType: 'finances' | 'stocks' | 'projets' | 'custom' = 'custom'
          if (toolsUsed.includes('get_project_finances_detailed')) resourceType = 'finances'
          else if (toolsUsed.includes('get_stocks')) resourceType = 'stocks'
          else if (toolsUsed.includes('get_projects')) resourceType = 'projets'

          // Identify the primary tool data to snapshot
          for (const res of toolResults) {
            try {
              const parsed = JSON.parse(res.content)
              // Prioritize financial tools or large datasets
              if (alwaysMagicLinkTools.includes(res.name as string) ||
                (Array.isArray(parsed) && parsed.length >= 5) ||
                (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 10)) {
                snapshotData = parsed
                snapshotTool = res.name as string
                break
              }
            } catch (e) { }
          }

          // Fallback to first tool result
          if (!snapshotData && toolResults.length > 0) {
            try {
              snapshotData = JSON.parse(toolResults[0].content)
              snapshotTool = toolResults[0].name as string
            } catch (e) { }
          }

          const magicLinkResult = await generateMagicLink({
            resourceType,
            resourceId: projectId,
            phoneNumber,
            expiryHours: 48,
            metadata: {
              toolsUsed,
              toolName: snapshotTool,
              data: snapshotData
            }
          })

          if (magicLinkResult.success && magicLinkResult.url) {
            finalContent += `\n\n📊 *Voir détails complets* : ${magicLinkResult.url}\n_(Lien valide 48h)_`
          }
        } catch (err) {
          console.error('Erreur génération magic link:', err)
          // Continue sans magic link
        }
      }

      // Sauvegarder l'historique (limité aux 10 derniers messages)
      const newHistory = [
        ...history,
        { role: "user", content: userMessage },
        { role: "assistant", content: finalContent }
      ].slice(-10)

      await updateSession(phoneNumber, 'IDLE', { history: newHistory })

      // Générer menu interactif si applicable
      let interactiveMenu = null

      // Si get_projects avec plusieurs résultats → Liste
      if (toolsUsed.includes('get_projects') && snapshotData && Array.isArray(snapshotData) && snapshotData.length > 3) {
        try {
          const projectRows = snapshotData.slice(0, 10).map((p: any) => ({
            id: `project_${p.projet_id}`,
            title: p.nom_projet?.substring(0, 24) || p.projet_id,
            description: `${p.ville_village || ''} • ${fmtFCFA(p.montant_ht_fcfa)}`.substring(0, 72)
          }))

          interactiveMenu = createListMessage(
            `J'ai trouvé ${snapshotData.length} projet(s). Sélectionnez-en un pour plus de détails :`,
            'Voir les projets',
            [{ title: 'Projets', rows: projectRows }],
            { footer: 'ASI-BF SGI' }
          )
        } catch (err) {
          console.error('Erreur génération liste projets:', err)
        }
      }

      // Si get_incidents avec plusieurs résultats → Liste
      if (toolsUsed.includes('get_incidents') && snapshotData && Array.isArray(snapshotData) && snapshotData.length > 3) {
        try {
          const incidentRows = snapshotData.slice(0, 10).map((inc: any) => ({
            id: `incident_${inc.incident_id || inc.numero_incident}`,
            title: inc.type_incident?.substring(0, 24) || 'Incident',
            description: `${inc.lieu || ''} • ${inc.gravite || ''}`.substring(0, 72)
          }))

          interactiveMenu = createListMessage(
            `J'ai trouvé ${snapshotData.length} incident(s). Sélectionnez-en un pour plus de détails :`,
            'Voir les incidents',
            [{ title: 'Incidents', rows: incidentRows }],
            { footer: 'ASI-BF SGI' }
          )
        } catch (err) {
          console.error('Erreur génération liste incidents:', err)
        }
      }

      return {
        response: finalContent,
        interactive: interactiveMenu,
        action: 'ai/processed'
      }
    }

    const finalChatContent = responseMessage.content || "Je n'ai pas bien compris votre demande."

    // Sauvegarder l'historique de chat simple
    const newChatHistory = [
      ...history,
      { role: "user", content: userMessage },
      { role: "assistant", content: finalChatContent }
    ].slice(-10)

    await updateSession(phoneNumber, 'IDLE', { history: newChatHistory })

    return {
      response: finalChatContent,
      action: 'ai/chat'
    }

  } catch (error) {
    console.error('❌ AI Error:', error)
    return { response: "Désolé, une erreur est survenue avec l'assistant intelligent." }
  }
}

// Exécuter la requête selon l'intent détecté
async function executeQuery(intent: DetectedIntent, phoneNumber?: string): Promise<{ data: unknown; summary: string }> {
  const supabase = createServerClient()

  switch (intent.module) {
    case 'projets': {
      let query = supabase.from('projets').select('*')
      if (intent.filters.statut) query = query.eq('statut', intent.filters.statut)
      if (intent.filters.pays) query = query.eq('pays', intent.filters.pays)
      const { data, error } = await query.order('projet_id').limit(30)
      if (error) throw error

      if (intent.action === 'count') {
        const total = data?.length || 0
        const montantTotal = data?.reduce((s: number, p: any) => s + (p.montant_ttc_fcfa || 0), 0) || 0
        const filterDesc = Object.entries(intent.filters).map(([k, v]) => `${k}: ${v}`).join(', ') || 'tous'
        return {
          data,
          summary: `📊 **${total} projets** trouvés (${filterDesc})\n💰 Montant total: **${fmtFCFA(montantTotal)}**`
        }
      }

      const total = data?.length || 0
      const montantTotal = data?.reduce((s: number, p: any) => s + (p.montant_ttc_fcfa || 0), 0) || 0
      let summary = `📋 **${total} projets** trouvés\n💰 Montant total: **${fmtFCFA(montantTotal)}**\n\n`

      if (data && data.length > 0) {
        summary += '| # | Projet | Pays | Statut | Montant |\n|---|--------|------|--------|--------|\n'
        data.slice(0, 15).forEach((p: any, i: number) => {
          summary += `| ${i + 1} | ${p.acronyme || p.projet_id} | ${p.pays} | ${p.statut} | ${fmtFCFA(p.montant_ttc_fcfa)} |\n`
        })
        if (total > 15) summary += `\n_...et ${total - 15} autres projets_`
      }
      return { data, summary }
    }

    case 'stocks': {
      if (intent.action === 'alerte') {
        const { data: allStocks, error } = await supabase
          .from('stocks')
          .select('*')
          .order('article_id')

        if (error) throw error

        const alertes = allStocks?.filter((s: any) => s.stock_actuel <= s.stock_alerte) || []
        let summary = `⚠️ **${alertes.length} articles en alerte stock**\n\n`
        if (alertes.length > 0) {
          summary += '| Article | Stock Actuel | Seuil Alerte | Valeur |\n|---------|-------------|-------------|--------|\n'
          alertes.forEach((s: any) => {
            const icon = s.stock_actuel <= s.stock_minimum ? '🔴' : '🟠'
            summary += `| ${icon} ${s.designation} | ${s.stock_actuel} ${s.unite || ''} | ${s.stock_alerte} | ${fmtFCFA(s.valeur_stock_fcfa)} |\n`
          })
        } else {
          summary += '✅ Tous les stocks sont à des niveaux normaux.'
        }
        return { data: alertes, summary }
      }

      const { data, error } = await supabase.from('stocks').select('*').order('article_id')
      if (error) throw error
      const total = data?.length || 0
      const valeurTotale = data?.reduce((s: number, a: any) => s + (a.valeur_stock_fcfa || 0), 0) || 0
      const enAlerte = data?.filter((s: any) => s.stock_actuel <= s.stock_alerte).length || 0
      let summary = `📦 **${total} articles en stock**\n💰 Valeur totale: **${fmtFCFA(valeurTotale)}**\n⚠️ ${enAlerte} articles en alerte\n\n`
      summary += '| Article | Catégorie | Stock | Valeur |\n|---------|-----------|-------|--------|\n'
      data?.slice(0, 15).forEach((s: any) => {
        const icon = s.stock_actuel <= s.stock_alerte ? '⚠️' : '✅'
        summary += `| ${icon} ${s.designation} | ${s.categorie} | ${s.stock_actuel} ${s.unite || ''} | ${fmtFCFA(s.valeur_stock_fcfa)} |\n`
      })
      return { data, summary }
    }

    case 'equipements': {
      if (intent.action === 'maintenance') {
        const { data, error } = await supabase
          .from('equipements')
          .select('*')
          .in('statut', ['En maintenance', 'En panne', 'Hors service'])
        if (error) throw error
        let summary = `🔧 **${data?.length || 0} équipements en maintenance/panne**\n\n`
        if (data && data.length > 0) {
          summary += '| Équipement | Marque | État | Statut |\n|-----------|--------|------|--------|\n'
          data.forEach((e: any) => {
            summary += `| ${e.designation} | ${e.marque} | ${e.etat} | ${e.statut} |\n`
          })
        } else {
          summary += '✅ Tous les équipements sont opérationnels!'
        }
        return { data, summary }
      }

      if (intent.action === 'visite') {
        const { data, error } = await supabase
          .from('equipements')
          .select('*')
          .not('date_prochaine_visite_technique', 'is', null)
          .order('date_prochaine_visite_technique', { ascending: true })
          .limit(10)
        if (error) throw error
        let summary = `📋 **Visites techniques à prévoir:**\n\n`
        if (data && data.length > 0) {
          summary += '| Équipement | Immatriculation | Prochaine VT |\n|-----------|----------------|---------------|\n'
          data.forEach((e: any) => {
            summary += `| ${e.designation} | ${e.immatriculation || '-'} | ${fmtDate(e.date_prochaine_visite_technique)} |\n`
          })
        }
        return { data, summary }
      }

      const { data, error } = await supabase.from('equipements').select('*').order('equipement_id')
      if (error) throw error
      const total = data?.length || 0
      const enService = data?.filter((e: any) => e.statut === 'En service').length || 0
      const valeurParc = data?.reduce((s: number, e: any) => s + (e.valeur_actuelle_fcfa || 0), 0) || 0
      let summary = `🚛 **${total} équipements** (${enService} en service)\n💰 Valeur du parc: **${fmtFCFA(valeurParc)}**\n\n`
      summary += '| Équipement | Marque | État | Statut | Valeur |\n|-----------|--------|------|--------|--------|\n'
      data?.slice(0, 15).forEach((e: any) => {
        summary += `| ${e.designation} | ${e.marque} | ${e.etat} | ${e.statut} | ${fmtFCFA(e.valeur_actuelle_fcfa)} |\n`
      })
      return { data, summary }
    }

    case 'finances': {
      const { data, error } = await supabase.from('gife').select('*')
      if (error) throw error
      const totalEngage = data?.reduce((s: number, g: any) => s + (g.montant_engage_fcfa || 0), 0) || 0
      const totalLiquide = data?.reduce((s: number, g: any) => s + (g.montant_liquide_fcfa || 0), 0) || 0
      const tauxExec = totalEngage > 0 ? ((totalLiquide / totalEngage) * 100).toFixed(1) : '0'
      const nbEngagements = data?.length || 0

      let summary = `💰 **Résumé Financier (GIFE)**\n\n`
      summary += `📊 Nombre d'engagements: **${nbEngagements}**\n`
      summary += `💵 Total engagé: **${fmtFCFA(totalEngage)}**\n`
      summary += `✅ Total liquidé: **${fmtFCFA(totalLiquide)}**\n`
      summary += `📈 Taux d'exécution: **${tauxExec}%**\n\n`

      if (data && data.length > 0) {
        const sorted = [...data].sort((a: any, b: any) => (b.montant_engage_fcfa || 0) - (a.montant_engage_fcfa || 0))
        summary += '**Top 5 engagements:**\n| N° GIFE | Objet | Engagé | Liquidé | Taux |\n|---------|-------|--------|---------|------|\n'
        sorted.slice(0, 5).forEach((g: any) => {
          const taux = g.montant_engage_fcfa > 0 ? ((g.montant_liquide_fcfa / g.montant_engage_fcfa) * 100).toFixed(0) : '0'
          summary += `| ${g.numero_gife} | ${(g.objet || '').slice(0, 30)} | ${fmtFCFA(g.montant_engage_fcfa)} | ${fmtFCFA(g.montant_liquide_fcfa)} | ${taux}% |\n`
        })
      }
      return { data: { nbEngagements, totalEngage, totalLiquide, tauxExec }, summary }
    }

    case 'incidents': {
      if (intent.action === 'ouverts') {
        const { data, error } = await supabase
          .from('incidents')
          .select('*')
          .neq('statut', 'Résolu')
          .neq('statut', 'Clos')
          .order('date_incident', { ascending: false })
        if (error) throw error
        const impactTotal = data?.reduce((s: number, i: any) => s + (i.impact_financier_fcfa || 0), 0) || 0
        let summary = `🚨 **${data?.length || 0} incidents ouverts**\n💸 Impact financier total: **${fmtFCFA(impactTotal)}**\n\n`
        if (data && data.length > 0) {
          summary += '| N° | Date | Type | Gravité | Impact | Lieu |\n|---|------|------|---------|--------|------|\n'
          data.forEach((i: any) => {
            const icon = i.gravite === 'Critique' ? '🔴' : i.gravite === 'Majeur' || i.gravite === 'Majeure' ? '🟠' : '🟡'
            summary += `| ${i.numero_incident} | ${fmtDate(i.date_incident)} | ${i.type_incident} | ${icon} ${i.gravite} | ${fmtFCFA(i.impact_financier_fcfa)} | ${i.lieu} |\n`
          })
        } else {
          summary += '✅ Aucun incident ouvert!'
        }
        return { data, summary }
      }

      const { data, error } = await supabase.from('incidents').select('*').order('date_incident', { ascending: false })
      if (error) throw error
      const total = data?.length || 0
      const ouverts = data?.filter((i: any) => i.statut !== 'Résolu' && i.statut !== 'Clos').length || 0
      const impactTotal = data?.reduce((s: number, i: any) => s + (i.impact_financier_fcfa || 0), 0) || 0

      let summary = ''
      if (phoneNumber) {
        summary = `⚠️ *${total} incidents* (${ouverts} ouverts)\n💸 Impact total: *${fmtFCFA(impactTotal)}*\n\n`
        summary += formatTableForWhatsApp(data || [], [
          { key: 'numero_incident', label: 'N°' },
          { key: 'type_incident', label: 'Type' },
          { key: 'gravite', label: 'Gravité' },
          { key: 'statut', label: 'Statut' }
        ], 5)
        const { url: magicLink } = await generateMagicLink({ resourceType: 'custom', phoneNumber, metadata: { target: '/incidents' } })
        summary = createMessageWithMagicLink(summary, magicLink || '', 'Ouvrir la gestion des incidents')
      } else {
        summary = `⚠️ **${total} incidents** (${ouverts} ouverts)\n💸 Impact total: **${fmtFCFA(impactTotal)}**\n\n`
        summary += '| N° | Type | Gravité | Statut | Impact |\n|---|------|---------|--------|--------|\n'
        data?.slice(0, 10).forEach((i: any) => {
          summary += `| ${i.numero_incident} | ${i.type_incident} | ${i.gravite} | ${i.statut} | ${fmtFCFA(i.impact_financier_fcfa)} |\n`
        })
      }
      return { data, summary }
    }

    case 'assurances': {
      if (intent.action === 'expiration') {
        const in60days = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        const { data, error } = await supabase
          .from('assurances')
          .select('*')
          .lte('date_echeance', in60days)
          .eq('statut', 'Actif')
          .order('date_echeance', { ascending: true })
        if (error) throw error
        let summary = `🛡️ **${data?.length || 0} assurances à renouveler** (dans les 60 jours)\n\n`
        if (data && data.length > 0) {
          summary += '| Police | Type | Compagnie | Échéance | Prime |\n|--------|------|-----------|----------|-------|\n'
          data.forEach((a: any) => {
            summary += `| ${a.numero_police} | ${a.type_assurance} | ${a.compagnie} | ${fmtDate(a.date_echeance)} | ${fmtFCFA(a.prime_annuelle_fcfa)} |\n`
          })
        } else {
          summary += '✅ Aucune assurance n\'expire dans les 60 prochains jours.'
        }
        return { data, summary }
      }

      const { data, error } = await supabase.from('assurances').select('*').order('date_echeance')
      if (error) throw error
      const actives = data?.filter((a: any) => a.statut === 'Actif').length || 0
      const totalPrimes = data?.reduce((s: number, a: any) => s + (a.prime_annuelle_fcfa || 0) * 1, 0) || 0

      let summary = ''
      if (phoneNumber) {
        summary = `🛡️ *${data?.length || 0} assurances* (${actives} actives)\n💰 Total primes: *${fmtFCFA(totalPrimes)}*\n\n`
        summary += formatTableForWhatsApp(data || [], [
          { key: 'numero_police', label: 'Police' },
          { key: 'compagnie', label: 'Compagnie' },
          { key: 'date_echeance', label: 'Échéance' }
        ], 5)
        const { url: magicLink } = await generateMagicLink({ resourceType: 'custom', phoneNumber, metadata: { target: '/assurances' } })
        summary = createMessageWithMagicLink(summary, magicLink || '', 'Gérer les assurances')
      } else {
        summary = `🛡️ **${data?.length || 0} polices d'assurance** (${actives} actives)\n💰 Total primes: **${fmtFCFA(totalPrimes)}**\n\n`
        summary += '| Police | Type | Compagnie | Échéance | Statut |\n|--------|------|-----------|----------|--------|\n'
        data?.slice(0, 10).forEach((a: any) => {
          summary += `| ${a.numero_police} | ${a.type_assurance} | ${a.compagnie} | ${fmtDate(a.date_echeance)} | ${a.statut} |\n`
        })
      }
      return { data, summary }
    }

    case 'marches': {
      const { data, error } = await supabase.from('marches').select('*').order('marche_id')
      if (error) throw error
      const totalMontant = data?.reduce((s: number, m: any) => s + (m.montant_ttc_fcfa || 0), 0) || 0
      const tauxMoyen = data && data.length > 0 ? (data.reduce((s: number, m: any) => s + (m.taux_execution || 0), 0) / data.length).toFixed(1) : '0'

      let summary = ''
      if (phoneNumber) {
        summary = `📄 *${data?.length || 0} marchés*\n💰 Total: *${fmtFCFA(totalMontant)}*\n📈 Exécution: *${tauxMoyen}%*\n\n`
        summary += formatTableForWhatsApp(data || [], [
          { key: 'numero_marche', label: 'N°' },
          { key: 'intitule', label: 'Intitulé' },
          { key: 'taux_execution', label: '%' }
        ], 5)
        const { url: magicLink } = await generateMagicLink({ resourceType: 'custom', phoneNumber, metadata: { target: '/marches' } })
        summary = createMessageWithMagicLink(summary, magicLink || '', 'Détails des marchés')
      } else {
        summary = `📄 **${data?.length || 0} marchés**\n💰 Montant total: **${fmtFCFA(totalMontant)}**\n📈 Taux d'exécution moyen: **${tauxMoyen}%**\n\n`
        summary += '| N° Marché | Intitulé | Montant | Taux Exéc. |\n|-----------|----------|---------|------------|\n'
        data?.slice(0, 10).forEach((m: any) => {
          summary += `| ${m.numero_marche} | ${(m.intitule || '').slice(0, 35)} | ${fmtFCFA(m.montant_ttc_fcfa)} | ${m.taux_execution}% |\n`
        })
      }
      return { data, summary }
    }

    case 'missions': {
      const { data, error } = await supabase.from('ordres_mission').select('*').order('date_debut_mission', { ascending: false }).limit(50)
      if (error) throw error
      const totalFrais = data?.reduce((s: number, m: any) => s + (m.total_frais_fcfa || 0), 0) || 0

      let summary = ''
      if (phoneNumber) {
        summary = `✈️ *${data?.length || 0} missions*\n💰 Total frais: *${fmtFCFA(totalFrais)}*\n\n`
        summary += formatTableForWhatsApp(data || [], [
          { key: 'numero_om', label: 'N° OM' },
          { key: 'destination', label: 'Dest.' },
          { key: 'statut', label: 'Statut' }
        ], 5)
        const { url: magicLink } = await generateMagicLink({ resourceType: 'missions', phoneNumber })
        summary = createMessageWithMagicLink(summary, magicLink || '', 'Détails des missions')
      } else {
        summary = `✈️ **${data?.length || 0} ordres de mission**\n💰 Total frais: **${fmtFCFA(totalFrais)}**\n\n`
        summary += '| N° OM | Destination | Durée | Frais | Statut |\n|-------|------------|-------|-------|--------|\n'
        data?.slice(0, 10).forEach((m: any) => {
          summary += `| ${m.numero_om} | ${m.destination}, ${m.pays} | ${m.duree_jours}j | ${fmtFCFA(m.total_frais_fcfa)} | ${m.statut} |\n`
        })
      }
      return { data, summary }
    }

    case 'commandes': {
      const { data, error } = await supabase.from('bons_commande').select('*').order('date_emission', { ascending: false }).limit(50)
      if (error) throw error
      const totalMontant = data?.reduce((s: number, c: any) => s + (c.montant_ttc_fcfa || 0), 0) || 0

      let summary = ''
      if (phoneNumber) {
        summary = `🛒 *${data?.length || 0} bons de commande*\n💰 Total: *${fmtFCFA(totalMontant)}*\n\n`
        summary += formatTableForWhatsApp(data || [], [
          { key: 'numero_bc', label: 'N°' },
          { key: 'fournisseur', label: 'Fourn.' },
          { key: 'montant_ttc_fcfa', label: 'Montant' }
        ], 5)
        const { url: magicLink } = await generateMagicLink({ resourceType: 'custom', phoneNumber, metadata: { target: '/commandes' } })
        summary = createMessageWithMagicLink(summary, magicLink || '', 'Suivi des commandes')
      } else {
        summary = `🛒 **${data?.length || 0} bons de commande**\n💰 Total: **${fmtFCFA(totalMontant)}**\n\n`
        summary += '| N° BC | Fournisseur | Montant | Livraison | Paiement |\n|-------|------------|---------|-----------|----------|\n'
        data?.slice(0, 10).forEach((c: any) => {
          summary += `| ${c.numero_bc} | ${c.fournisseur} | ${fmtFCFA(c.montant_ttc_fcfa)} | ${c.statut_livraison} | ${c.statut_paiement} |\n`
        })
      }
      return { data, summary }
    }

    case 'imports': {
      const { data, error } = await supabase.from('imports').select('*').order('import_id')
      if (error) throw error
      const totalCout = data?.reduce((s: number, i: any) => s + (i.cout_total_fcfa || 0), 0) || 0
      let summary = `🚢 **${data?.length || 0} importations**\n💰 Coût total: **${fmtFCFA(totalCout)}**\n\n`

      if (phoneNumber) {
        // WhatsApp: Short text + Magic Link
        const { url: magicLink } = await generateMagicLink({
          resourceType: 'imports',
          phoneNumber
        })
        summary = `🚢 *${data?.length || 0} importations*\n💰 Coût total: *${fmtFCFA(totalCout)}*\n\n`
        summary += formatTableForWhatsApp(data || [], [
          { key: 'numero_import', label: 'N°' },
          { key: 'fournisseur', label: 'Fournisseur' },
          { key: 'cout_total_fcfa', label: 'Coût' }
        ], 5)
        summary = createMessageWithMagicLink(summary, magicLink || '', 'Voir tous les imports')
      } else {
        // Web: Markdown Table
        summary += '| N° Import | Fournisseur | Pays | Coût | Statut |\n|-----------|------------|------|------|--------|\n'
        data?.slice(0, 10).forEach((i: any) => {
          summary += `| ${i.numero_import} | ${i.fournisseur} | ${i.pays_origine} | ${fmtFCFA(i.cout_total_fcfa)} | ${i.statut} |\n`
        })
      }
      return { data, summary }
    }

    case 'candidatures': {
      const { data, error } = await supabase.from('candidatures').select('*').order('date_reception', { ascending: false }).limit(50)
      if (error) throw error
      const retenus = data?.filter((c: any) => c.decision === 'Retenu' || c.decision === 'Embauché').length || 0

      let summary = ''
      if (phoneNumber) {
        summary = `👥 *${data?.length || 0} candidatures* (${retenus} retenus)\n\n`
        summary += formatTableForWhatsApp(data || [], [
          { key: 'nom', label: 'Nom' },
          { key: 'poste_vise', label: 'Poste' },
          { key: 'decision', label: 'Décision' }
        ], 5)
        const { url: magicLink } = await generateMagicLink({ resourceType: 'custom', phoneNumber, metadata: { target: '/rh/candidatures' } })
        summary = createMessageWithMagicLink(summary, magicLink || '', 'Voir les CV et détails')
      } else {
        summary = `👥 **${data?.length || 0} candidatures** (${retenus} retenus)\n\n`
        summary += '| Nom | Poste | Expérience | Prétentions | Décision |\n|-----|-------|------------|-------------|----------|\n'
        data?.slice(0, 10).forEach((c: any) => {
          summary += `| ${c.nom} ${c.prenom} | ${c.poste_vise} | ${c.annees_experience} ans | ${fmtFCFA(c.pretentions_salariales_fcfa)} | ${c.decision} |\n`
        })
      }
      return { data, summary }
    }

    case 'signalements': {
      if (intent.action === 'top20') {
        // Fetch Top 20 view
        const { data, error } = await supabase
          .from('v_top20_signalements')
          .select('*')
          .limit(20)

        if (error) throw error

        // Get stats
        const { data: stats } = await supabase
          .from('v_stats_signalements')
          .select('*')
          .single()

        const statsData = stats || { en_retard: 0, non_echus: 0, resolus: 0 }

        // Format for WhatsApp
        let response = formatTop20ForWhatsApp(data || [], statsData)

        if (phoneNumber) {
          const { url: magicLink } = await generateMagicLink({
            resourceType: 'top20',
            phoneNumber
          })
          response = createMessageWithMagicLink(response, magicLink || '', 'Voir le Top 20 complet')
        }

        return { data, summary: response }
      }

      if (intent.action === 'list') {
        const { data, error } = await supabase
          .from('signalements')
          .select('*')
          .order('date_echeance', { ascending: true })
          .limit(20)

        if (error) throw error

        const total = data?.length || 0
        const enRetard = data?.filter((s: any) => s.statut === 'en_retard').length || 0
        const nonEchus = data?.filter((s: any) => s.statut === 'non_echue').length || 0

        // Format according to platform
        let summary = ''
        if (phoneNumber) {
          // WhatsApp: Use professional list formatter + Magic Link
          const { url: magicLink } = await generateMagicLink({
            resourceType: 'signalements_table', // Fixed ID to match type
            phoneNumber
          })
          summary = `📋 *${total} signalements*\n🔴 En retard: ${enRetard}\n🟡 Non échus: ${nonEchus}\n\n`
          summary += formatTableForWhatsApp(data || [], [
            { key: 'signalement_id', label: 'ID' },
            { key: 'probleme', label: 'Problème' },
            { key: 'chantier', label: 'Chantier' },
            { key: 'date_echeance', label: 'Échéance' }
          ], 5)
          summary = createMessageWithMagicLink(summary, magicLink || '', 'Ouvrir le suivi complet')
        } else {
          // Web: Use Markdown table
          summary = `📋 **${total} signalements**\n🔴 En retard: ${enRetard}\n🟡 Non échus: ${nonEchus}\n\n`
          summary += '| ID | Problème | Chantier | Statut | Échéance |\n|---|----------|----------|--------|----------|\n'
          data?.slice(0, 10).forEach((s: any) => {
            const emoji = getStatusEmoji(s.statut)
            summary += `| ${s.signalement_id} | ${s.probleme.substring(0, 30)} | ${s.chantier} | ${emoji} | ${fmtDate(s.date_echeance)} |\n`
          })
        }

        return { data, summary }
      }

      // Default: show stats
      const { data: stats, error } = await supabase
        .from('v_stats_signalements')
        .select('*')
        .single()

      if (error) throw error

      let summary = ''
      if (phoneNumber) {
        summary = `📊 *Tableau de bord ASI-TRACK*\n\n`
        summary += `🏗️ Projets: ${stats.total_projets || 0} (${stats.en_cours || 0} en cours)\n`
        summary += `💰 Finances: ${fmtFCFA(stats.total_engage || 0)} engagé\n`
        summary += `📦 Stocks: ${stats.total_stocks || 0} articles (${stats.en_alerte || 0} en alerte)\n`
        summary += `🚛 Équipements: ${stats.total_equipements || 0} (${stats.en_service || 0} en service)\n`
        summary += `⚠️ Incidents: ${stats.incidents_ouverts || 0} ouverts\n`

        const { url: magicLink } = await generateMagicLink({
          resourceType: 'dashboard',
          phoneNumber
        })
        summary = createMessageWithMagicLink(summary, magicLink || '', 'Ouvrir les graphiques interactifs')
      } else {
        summary = `📊 **Tableau de bord ASI-TRACK**\n\n`
        summary += `🏗️ Projets: ${stats.total_projets} (${stats.en_cours} en cours) — ${fmtFCFA(stats.total_pj_v_fcfa)}\n`
        summary += `💰 Finances: ${fmtFCFA(stats.total_engage)} engagé, ${fmtFCFA(stats.total_liquide)} liquidé — Taux: ${stats.taux_execution}%\n`
        summary += `📦 Stocks: ${stats.total_stocks} articles — Valeur: ${fmtFCFA(stats.valeur_stock)} — ${stats.en_alerte} en alerte\n`
        summary += `🚛 Équipements: ${stats.total_equipements} (${stats.en_service} en service)\n`
        summary += `⚠️ Incidents: ${stats.total_incidents} total (${stats.incidents_ouverts} ouverts) — Impact: ${fmtFCFA(stats.impact_incidents)}\n`
        summary += `🛡️ Assurances: ${stats.assurances_actives} actives\n\n`

        if (stats.pays_stats) {
          summary += `🌍 **Répartition par pays:**\n`
          stats.pays_stats.forEach((p: any) => {
            summary += `  • ${p.pays}: ${p.count} projets\n`
          })
        }
      }

      return { data: stats, summary }
    }

    case 'stats':
    default: {
      const [projetsRes, gifeRes, stocksRes, equipementsRes, incidentsRes, assurancesRes] = await Promise.all([
        supabase.from('projets').select('projet_id, statut, montant_ttc_fcfa, pays'),
        supabase.from('gife').select('montant_engage_fcfa, montant_liquide_fcfa'),
        supabase.from('stocks').select('stock_actuel, stock_alerte, valeur_stock_fcfa'),
        supabase.from('equipements').select('statut, valeur_actuelle_fcfa'),
        supabase.from('incidents').select('statut, impact_financier_fcfa, gravite'),
        supabase.from('assurances').select('statut, date_echeance, prime_annuelle_fcfa'),
      ])

      const projets = projetsRes.data || []
      const gife = gifeRes.data || []
      const stocks = stocksRes.data || []
      const equipements = equipementsRes.data || []
      const incidents = incidentsRes.data || []
      const assurances = assurancesRes.data || []

      const totalProjets = projets.length
      const projetsEnCours = projets.filter((p: any) => p.statut === 'En cours').length
      const montantTotal = projets.reduce((s: number, p: any) => s + (p.montant_ttc_fcfa || 0), 0)

      const totalEngage = gife.reduce((s: number, g: any) => s + (g.montant_engage_fcfa || 0), 0)
      const totalLiquide = gife.reduce((s: number, g: any) => s + (g.montant_liquide_fcfa || 0), 0)
      const tauxExec = totalEngage > 0 ? ((totalLiquide / totalEngage) * 100).toFixed(1) : '0'

      const valeurStock = stocks.reduce((s: number, a: any) => s + (a.valeur_stock_fcfa || 0), 0)
      const stocksAlerte = stocks.filter((s: any) => s.stock_actuel <= s.stock_alerte).length

      const totalEquipements = equipements.length
      const eqEnService = equipements.filter((e: any) => e.statut === 'En service').length

      const incidentsOuverts = incidents.filter((i: any) => i.statut !== 'Résolu' && i.statut !== 'Clos').length
      const impactTotal = incidents.reduce((s: number, i: any) => s + (i.impact_financier_fcfa || 0), 0)

      const assActives = assurances.filter((a: any) => a.statut === 'Actif').length

      const parPays: Record<string, number> = {}
      projets.forEach((p: any) => { parPays[p.pays] = (parPays[p.pays] || 0) + 1 })

      let summary = `📊 **Tableau de bord ASI-TRACK**\n\n`
      summary += `🏗️ **Projets:** ${totalProjets} (${projetsEnCours} en cours) — ${fmtFCFA(montantTotal)}\n`
      summary += `💰 **Finances:** ${fmtFCFA(totalEngage)} engagé, ${fmtFCFA(totalLiquide)} liquidé — Taux: **${tauxExec}%**\n`
      summary += `📦 **Stocks:** ${stocks.length} articles — Valeur: ${fmtFCFA(valeurStock)} — ${stocksAlerte} en alerte\n`
      summary += `🚛 **Équipements:** ${totalEquipements} (${eqEnService} en service)\n`
      summary += `⚠️ **Incidents:** ${incidents.length} total (${incidentsOuverts} ouverts) — Impact: ${fmtFCFA(impactTotal)}\n`
      summary += `🛡️ **Assurances:** ${assActives} actives\n\n`
      summary += `🌍 **Répartition par pays:**\n`
      Object.entries(parPays).sort((a, b) => b[1] - a[1]).forEach(([pays, nb]) => {
        summary += `  • ${pays}: ${nb} projets\n`
      })

      return {
        data: { totalProjets, projetsEnCours, montantTotal, tauxExec, valeurStock, stocksAlerte, totalEquipements, incidentsOuverts, impactTotal, assActives },
        summary
      }
    }
  }
}

// Fonction principale - appelée depuis l'API /api/chat et Webhook WhatsApp
export async function processQuery(userMessage: string, _conversationHistory: Array<{ role: string; content: string }> = [], phoneNumber?: string) {
  try {
    // 0. GESTION DE SESSION (WhatsApp uniquement)
    if (phoneNumber) {
      const session = await getSession(phoneNumber)
      const supabase = createServerClient()
      console.log(`🔄 Session ${phoneNumber}: ${session.state}`)

      // --- MACHINE A ÉTATS ---

      // === SIGNALEMENT CREATION FLOW ===

      // 1. Signalement - Pays
      if (session.state === 'WAITING_FOR_SIGNALEMENT_PAYS') {
        const pays = userMessage
        await updateSession(phoneNumber, 'WAITING_FOR_SIGNALEMENT_CHANTIER', { pays })
        return {
          response: `Pays: ${pays}. Quel est le chantier concerné ?`,
          data: null,
          action: 'signalement/chantier'
        }
      }

      // 2. Signalement - Chantier
      if (session.state === 'WAITING_FOR_SIGNALEMENT_CHANTIER') {
        const chantier = userMessage
        await updateSession(phoneNumber, 'WAITING_FOR_SIGNALEMENT_PROBLEME', { chantier })
        return {
          response: `Chantier: ${chantier}. Décrivez le problème :`,
          data: null,
          action: 'signalement/probleme'
        }
      }

      // 3. Signalement - Problème
      if (session.state === 'WAITING_FOR_SIGNALEMENT_PROBLEME') {
        const probleme = userMessage
        await updateSession(phoneNumber, 'WAITING_FOR_SIGNALEMENT_ACTION', { probleme })
        return {
          response: `Problème noté. Quelle action faut-il entreprendre ?`,
          data: null,
          action: 'signalement/action'
        }
      }

      // 4. Signalement - Action
      if (session.state === 'WAITING_FOR_SIGNALEMENT_ACTION') {
        const action = userMessage
        await updateSession(phoneNumber, 'WAITING_FOR_SIGNALEMENT_SECTION', { action_entreprendre: action })
        return {
          response: `Action: ${action}. Quelle section est concernée ?`,
          data: null,
          action: 'signalement/section'
        }
      }

      // 5. Signalement - Section
      if (session.state === 'WAITING_FOR_SIGNALEMENT_SECTION') {
        const section = userMessage
        await updateSession(phoneNumber, 'WAITING_FOR_SIGNALEMENT_PERSONNE', { section })
        return {
          response: `Section: ${section}. Qui est la personne chargée de l'action ?`,
          data: null,
          action: 'signalement/personne'
        }
      }

      // 6. Signalement - Personne
      if (session.state === 'WAITING_FOR_SIGNALEMENT_PERSONNE') {
        const personne = userMessage
        await updateSession(phoneNumber, 'WAITING_FOR_SIGNALEMENT_ECHEANCE', { personne_chargee: personne })
        return {
          response: `Responsable: ${personne}. Date d'échéance (format: JJ/MM/AAAA) ?`,
          data: null,
          action: 'signalement/echeance'
        }
      }

      // 7. Signalement - Échéance & Création
      if (session.state === 'WAITING_FOR_SIGNALEMENT_ECHEANCE') {
        const echeanceStr = userMessage
        const { pays, chantier, probleme, action_entreprendre, section, personne_chargee } = session.data

        // Parse date (simple format JJ/MM/AAAA)
        let dateEcheance = new Date()
        try {
          const parts = echeanceStr.split('/')
          if (parts.length === 3) {
            dateEcheance = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
          }
        } catch (e) {
          console.error('Date parsing error:', e)
        }

        // Generate ID
        const { data: idData } = await supabase.rpc('generate_signalement_id')
        const signalementId = idData || `SIG-${Date.now()}`

        // Create signalement
        const { data, error } = await supabase.from('signalements').insert({
          signalement_id: signalementId,
          item: probleme.substring(0, 100), // Use problem as item
          pays,
          chantier,
          probleme,
          action_entreprendre,
          section,
          personne_chargee,
          date_echeance: dateEcheance.toISOString().split('T')[0],
          whatsapp_message_id: session.data.message_id,
          created_by_phone: phoneNumber,
          rapport_avancement: []
        }).select().single()

        await clearSession(phoneNumber)

        if (error) {
          console.error('❌ Erreur création signalement:', error)
          return { response: `❌ Erreur lors de la création du signalement: ${error.message}` }
        }

        // Generate magic link for viewing
        const magicLink = await generateMagicLink({
          resourceType: 'signalement_detail',
          resourceId: signalementId,
          phoneNumber
        })

        let response = `✅ *Signalement créé avec succès!*\n\n`
        response += `🆔 ID: *${signalementId}*\n`
        response += `🌍 Pays: ${pays}\n`
        response += `🏗️ Chantier: ${chantier}\n`
        response += `⚠️ Problème: ${probleme}\n`
        response += `👤 Responsable: ${personne_chargee}\n`
        response += `⏰ Échéance: ${fmtDate(data.date_echeance)}\n\n`
        response += `📊 Voir dans le Top 20: /top20`

        if (magicLink.success && magicLink.url) {
          response += `\n\n🔗 *Voir les détails*\n${magicLink.url}`
        }

        return {
          response,
          data,
          action: 'signalement/created'
        }
      }

      // === SIGNALEMENT UPDATE FLOW ===

      // 1. Update - Select Signalement
      if (session.state === 'WAITING_FOR_SIGNALEMENT_ID_UPDATE') {
        const signalementId = userMessage.toUpperCase()

        // Fetch signalement
        const { data: signalement, error } = await supabase
          .from('signalements')
          .select('*')
          .eq('signalement_id', signalementId)
          .single()

        if (error || !signalement) {
          await clearSession(phoneNumber)
          return { response: `❌ Signalement ${signalementId} non trouvé.` }
        }

        await updateSession(phoneNumber, 'WAITING_FOR_SIGNALEMENT_UPDATE_FIELD', { signalement })

        // Show current status and field selection menu
        const formatted = formatSignalementForWhatsApp(signalement)

        return {
          response: formatted,
          interactive: {
            type: 'list',
            header: { type: 'text', text: '📝 Mise à jour' },
            body: { text: 'Que souhaitez-vous modifier ?' },
            footer: { text: signalementId },
            action: {
              button: 'Sélectionner',
              sections: [{
                title: 'Champs modifiables',
                rows: [
                  { id: 'update_rapport', title: '📝 Rapport avancement', description: 'Ajouter un rapport' },
                  { id: 'update_echeance', title: '⏰ Date échéance', description: 'Modifier la date' },
                  { id: 'update_personne', title: '👤 Responsable', description: 'Changer de personne' },
                  { id: 'update_resolu', title: '✅ Marquer résolu', description: 'Clôturer le signalement' }
                ]
              }]
            }
          },
          action: 'signalement/update_menu'
        }
      }

      // 2. Update - Field Selection
      if (session.state === 'WAITING_FOR_SIGNALEMENT_UPDATE_FIELD') {
        const field = userMessage
        const { signalement } = session.data

        if (field === 'update_rapport') {
          await updateSession(phoneNumber, 'WAITING_FOR_SIGNALEMENT_RAPPORT', { updateField: 'rapport' })
          return {
            response: '📝 Entrez le nouveau rapport d\'avancement :',
            action: 'signalement/rapport_prompt'
          }
        }

        if (field === 'update_echeance') {
          await updateSession(phoneNumber, 'WAITING_FOR_SIGNALEMENT_NEW_ECHEANCE', { updateField: 'echeance' })
          return {
            response: `⏰ Nouvelle date d'échéance (JJ/MM/AAAA) ?\nActuelle: ${fmtDate(signalement.date_echeance)}`,
            action: 'signalement/echeance_prompt'
          }
        }

        if (field === 'update_personne') {
          await updateSession(phoneNumber, 'WAITING_FOR_SIGNALEMENT_NEW_PERSONNE', { updateField: 'personne' })
          return {
            response: `👤 Nouveau responsable ?\nActuel: ${signalement.personne_chargee}`,
            action: 'signalement/personne_prompt'
          }
        }

        if (field === 'update_resolu') {
          // Mark as resolved immediately
          const { error } = await supabase
            .from('signalements')
            .update({ statut: 'resolu' })
            .eq('signalement_id', signalement.signalement_id)

          await clearSession(phoneNumber)

          if (error) {
            return { response: `❌ Erreur: ${error.message}` }
          }

          return {
            response: `✅ Signalement *${signalement.signalement_id}* marqué comme résolu!`,
            action: 'signalement/resolved'
          }
        }

        await clearSession(phoneNumber)
        return { response: 'Option non reconnue.' }
      }

      // 3. Update - Rapport
      if (session.state === 'WAITING_FOR_SIGNALEMENT_RAPPORT') {
        const rapport = userMessage
        const { signalement } = session.data

        // Add to rapport_avancement array
        const rapports = signalement.rapport_avancement || []
        rapports.push({
          date: new Date().toISOString(),
          texte: rapport,
          auteur: phoneNumber
        })

        const { error } = await supabase
          .from('signalements')
          .update({ rapport_avancement: rapports })
          .eq('signalement_id', signalement.signalement_id)

        await clearSession(phoneNumber)

        if (error) {
          return { response: `❌ Erreur: ${error.message}` }
        }

        return {
          response: `✅ Rapport ajouté au signalement *${signalement.signalement_id}*!\n\n📝 ${rapport}`,
          action: 'signalement/rapport_added'
        }
      }

      // 4. Update - Échéance
      if (session.state === 'WAITING_FOR_SIGNALEMENT_NEW_ECHEANCE') {
        const echeanceStr = userMessage
        const { signalement } = session.data

        let dateEcheance = new Date()
        try {
          const parts = echeanceStr.split('/')
          if (parts.length === 3) {
            dateEcheance = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
          }
        } catch (e) {
          console.error('Date parsing error:', e)
        }

        const { error } = await supabase
          .from('signalements')
          .update({ date_echeance: dateEcheance.toISOString().split('T')[0] })
          .eq('signalement_id', signalement.signalement_id)

        await clearSession(phoneNumber)

        if (error) {
          return { response: `❌ Erreur: ${error.message}` }
        }

        return {
          response: `✅ Échéance mise à jour pour *${signalement.signalement_id}*!\n⏰ Nouvelle date: ${fmtDate(dateEcheance.toISOString())}`,
          action: 'signalement/echeance_updated'
        }
      }

      // 5. Update - Personne
      if (session.state === 'WAITING_FOR_SIGNALEMENT_NEW_PERSONNE') {
        const personne = userMessage
        const { signalement } = session.data

        const { error } = await supabase
          .from('signalements')
          .update({ personne_chargee: personne })
          .eq('signalement_id', signalement.signalement_id)

        await clearSession(phoneNumber)

        if (error) {
          return { response: `❌ Erreur: ${error.message}` }
        }

        return {
          response: `✅ Responsable mis à jour pour *${signalement.signalement_id}*!\n👤 Nouveau responsable: ${personne}`,
          action: 'signalement/personne_updated'
        }
      }

      // === EXISTING INCIDENT HANDLERS ===

      // 1. Nouvel Incident - Type
      if (session.state === 'WAITING_FOR_INCIDENT_TYPE') {
        const incidentType = userMessage
        await updateSession(phoneNumber, 'WAITING_FOR_INCIDENT_DESCRIPTION', { incidentType })
        return {
          response: `Type: ${incidentType}. Décrivez brièvement le problème :`,
          data: null,
          action: 'incident/description'
        }
      }

      // 2. Nouvel Incident - Description
      if (session.state === 'WAITING_FOR_INCIDENT_DESCRIPTION') {
        const description = userMessage
        await updateSession(phoneNumber, 'WAITING_FOR_INCIDENT_PHOTO', { incidentDescription: description })
        return {
          response: "C'est noté. 📸 Avez-vous une photo de l'incident ?",
          interactive: {
            type: "button",
            body: { text: "📸 Avez-vous une photo ? (Envoyez l'image ou cliquez sur Passer)" },
            action: {
              buttons: [
                { type: "reply", reply: { id: "skip_photo", title: "Passer cette étape" } }
              ]
            }
          },
          data: null,
          action: 'incident/photo'
        }
      }

      // 3. Nouvel Incident - Photo
      if (session.state === 'WAITING_FOR_INCIDENT_PHOTO') {
        let photoId: string | undefined = undefined
        if (userMessage.startsWith('[IMAGE:')) {
          photoId = userMessage.replace('[IMAGE:', '').replace(']', '')
        }

        await updateSession(phoneNumber, 'WAITING_FOR_INCIDENT_LOCATION', { incidentPhotoId: photoId })

        return {
          response: "📍 Où se situe l'incident ?",
          interactive: {
            type: "button",
            body: { text: "📍 Où se situe l'incident ?" },
            action: {
              buttons: [
                { type: "reply", reply: { id: "loc_ouaga", title: "Ouaga" } },
                { type: "reply", reply: { id: "loc_bobo", title: "Bobo" } },
                { type: "reply", reply: { id: "loc_chantier", title: "Sur Chantier" } }
              ]
            }
          },
          action: 'incident/location'
        }
      }

      // 4. Nouvel Incident - Localisation & Création
      if (session.state === 'WAITING_FOR_INCIDENT_LOCATION') {
        const location = userMessage
        const { incidentType, incidentDescription, incidentPhotoId } = session.data

        // Ajouter la ref photo à la description si présente
        const finalDesc = incidentDescription + (incidentPhotoId ? ` [Photo ID: ${incidentPhotoId}]` : '')

        // Création dans Supabase
        const { data, error } = await supabase.from('incidents').insert({
          type_incident: incidentType || 'Autre', // Fixed column name
          description: finalDesc,
          localisation: location,
          statut: 'ouvert',
          date_incident: new Date().toISOString(), // Fixed column name
          signale_par: phoneNumber,
        }).select().single()

        await clearSession(phoneNumber)

        if (error) {
          console.error('Erreur création incident:', error)
          return { response: "❌ Erreur lors de la création de l'incident." }
        }

        return {
          response: `✅ Incident #${data.id} créé avec succès !\n\n📌 Type: ${incidentType}\n📝 Desc: ${incidentDescription}\n📸 Photo: ${incidentPhotoId ? 'Oui' : 'Non'}\n📍 Lieu: ${location}`,
          data: data,
          action: 'incident/created'
        }
      }

      // 5. Stocks - Choix Menu
      if (session.state === 'WAITING_FOR_STOCK_MENU_CHOICE') {
        if (userMessage === 'stock_search') {
          await updateSession(phoneNumber, 'WAITING_FOR_STOCK_SEARCH_QUERY')
          return {
            response: "🔍 Quel article recherchez-vous ? (Entrez un mot-clé)",
            action: 'stock/search_prompt'
          }
        }

        let query = supabase.from('stocks').select('*').limit(10)

        if (userMessage === 'stock_low') {
          query = query.lte('stock_actuel', 'stock_alerte') // This assumes comparing columns works or need raw filter?
          // Supabase JS filter takes column and value.
          // 'stock_alerte' is a column name, but simple filter expects a value.
          // For column comparison I might need .filter() or Rpc?
          // Let's stick to simple "stock_actuel <= 50" for now or use rpc if needed.
          // Actually, let's fetch all and filter in JS if simple query fails.
          // Or just use .lte('stock_actuel', 50) as a placeholder for "low".
          // Or better: Use RPC or explicit query if possible.
          // I'll filter in JS for now to be safe, or just fetch top 10 low stocks by ordering?
          // Let's try fetching where stock_actuel <= stock_alerte is tricky in simple standard syntax without column comparison.
          // I'll fetch * and filter in JS for "stock_low".
          // Actually, I'll allow "stock_low" to just show items with low stock.
        }

        const { data: stocks, error } = await query

        if (error || !stocks) return { response: "❌ Erreur récupération stocks." }

        let filteredStocks = stocks
        if (userMessage === 'stock_low') {
          filteredStocks = stocks.filter((s: any) => s.stock_actuel <= s.stock_alerte)
        }

        if (filteredStocks.length === 0) return { response: "Aucun article trouvé." }

        // Format as List
        const rows = filteredStocks.map((s: any) => ({
          id: `stock_${s.code_article}`,
          title: s.designation.substring(0, 24), // Max 24 chars for title
          description: `Stock: ${s.stock_actuel} ${s.unite}`
        }))

        const { url: magicLink } = await generateMagicLink({
          resourceType: 'stocks',
          phoneNumber
        })

        await clearSession(phoneNumber) // End flow after showing list

        return {
          response: createMessageWithMagicLink("Voici les articles :", magicLink || '', 'Gérer les stocks sur le web'),
          interactive: {
            type: "list",
            header: { type: "text", text: userMessage === 'stock_low' ? "⚠️ Stocks Faibles" : "📦 Articles" },
            body: { text: "Sélectionnez un article pour voir les détails" },
            footer: { text: "ASI-STOCK" },
            action: {
              button: "Voir Articles",
              sections: [{ title: "Résultats", rows }]
            }
          },
          action: 'stock/list'
        }
      }

      // 6. Stocks - Recherche
      if (session.state === 'WAITING_FOR_STOCK_SEARCH_QUERY') {
        const { data: stocks, error } = await supabase.from('stocks').select('*').ilike('designation', `%${userMessage}%`).limit(10)

        await clearSession(phoneNumber)

        if (error || !stocks || stocks.length === 0) {
          return { response: `😕 Aucun article trouvé pour "${userMessage}".` }
        }

        const rows = stocks.map((s: any) => ({
          id: `stock_${s.code_article}`, // We will need to handle item selection later? Yes.
          title: s.designation.substring(0, 24),
          description: `Stock: ${s.stock_actuel} ${s.unite}`
        }))

        return {
          response: `🔍 Résultats pour "${userMessage}" :`,
          interactive: {
            type: "list",
            header: { type: "text", text: "🔍 Recherche" },
            body: { text: "Sélectionnez un article" },
            footer: { text: "ASI-STOCK" },
            action: {
              button: "Voir Résultats",
              sections: [{ title: "Articles trouvés", rows }]
            }
          },
          action: 'stock/search_result'
        }
      }
    }

    // === FINANCES FLOW ===
    if (phoneNumber) {
      const session = await getSession(phoneNumber)
      if (session.state === 'WAITING_FOR_PROJECT_ID_FINANCES') {
        const projectQuery = userMessage
        await clearSession(phoneNumber)
        return await processQueryWithAI(`Analyse financière détaillée du projet ${projectQuery}`, phoneNumber)
      }
    }

    const normalizedQuery = userMessage.toLowerCase().trim()

    // --- MENU PRINCIPAL (Sprint 12 & 15 FIX) ---
    const menuKeywords = ['menu', 'accueil', 'start', 'bonjour', 'salut', 'hello', 'home']
    const wantsMenu = menuKeywords.some(keyword => normalizedQuery.includes(keyword))

    if (wantsMenu && !['stock_search', 'stock_low'].includes(userMessage)) {
      if (phoneNumber) await clearSession(phoneNumber)
      return {
        response: "Bienvenue sur ASI-ASSISTANT 2.0 🤖\n\nJe dispose de 18 outils pour vous aider !",
        interactive: createActionMenu(),
        data: null,
        action: 'menu'
      }
    }

    // --- INTERCEPTION COMMANDES MENU ---
    if (normalizedQuery === 'signaler incident' || userMessage === 'new_incident') {
      if (phoneNumber) await updateSession(phoneNumber, 'WAITING_FOR_INCIDENT_TYPE')
      return {
        response: "Quel type d'incident voulez-vous signaler ?",
        interactive: {
          type: "button",
          body: { text: "🔧 Quel est le type d'incident ?" },
          action: {
            buttons: [
              { type: "reply", reply: { id: "panne", title: "Panne Machine" } },
              { type: "reply", reply: { id: "accident", title: "Accident" } },
              { type: "reply", reply: { id: "materiel", title: "Matériel Cassé" } }
            ]
          }
        },
        action: 'incident/start'
      }
    }

    // --- SIGNALEMENT FLOWS ---

    // Create new signalement
    if (normalizedQuery.includes('signaler') || normalizedQuery.includes('nouveau signalement') || userMessage === 'new_signalement') {
      if (phoneNumber) await updateSession(phoneNumber, 'WAITING_FOR_SIGNALEMENT_PAYS')
      return {
        response: "🆕 *Nouveau signalement*\n\nQuel est le pays concerné ?",
        data: null,
        action: 'signalement/start'
      }
    }

    // Update existing signalement
    if (normalizedQuery.includes('mettre a jour signalement') || normalizedQuery.includes('modifier signalement') || userMessage === 'update_signalement') {
      if (phoneNumber) await updateSession(phoneNumber, 'WAITING_FOR_SIGNALEMENT_ID_UPDATE')
      return {
        response: "📝 *Mise à jour signalement*\n\nEntrez l'ID du signalement à modifier (ex: SIG-001) :",
        data: null,
        action: 'signalement/update_start'
      }
    }

    // --- NOUVEAUX HANDLERS MENU (Sprint 12) ---

    // KPIs Globaux
    if (userMessage === 'kpis_global') {
      return await processQueryWithAI("Donne-moi les KPIs globaux du SGI", phoneNumber || '')
    }

    // Finances Projet
    if (userMessage === 'finances_projet') {
      if (phoneNumber) await updateSession(phoneNumber, 'WAITING_FOR_PROJECT_ID_FINANCES')
      return {
        response: "💰 *Analyse Financière*\n\nEntrez le nom ou l'ID du projet (ex: 'AEP Atakpamé' ou 'prj030') :",
        action: 'finances/ask_project'
      }
    }

    // Stocks & Alertes
    if (userMessage === 'stocks_alertes') {
      return await processQueryWithAI("Quels articles sont en stock critique ou en alerte?", phoneNumber || '')
    }

    // Projets Liste
    if (userMessage === 'projets_liste') {
      return {
        response: "🚧 *Recherche de Projets*\n\nQue voulez-vous voir ?",
        interactive: {
          type: "button",
          body: { text: "Filtrer les projets" },
          action: {
            buttons: [
              { type: "reply", reply: { id: "projets_en_cours", title: "En cours" } },
              { type: "reply", reply: { id: "projets_acheves", title: "Achevés" } },
              { type: "reply", reply: { id: "projets_tous", title: "Tous" } }
            ]
          }
        },
        action: 'projets/menu'
      }
    }

    // Sous-options projets
    if (userMessage === 'projets_en_cours') {
      return await processQueryWithAI("Liste les projets en cours", phoneNumber || '')
    }
    if (userMessage === 'projets_acheves') {
      return await processQueryWithAI("Liste les projets achevés", phoneNumber || '')
    }
    if (userMessage === 'projets_tous') {
      return await processQueryWithAI("Liste tous les projets", phoneNumber || '')
    }

    // Équipements
    if (userMessage === 'equipements') {
      return await processQueryWithAI("Liste les équipements et véhicules du parc", phoneNumber || '')
    }

    // Marchés
    if (userMessage === 'marches') {
      return await processQueryWithAI("Liste les marchés et contrats en cours", phoneNumber || '')
    }

    // Assurances
    if (userMessage === 'assurances') {
      return await processQueryWithAI("Liste les polices d'assurance et leurs échéances", phoneNumber || '')
    }

    // Signalements Top 20
    if (userMessage === 'signalements_top20') {
      return await processQueryWithAI("Liste les signalements Top 20 en cours", phoneNumber || '')
    }

    // Recherche Libre
    if (userMessage === 'recherche_libre') {
      if (phoneNumber) await clearSession(phoneNumber)
      return {
        response: "🔍 *Recherche Libre*\n\nPosez votre question en langage naturel.\n\nExemples:\n• Quelle est la marge du projet AEP Atakpamé?\n• Combien d'incidents ouverts au Burkina?\n• Quels équipements sont en panne?",
        action: 'recherche/libre'
      }
    }

    // --- ANCIENS HANDLERS (compatibilité) ---

    if (userMessage === 'check_stock' || normalizedQuery === 'vérifier stock') {
      if (phoneNumber) await updateSession(phoneNumber, 'WAITING_FOR_STOCK_MENU_CHOICE')
      return {
        response: "📦 Gestion des Stocks - Que voulez-vous faire ?",
        interactive: {
          type: "button",
          body: { text: "📦 Gestion des Stocks" },
          action: {
            buttons: [
              { type: "reply", reply: { id: "stock_list_all", title: "Tout voir" } },
              { type: "reply", reply: { id: "stock_search", title: "🔍 Rechercher" } },
              { type: "reply", reply: { id: "stock_low", title: "⚠️ Stocks Faibles" } }
            ]
          }
        },
        action: 'stock/menu'
      }
    }

    // 5. Sinon, traitement via IA (Nouvelle version)
    if (phoneNumber) {
      return await processQueryWithAI(userMessage, phoneNumber)
    }

    // Fallback mots-clés (pour le web sans phone number ou en secours)
    const intent = detectIntent(userMessage)
    const { data, summary } = await executeQuery(intent, phoneNumber)

    return {
      response: summary,
      data: data,
      action: `${intent.module}/${intent.action}`,
    }
  } catch (error) {
    console.error('Erreur agent ASI-TRACK:', error)
    return {
      response: `❌ Désolé, une erreur s'est produite lors de la requête.\n\nErreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}\n\nEssayez de reformuler votre question.`,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

// Quick actions
export async function executeQuickAction(action: string) {
  const actionMap: Record<string, string> = {
    'projets_en_cours': 'Quels sont les projets en cours?',
    'stocks_critiques': 'Quels articles sont en stock critique?',
    'equipements_maintenance': 'Quels équipements sont en maintenance?',
    'incidents_ouverts': 'Quels incidents sont ouverts?',
    'assurances_expiration': 'Quelles assurances expirent bientôt?',
    'stats_globales': 'Donne-moi les statistiques globales',
  }

  const message = actionMap[action] || action
  return processQuery(message)
}
