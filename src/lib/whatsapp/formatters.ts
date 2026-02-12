/**
 * WhatsApp Formatting Utilities
 * Format data for WhatsApp display with emojis and readable layout
 */

export interface SignalementData {
    signalement_id: string
    item: string
    pays: string
    chantier: string
    probleme: string
    action_entreprendre: string
    section: string
    personne_chargee: string
    date_debut: string
    date_echeance: string
    duree_jours: number
    statut: 'en_retard' | 'non_echue' | 'resolu'
    rapport_avancement?: any[]
    jours_restants?: number
}

/**
 * Get status emoji
 */
export function getStatusEmoji(statut: string): string {
    switch (statut) {
        case 'en_retard':
            return '🔴'
        case 'non_echue':
            return '🟡'
        case 'resolu':
            return '🟢'
        default:
            return '⚪'
    }
}

/**
 * Get status label in French
 */
export function getStatusLabel(statut: string): string {
    switch (statut) {
        case 'en_retard':
            return 'En retard'
        case 'non_echue':
            return 'Non échue'
        case 'resolu':
            return 'Résolu'
        default:
            return 'Inconnu'
    }
}

/**
 * Format a single signalement for WhatsApp
 */
export function formatSignalementForWhatsApp(sig: SignalementData): string {
    const emoji = getStatusEmoji(sig.statut)
    const statusLabel = getStatusLabel(sig.statut)

    let message = `${emoji} *${sig.signalement_id}*\n\n`
    message += `📋 *Item:* ${sig.item}\n`
    message += `🌍 *Pays:* ${sig.pays}\n`
    message += `🏗️ *Chantier:* ${sig.chantier}\n`
    message += `⚠️ *Problème:* ${sig.probleme}\n`
    message += `✅ *Action:* ${sig.action_entreprendre}\n`
    message += `📂 *Section:* ${sig.section}\n`
    message += `👤 *Responsable:* ${sig.personne_chargee}\n`
    message += `📅 *Début:* ${formatDate(sig.date_debut)}\n`
    message += `⏰ *Échéance:* ${formatDate(sig.date_echeance)}\n`
    message += `⏱️ *Durée:* ${sig.duree_jours} jours\n`
    message += `📊 *Statut:* ${emoji} ${statusLabel}`

    if (sig.jours_restants !== undefined) {
        if (sig.statut === 'en_retard') {
            message += ` (${Math.abs(sig.jours_restants)} jours de retard)`
        } else if (sig.statut === 'non_echue') {
            message += ` (${sig.jours_restants} jours restants)`
        }
    }

    // Add latest progress report if exists
    if (sig.rapport_avancement && sig.rapport_avancement.length > 0) {
        const latest = sig.rapport_avancement[sig.rapport_avancement.length - 1]
        message += `\n\n📝 *Dernier rapport:*\n${latest.texte}`
        message += `\n_${formatDate(latest.date)} - ${latest.auteur}_`
    }

    return message
}

/**
 * Format Top 20 summary for WhatsApp
 */
export function formatTop20ForWhatsApp(
    signalements: SignalementData[],
    stats: {
        en_retard: number
        non_echus: number
        resolus: number
    }
): string {
    let message = `📊 *TOP 20 SIGNALEMENTS*\n\n`

    // Statistics
    message += `🔴 En retard: *${stats.en_retard}*\n`
    message += `🟡 Non échus: *${stats.non_echus}*\n`
    message += `🟢 Résolus récents: *${stats.resolus}*\n\n`

    // Top items (show first 5 in detail)
    message += `*🔝 Top 5:*\n\n`

    signalements.slice(0, 5).forEach((sig, index) => {
        const emoji = getStatusEmoji(sig.statut)
        const retard = sig.statut === 'en_retard' && sig.jours_restants
            ? ` (${Math.abs(sig.jours_restants)}j retard)`
            : ''
        const restant = sig.statut === 'non_echue' && sig.jours_restants
            ? ` (${sig.jours_restants}j restants)`
            : ''

        message += `${index + 1}. ${emoji} *${sig.signalement_id}*\n`
        message += `   ${sig.probleme.substring(0, 60)}${sig.probleme.length > 60 ? '...' : ''}\n`
        message += `   📍 ${sig.chantier}${retard}${restant}\n\n`
    })

    if (signalements.length > 5) {
        message += `_... et ${signalements.length - 5} autres signalements_\n\n`
    }

    return message
}

/**
 * Format table data for WhatsApp (simplified view)
 */
export function formatTableForWhatsApp(
    data: any[],
    columns: { key: string; label: string }[],
    maxRows: number = 10
): string {
    if (data.length === 0) {
        return '📋 Aucune donnée disponible.'
    }

    let message = `📊 *Résultats* (${data.length} total)\n\n`

    data.slice(0, maxRows).forEach((row, index) => {
        message += `*${index + 1}.*\n`
        columns.forEach(col => {
            const value = row[col.key]
            if (value !== null && value !== undefined) {
                message += `  • ${col.label}: ${formatValue(value)}\n`
            }
        })
        message += '\n'
    })

    if (data.length > maxRows) {
        message += `_... et ${data.length - maxRows} autres résultats_\n`
    }

    return message
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A'

    const date = new Date(dateStr)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()

    return `${day}/${month}/${year}`
}

/**
 * Format value for display
 */
function formatValue(value: any): string {
    if (value === null || value === undefined) return 'N/A'
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
    if (typeof value === 'number') return value.toLocaleString('fr-FR')
    if (typeof value === 'string' && value.length > 100) {
        return value.substring(0, 97) + '...'
    }
    return String(value)
}

/**
 * Create WhatsApp message with magic link
 */
export function createMessageWithMagicLink(
    content: string,
    magicLinkUrl: string,
    linkText: string = 'Voir le tableau complet'
): string {
    return `${content}\n\n🔗 *${linkText}*\n${magicLinkUrl}`
}
