/**
 * Templates de messages WhatsApp
 * Messages prédéfinis pour alertes et rapports
 */

export const WhatsAppTemplates = {
  // ========================================
  // ALERTES STOCKS
  // ========================================
  stockCritique: (articles: Array<{ nom: string; stock: number; seuil: number }>) => {
    let message = '🚨 *ALERTE STOCK CRITIQUE*\n\n'
    message += `${articles.length} article(s) en rupture imminente :\n\n`
    
    articles.slice(0, 5).forEach(article => {
      message += `• ${article.nom}\n`
      message += `  Stock: ${article.stock} (seuil: ${article.seuil})\n\n`
    })
    
    if (articles.length > 5) {
      message += `... et ${articles.length - 5} autres articles\n\n`
    }
    
    message += '💡 *Action requise:* Commander d\'urgence\n'
    message += '_ASI-BF SGI - Gestion Stocks_'
    
    return message
  },

  // ========================================
  // ALERTES BUDGET
  // ========================================
  budgetDepassement: (
    module: string,
    montant: number,
    budget: number,
    pourcentage: number
  ) => {
    const emoji = pourcentage > 100 ? '🔴' : '⚠️'
    let message = `${emoji} *ALERTE BUDGET ${module}*\n\n`
    message += `Dépassement détecté :\n\n`
    message += `• Budget alloué: ${budget.toLocaleString('fr-FR')} FCFA\n`
    message += `• Montant engagé: ${montant.toLocaleString('fr-FR')} FCFA\n`
    message += `• Taux: *${pourcentage.toFixed(1)}%*\n\n`
    
    if (pourcentage > 100) {
      message += `🚨 Budget dépassé de ${(montant - budget).toLocaleString('fr-FR')} FCFA\n\n`
    }
    
    message += '💡 *Action:* Révision budgétaire requise\n'
    message += '_ASI-BF SGI - Gestion Finances_'
    
    return message
  },

  // ========================================
  // ALERTES ÉQUIPEMENTS
  // ========================================
  maintenanceEcheance: (
    vehicule: string,
    type: string,
    dateEcheance: string,
    joursRestants: number
  ) => {
    const emoji = joursRestants <= 3 ? '🚨' : joursRestants <= 7 ? '⚠️' : 'ℹ️'
    let message = `${emoji} *MAINTENANCE ${vehicule}*\n\n`
    message += `${type} à échéance :\n\n`
    message += `• Date limite: ${dateEcheance}\n`
    message += `• Jours restants: *${joursRestants} jours*\n\n`
    
    if (joursRestants <= 3) {
      message += '🚨 URGENT - Programmer immédiatement\n\n'
    } else if (joursRestants <= 7) {
      message += '⚠️ À planifier cette semaine\n\n'
    }
    
    message += '💡 *Action:* Prendre rendez-vous garage\n'
    message += '_ASI-BF SGI - Gestion Parc_'
    
    return message
  },

  // ========================================
  // ALERTES PROJETS
  // ========================================
  projetRetard: (
    nom: string,
    joursRetard: number,
    datePrevu: string,
    budget: number
  ) => {
    let message = '⚠️ *PROJET EN RETARD*\n\n'
    message += `📁 ${nom}\n\n`
    message += `• Retard: *${joursRetard} jours*\n`
    message += `• Date prévue: ${datePrevu}\n`
    message += `• Budget: ${budget.toLocaleString('fr-FR')} FCFA\n\n`
    message += '💡 *Action:* Réunion urgente équipe projet\n'
    message += '_ASI-BF SGI - Gestion Projets_'
    
    return message
  },

  // ========================================
  // RAPPORTS QUOTIDIENS
  // ========================================
  rapportQuotidien: (stats: {
    projetsActifs: number
    budgetJour: number
    alertesCritiques: number
    incidentsOuverts: number
    date: string
  }) => {
    let message = '☀️ *RAPPORT QUOTIDIEN ASI-BF*\n'
    message += `${stats.date}\n\n`
    message += '📊 *Vue d\'ensemble:*\n\n'
    message += `• Projets actifs: *${stats.projetsActifs}*\n`
    message += `• Dépenses du jour: ${stats.budgetJour.toLocaleString('fr-FR')} FCFA\n`
    message += `• Alertes critiques: ${stats.alertesCritiques > 0 ? '🚨 ' : ''}${stats.alertesCritiques}\n`
    message += `• Incidents ouverts: ${stats.incidentsOuverts}\n\n`
    
    if (stats.alertesCritiques > 0) {
      message += `⚠️ ${stats.alertesCritiques} alerte(s) nécessite(nt) attention\n\n`
    }
    
    message += '📈 Dashboard complet: [Lien]\n'
    message += '_ASI-BF SGI - Brief Quotidien_'
    
    return message
  },

  // ========================================
  // RAPPORTS HEBDOMADAIRES
  // ========================================
  rapportHebdo: (stats: {
    projetsClotures: number
    budgetSemaine: number
    tauxExecution: number
    alertesResolues: number
    semaine: string
  }) => {
    let message = '📊 *RAPPORT HEBDOMADAIRE*\n'
    message += `Semaine ${stats.semaine}\n\n`
    message += '🎯 *Résultats:*\n\n'
    message += `• Projets clôturés: ${stats.projetsClotures}\n`
    message += `• Budget engagé: ${stats.budgetSemaine.toLocaleString('fr-FR')} FCFA\n`
    message += `• Taux exécution: ${stats.tauxExecution}%\n`
    message += `• Alertes résolues: ${stats.alertesResolues}\n\n`
    
    message += '💡 *Priorités semaine prochaine:*\n'
    message += '• [À définir]\n\n'
    
    message += '📈 Rapport complet: [Lien PDF]\n'
    message += '_ASI-BF SGI - Synthèse Hebdo_'
    
    return message
  },

  // ========================================
  // BIENVENUE
  // ========================================
  bienvenue: (nom?: string) => {
    let message = '👋 *Bienvenue sur ASI-BF SGI*\n\n'
    
    if (nom) {
      message += `Bonjour ${nom} !\n\n`
    }
    
    message += 'Je suis votre assistant IA pour la gestion intégrée.\n\n'
    message += '💬 *Posez-moi des questions :*\n'
    message += '• "Combien de projets en cours ?"\n'
    message += '• "Stock critique ?"\n'
    message += '• "Budget ce mois ?"\n'
    message += '• "Incidents ouverts ?"\n\n'
    
    message += '🔔 *Commandes :*\n'
    message += '• /alerte - Configurer alertes\n'
    message += '• /rapport - Rapport quotidien\n'
    message += '• /aide - Voir toutes les commandes\n\n'
    
    message += '_ASI-BF SGI - Intelligence Gestion_'
    
    return message
  },

  // ========================================
  // AIDE
  // ========================================
  aide: () => {
    let message = '📚 *AIDE ASI-BF SGI*\n\n'
    message += '🤖 *Questions en langage naturel:*\n'
    message += '• Posez vos questions librement\n'
    message += '• Exemples: "Projets Burkina", "Taux exécution", "Stock bas"\n\n'
    
    message += '🔔 *Commandes disponibles:*\n'
    message += '• /rapport - Rapport du jour\n'
    message += '• /hebdo - Rapport hebdomadaire\n'
    message += '• /alerte - Gérer alertes\n'
    message += '• /stats - Statistiques globales\n'
    message += '• /aide - Cette aide\n\n'
    
    message += '📊 *Modules accessibles:*\n'
    message += '• Projets BTP\n'
    message += '• Finances (GIFE)\n'
    message += '• Stocks (GIS)\n'
    message += '• Parc automobile (GIFL)\n'
    message += '• Incidents\n'
    message += '• Marchés (GESMA)\n\n'
    
    message += '_ASI-BF SGI - Support 24/7_'
    
    return message
  },
}
