/**
 * Templates d'emails pour alertes et rapports
 */

import { createBaseEmailTemplate } from './client'

export const EmailTemplates = {
  /**
   * Rapport quotidien
   */
  rapportQuotidien: (stats: {
    projetsActifs: number
    budgetJour: number
    alertesCritiques: number
    incidentsOuverts: number
    tauxExecution: number
    stocksCritiques: number
    date: string
  }) => {
    const content = `
      <p>Bonjour,</p>
      <p>Voici votre rapport quotidien ASI-BF pour le <strong>${stats.date}</strong>.</p>
      
      <h2 style="color: #1e40af; margin-top: 30px;">📊 Vue d'ensemble</h2>
      
      <div class="stat-box">
        <strong>Projets actifs:</strong> ${stats.projetsActifs}<br>
        <strong>Dépenses du jour:</strong> ${stats.budgetJour.toLocaleString('fr-FR')} FCFA<br>
        <strong>Taux d'exécution:</strong> ${stats.tauxExecution}%
      </div>
      
      ${stats.alertesCritiques > 0 ? `
      <div class="alert">
        <strong>⚠️ ${stats.alertesCritiques} alerte(s) critique(s)</strong><br>
        Action requise aujourd'hui
      </div>
      ` : `
      <div class="success">
        <strong>✅ Aucune alerte critique</strong><br>
        Tous les indicateurs sont au vert
      </div>
      `}
      
      <h2 style="color: #1e40af; margin-top: 30px;">🔔 Points d'attention</h2>
      <ul>
        ${stats.incidentsOuverts > 0 ? `<li>Incidents ouverts: <strong>${stats.incidentsOuverts}</strong></li>` : ''}
        ${stats.stocksCritiques > 0 ? `<li>Articles en stock critique: <strong>${stats.stocksCritiques}</strong></li>` : ''}
      </ul>
      
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://asi-bi.netlify.app'}" class="button">
        📈 Voir Dashboard Complet
      </a>
    `

    return createBaseEmailTemplate(
      `☀️ Rapport Quotidien - ${stats.date}`,
      content
    )
  },

  /**
   * Alerte stock critique
   */
  alerteStockCritique: (articles: Array<{
    nom: string
    stock: number
    seuil: number
    categorie?: string
  }>) => {
    const articlesHtml = articles.slice(0, 10).map(article => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${article.nom}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          <strong style="color: #dc2626;">${article.stock}</strong>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${article.seuil}</td>
      </tr>
    `).join('')

    const content = `
      <div class="alert">
        <h2 style="margin-top: 0;">🚨 ALERTE STOCK CRITIQUE</h2>
        <p><strong>${articles.length} article(s)</strong> en rupture imminente</p>
      </div>
      
      <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
        <thead>
          <tr style="background: #f8fafc;">
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Article</th>
            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Stock</th>
            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Seuil</th>
          </tr>
        </thead>
        <tbody>
          ${articlesHtml}
        </tbody>
      </table>
      
      ${articles.length > 10 ? `<p><em>... et ${articles.length - 10} autres articles</em></p>` : ''}
      
      <div class="stat-box">
        <strong>💡 Action requise:</strong><br>
        Commander ces articles en urgence pour éviter rupture de stock
      </div>
      
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/stocks" class="button">
        📦 Voir Gestion Stocks
      </a>
    `

    return createBaseEmailTemplate(
      '🚨 Alerte Stock Critique',
      content
    )
  },

  /**
   * Alerte dépassement budget
   */
  alerteBudget: (data: {
    module: string
    montantEngage: number
    budgetAlloue: number
    pourcentage: number
    depassement: number
  }) => {
    const content = `
      <div class="alert">
        <h2 style="margin-top: 0;">🔴 ALERTE BUDGET - ${data.module}</h2>
        <p>Dépassement budgétaire détecté</p>
      </div>
      
      <div class="stat-box">
        <strong>Budget alloué:</strong> ${data.budgetAlloue.toLocaleString('fr-FR')} FCFA<br>
        <strong>Montant engagé:</strong> ${data.montantEngage.toLocaleString('fr-FR')} FCFA<br>
        <strong>Taux d'exécution:</strong> <span style="color: #dc2626; font-size: 20px;">${data.pourcentage.toFixed(1)}%</span><br>
        <strong>Dépassement:</strong> <span style="color: #dc2626;">+${data.depassement.toLocaleString('fr-FR')} FCFA</span>
      </div>
      
      <div class="stat-box">
        <strong>💡 Actions recommandées:</strong><br>
        • Geler les dépenses non essentielles<br>
        • Révision budgétaire urgente<br>
        • Réallocation des ressources
      </div>
      
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/finances" class="button">
        💰 Voir Finances
      </a>
    `

    return createBaseEmailTemplate(
      `🔴 Dépassement Budget ${data.module}`,
      content
    )
  },

  /**
   * Alerte maintenance équipement
   */
  alerteMaintenance: (equipements: Array<{
    immatriculation: string
    type: string
    echeance: string
    joursRestants: number
  }>) => {
    const equipementsHtml = equipements.map(eq => {
      const urgence = eq.joursRestants <= 3 ? '🚨 URGENT' :
        eq.joursRestants <= 7 ? '⚠️ Planifier' : 'ℹ️ À prévoir'

      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
            <strong>${eq.immatriculation}</strong><br>
            <small>${eq.type}</small>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">
            ${eq.echeance}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">
            ${urgence}<br>
            <strong>${eq.joursRestants} jours</strong>
          </td>
        </tr>
      `
    }).join('')

    const content = `
      <div class="alert">
        <h2 style="margin-top: 0;">⚠️ ALERTES MAINTENANCE</h2>
        <p><strong>${equipements.length} véhicule(s)</strong> nécessitent une maintenance</p>
      </div>
      
      <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
        <thead>
          <tr style="background: #f8fafc;">
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Véhicule</th>
            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Échéance</th>
            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Urgence</th>
          </tr>
        </thead>
        <tbody>
          ${equipementsHtml}
        </tbody>
      </table>
      
      <div class="stat-box">
        <strong>💡 Action requise:</strong><br>
        Programmer les maintenances pour éviter amendes et immobilisation
      </div>
      
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/equipements" class="button">
        🚗 Voir Parc Automobile
      </a>
    `

    return createBaseEmailTemplate(
      '⚠️ Alertes Maintenance Véhicules',
      content
    )
  },

  /**
   * Rapport hebdomadaire
   */
  rapportHebdomadaire: (stats: {
    semaine: string
    projetsClotures: number
    budgetSemaine: number
    tauxExecution: number
    alertesResolues: number
    incidentsNouveaux: number
    highlights: string[]
  }) => {
    const highlightsHtml = stats.highlights.map(h => `<li>${h}</li>`).join('')

    const content = `
      <p>Bonjour,</p>
      <p>Voici votre synthèse hebdomadaire ASI-BF pour la <strong>semaine ${stats.semaine}</strong>.</p>
      
      <h2 style="color: #1e40af; margin-top: 30px;">🎯 Résultats de la semaine</h2>
      
      <div class="stat-box">
        <strong>Projets clôturés:</strong> ${stats.projetsClotures}<br>
        <strong>Budget engagé:</strong> ${stats.budgetSemaine.toLocaleString('fr-FR')} FCFA<br>
        <strong>Taux d'exécution:</strong> ${stats.tauxExecution}%<br>
        <strong>Alertes résolues:</strong> ${stats.alertesResolues}<br>
        <strong>Nouveaux incidents:</strong> ${stats.incidentsNouveaux}
      </div>
      
      <h2 style="color: #1e40af; margin-top: 30px;">⭐ Points marquants</h2>
      <ul>
        ${highlightsHtml}
      </ul>
      
      <a href="${process.env.NEXT_PUBLIC_APP_URL}" class="button">
        📊 Dashboard Complet
      </a>
    `

    return createBaseEmailTemplate(
      `📊 Rapport Hebdomadaire - Semaine ${stats.semaine}`,
      content
    )
  },
}
