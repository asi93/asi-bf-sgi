/**
 * WhatsApp Interactive Messages Helpers
 * Fonctions pour créer facilement des boutons et listes WhatsApp
 */

/**
 * Type pour un message interactif WhatsApp
 */
export interface WhatsAppInteractive {
    type: 'button' | 'list' | 'product_list' | 'product'
    header?: {
        type: 'text' | 'image' | 'video' | 'document'
        text?: string
        [key: string]: any
    }
    body: {
        text: string
    }
    footer?: {
        text: string
    }
    action: {
        button?: string
        buttons?: Array<{
            type: 'reply'
            reply: {
                id: string
                title: string
            }
        }>
        sections?: Array<{
            title: string
            rows: Array<{
                id: string
                title: string
                description?: string
            }>
        }>
    }
}

/**
 * Créer un message avec boutons (max 3)
 * 
 * @param bodyText - Texte principal du message
 * @param buttons - Liste des boutons (max 3, titre max 20 caractères)
 * @param options - Options supplémentaires (header, footer)
 * 
 * @example
 * createButtonsMessage(
 *   "Que voulez-vous consulter ?",
 *   [
 *     { id: "stocks", title: "📦 Stocks" },
 *     { id: "projets", title: "🏗️ Projets" },
 *     { id: "incidents", title: "🚨 Incidents" }
 *   ],
 *   { header: "Menu Principal" }
 * )
 */
export function createButtonsMessage(
    bodyText: string,
    buttons: Array<{ id: string; title: string }>,
    options?: {
        header?: string
        footer?: string
    }
): WhatsAppInteractive {
    // Validation WhatsApp
    if (buttons.length === 0) {
        throw new Error('Au moins 1 bouton requis')
    }

    if (buttons.length > 3) {
        throw new Error('Maximum 3 boutons autorisés par WhatsApp')
    }

    // Valider les titres (max 20 caractères)
    buttons.forEach((btn, index) => {
        if (btn.title.length > 20) {
            console.warn(`⚠️ Bouton ${index + 1} tronqué : "${btn.title}" → "${btn.title.substring(0, 20)}"`)
            btn.title = btn.title.substring(0, 20)
        }
    })

    const interactive: WhatsAppInteractive = {
        type: 'button',
        body: {
            text: bodyText
        },
        action: {
            buttons: buttons.map(btn => ({
                type: 'reply',
                reply: {
                    id: btn.id,
                    title: btn.title
                }
            }))
        }
    }

    // Ajouter header si fourni
    if (options?.header) {
        interactive.header = {
            type: 'text',
            text: options.header
        }
    }

    // Ajouter footer si fourni
    if (options?.footer) {
        interactive.footer = {
            text: options.footer
        }
    }

    return interactive
}

/**
 * Créer un message avec liste déroulante
 * 
 * @param bodyText - Texte principal du message
 * @param buttonText - Texte du bouton pour ouvrir la liste
 * @param sections - Sections de la liste (max 10 sections, 10 rows/section)
 * @param options - Options supplémentaires (header, footer)
 * 
 * @example
 * createListMessage(
 *   "Sélectionnez un projet :",
 *   "Voir les projets",
 *   [
 *     {
 *       title: "En cours",
 *       rows: [
 *         { id: "P001", title: "Route Tenkodogo", description: "500M FCFA" },
 *         { id: "P002", title: "Pont Ouaga", description: "300M FCFA" }
 *       ]
 *     }
 *   ]
 * )
 */
export function createListMessage(
    bodyText: string,
    buttonText: string,
    sections: Array<{
        title: string
        rows: Array<{
            id: string
            title: string
            description?: string
        }>
    }>,
    options?: {
        header?: string
        footer?: string
    }
): WhatsAppInteractive {
    // Validation WhatsApp
    if (sections.length === 0) {
        throw new Error('Au moins 1 section requise')
    }

    if (sections.length > 10) {
        throw new Error('Maximum 10 sections autorisées par WhatsApp')
    }

    // Valider chaque section
    sections.forEach((section, sectionIndex) => {
        if (section.rows.length === 0) {
            throw new Error(`Section ${sectionIndex + 1} doit avoir au moins 1 row`)
        }

        if (section.rows.length > 10) {
            console.warn(`⚠️ Section "${section.title}" tronquée à 10 rows (avait ${section.rows.length})`)
            section.rows = section.rows.slice(0, 10)
        }

        // Valider les rows
        section.rows.forEach((row, rowIndex) => {
            // Titre max 24 caractères
            if (row.title.length > 24) {
                console.warn(`⚠️ Row ${rowIndex + 1} titre tronqué : "${row.title}" → "${row.title.substring(0, 24)}"`)
                row.title = row.title.substring(0, 24)
            }

            // Description max 72 caractères
            if (row.description && row.description.length > 72) {
                console.warn(`⚠️ Row ${rowIndex + 1} description tronquée`)
                row.description = row.description.substring(0, 72)
            }
        })
    })

    // Valider buttonText (max 20 caractères)
    if (buttonText.length > 20) {
        console.warn(`⚠️ Button text tronqué : "${buttonText}" → "${buttonText.substring(0, 20)}"`)
        buttonText = buttonText.substring(0, 20)
    }

    const interactive: WhatsAppInteractive = {
        type: 'list',
        body: {
            text: bodyText
        },
        action: {
            button: buttonText,
            sections: sections
        }
    }

    // Ajouter header si fourni
    if (options?.header) {
        interactive.header = {
            type: 'text',
            text: options.header
        }
    }

    // Ajouter footer si fourni
    if (options?.footer) {
        interactive.footer = {
            text: options.footer
        }
    }

    return interactive
}

/**
 * Crée la réponse de salutation avec un seul bouton "Menu"
 */
export function createGreetingResponse(): WhatsAppInteractive {
    return createButtonsMessage(
        "👋 Bonjour ! Je suis l'assistant SGI.\n\nVous pouvez :\n• Me poser des questions en langage naturel\n• Accéder au menu d'actions rapides",
        [{ id: 'menu', title: '📋 Menu' }],
        { footer: 'ASI-BF SGI' }
    )
}

/**
 * Menu d'actions rapides (format liste)
 */
export function createActionMenu(): WhatsAppInteractive {
    return createListMessage(
        'Sélectionnez une action rapide :',
        'Voir actions',
        [
            {
                title: '🚨 Besoins & Incidents',
                rows: [
                    { id: 'action_signaler_incident', title: 'Signaler un incident', description: 'Créer un nouveau signalement' },
                    { id: 'action_carte_incidents', title: 'Carte des incidents', description: 'Voir la liste des incidents' }
                ]
            },
            {
                title: '📸 Médias',
                rows: [
                    { id: 'action_galerie', title: 'Galerie photos', description: 'Voir les photos par projet' }
                ]
            },
            {
                title: '💡 Intelligence',
                rows: [
                    { id: 'action_insights_ia', title: '💡 Insights IA', description: 'Analyses intelligentes' },
                    { id: 'action_timeline_risques', title: '📅 Prochains Risques', description: 'Timeline prédictive 30j' }
                ]
            },
            {
                title: '📊 KPIs & Analyses',
                rows: [
                    { id: 'action_kpis', title: 'KPIs globaux', description: 'Vue d\'ensemble complète' },
                    { id: 'action_projets', title: 'État des projets', description: 'Suivi des projets en cours' },
                    { id: 'action_stocks', title: 'État des stocks', description: 'Alertes et disponibilité' },
                    { id: 'action_equipements', title: 'Parc équipements', description: 'Disponibilité et maintenance' },
                    { id: 'action_gife', title: 'Analyse financière', description: 'Dépenses et budgets' },
                    { id: 'action_assistance', title: 'Assistance IA', description: 'Poser une question' }
                ]
            }
        ],
        {
            header: '📋 Menu Actions Rapides',
            footer: 'ASI-BF SGI'
        }
    )
}

/**
 * @deprecated Use createGreetingResponse and createActionMenu instead
 * Créer un menu principal avec boutons
 */
export function createMainMenu(): WhatsAppInteractive {
    return createButtonsMessage(
        "Que puis-je faire pour vous aujourd'hui ?",
        [
            { id: 'menu_stocks', title: '📦 Stocks' },
            { id: 'menu_projets', title: '🏗️ Projets' },
            { id: 'menu_incidents', title: '🚨 Incidents' }
        ],
        {
            header: 'Menu Principal SGI',
            footer: 'ASI-BF • Système de Gestion Intégré'
        }
    )
}

/**
 * Créer des boutons d'actions rapides
 */
export function createQuickActions(context: {
    type: 'project' | 'incident' | 'stock'
    id: string
    magicLink?: string
}): WhatsAppInteractive {
    const buttons: Array<{ id: string; title: string }> = []

    if (context.type === 'project') {
        buttons.push(
            { id: `finances_${context.id}`, title: '💰 Finances' },
            { id: `details_${context.id}`, title: '📊 Détails' }
        )
    } else if (context.type === 'incident') {
        buttons.push(
            { id: `resolve_${context.id}`, title: '✅ Résoudre' },
            { id: `details_${context.id}`, title: '📋 Détails' }
        )
    } else if (context.type === 'stock') {
        buttons.push(
            { id: `order_${context.id}`, title: '🛒 Commander' },
            { id: `details_${context.id}`, title: '📦 Détails' }
        )
    }

    // Ajouter bouton Magic Link si disponible
    if (context.magicLink && buttons.length < 3) {
        buttons.push({ id: 'view_web', title: '🔗 Voir sur Web' })
    }

    return createButtonsMessage(
        'Actions disponibles :',
        buttons,
        { footer: 'Sélectionnez une action' }
    )
}
