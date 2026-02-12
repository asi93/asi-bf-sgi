/**
 * Client WhatsApp Business API
 * Fonctions pour envoyer des messages WhatsApp
 */

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN

if (!WHATSAPP_ACCESS_TOKEN) {
  console.warn('⚠️ WHATSAPP_ACCESS_TOKEN non configuré')
}

/**
 * Envoyer un message texte WhatsApp
 */
export async function sendWhatsAppMessage(
  to: string,
  phoneNumberId: string,
  text: string
): Promise<void> {
  if (!WHATSAPP_ACCESS_TOKEN) {
    throw new Error('WHATSAPP_ACCESS_TOKEN non configuré')
  }

  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`

  console.log(`📤 Envoi WhatsApp vers ${to} (via ${phoneNumberId})`)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: {
          preview_url: false,
          body: text,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ raw: 'Failed to parse error JSON' }))
      console.error('❌ Erreur WhatsApp API:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      throw new Error(`WhatsApp API error: ${response.status} - ${JSON.stringify(errorData)}`)
    }

    const result = await response.json()
    console.log('✅ Message WhatsApp envoyé:', result)

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi WhatsApp:', error)
    throw error
  }
}

/**
 * Envoyer un message WhatsApp proactif (alerte, notification)
 * Utilise un phone_number_id configuré par défaut
 */
export async function sendProactiveMessage(
  to: string,
  text: string
): Promise<void> {
  const defaultPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!defaultPhoneNumberId) {
    throw new Error('WHATSAPP_PHONE_NUMBER_ID non configuré pour messages proactifs')
  }

  await sendWhatsAppMessage(to, defaultPhoneNumberId, text)
}

/**
 * Formater un message d'alerte WhatsApp
 */
export function formatAlertMessage(
  title: string,
  message: string,
  priority: 'haute' | 'moyenne' | 'basse',
  module?: string
): string {
  const emoji = priority === 'haute' ? '🚨' : priority === 'moyenne' ? '⚠️' : 'ℹ️'

  let formattedMessage = `${emoji} *${title}*\n\n`
  formattedMessage += message

  if (module) {
    formattedMessage += `\n\n📊 Module : ${module}`
  }

  formattedMessage += `\n\n_Alerte ASI-BF SGI_`

  return formattedMessage
}

/**
 * Formater un rapport WhatsApp
 */
export function formatReportMessage(
  title: string,
  stats: Array<{ label: string; value: string | number }>,
  footer?: string
): string {
  let message = `📊 *${title}*\n\n`

  stats.forEach(stat => {
    message += `• ${stat.label}: *${stat.value}*\n`
  })

  if (footer) {
    message += `\n${footer}`
  }

  return message
}

/**
 * Envoyer un message Template WhatsApp
 */
export async function sendWhatsAppTemplate(
  to: string,
  phoneNumberId: string,
  templateName: string,
  languageCode: string = 'fr',
  components: any[] = []
): Promise<void> {
  if (!WHATSAPP_ACCESS_TOKEN) {
    throw new Error('WHATSAPP_ACCESS_TOKEN non configuré')
  }

  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`

  console.log(`📤 Envoi Template WhatsApp "${templateName}" vers ${to}`)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode
          },
          components: components
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ raw: 'Failed to parse error JSON' }))
      console.error('❌ Erreur WhatsApp Template API:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      throw new Error(`WhatsApp API error: ${response.status} - ${JSON.stringify(errorData)}`)
    }

    const result = await response.json()
    console.log('✅ Template WhatsApp envoyé:', result)

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du template WhatsApp:', error)
    throw error
  }
}

/**
 * Envoyer un message Interactif WhatsApp (Boutons ou Listes)
 */
export async function sendWhatsAppInteractiveMessage(
  to: string,
  phoneNumberId: string,
  interactive: {
    type: 'button' | 'list' | 'product_list' | 'product';
    header?: { type: 'text' | 'image' | 'video' | 'document'; text?: string;[key: string]: any };
    body: { text: string };
    footer?: { text: string };
    action: {
      button?: string;
      buttons?: Array<{ type: 'reply'; reply: { id: string; title: string } }>;
      sections?: Array<{ title: string; rows: Array<{ id: string; title: string; description?: string }> }>;
    };
  }
): Promise<void> {
  if (!WHATSAPP_ACCESS_TOKEN) {
    throw new Error('WHATSAPP_ACCESS_TOKEN non configuré')
  }

  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`

  console.log(`📤 Envoi Message Interactif vers ${to}`)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'interactive',
        interactive: interactive
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ raw: 'Failed to parse error JSON' }))
      console.error('❌ Erreur WhatsApp Interactive API:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      throw new Error(`WhatsApp API error: ${response.status} - ${JSON.stringify(errorData)}`)
    }

    const result = await response.json()
    console.log('✅ Message Interactif envoyé:', result)

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du message interactif:', error)
    throw error
  }
}
