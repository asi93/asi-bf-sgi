/**
 * Client Email avec Resend
 * Pour envoyer des alertes et rapports automatiques
 */

interface EmailParams {
  to: string | string[]
  subject: string
  html: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
  }>
}

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@asi-bf.com'

if (!RESEND_API_KEY) {
  console.warn('⚠️ RESEND_API_KEY non configuré - emails désactivés')
}

/**
 * Envoyer un email via Resend
 */
export async function sendEmail(params: EmailParams): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn('⚠️ Email non envoyé - RESEND_API_KEY manquant')
    return
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
        html: params.html,
        attachments: params.attachments,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Erreur Resend API:', response.status, error)
      throw new Error(`Resend API error: ${response.status}`)
    }

    const result = await response.json()
    console.log('✅ Email envoyé:', result)

  } catch (error) {
    console.error('❌ Erreur envoi email:', error)
    throw error
  }
}

/**
 * Template HTML de base
 */
export function createBaseEmailTemplate(
  title: string,
  content: string,
  footer?: string
): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    h1 {
      color: #1e40af;
      margin: 0;
      font-size: 24px;
    }
    .content {
      margin: 20px 0;
    }
    .stat-box {
      background: #f8fafc;
      border-left: 4px solid #2563eb;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    .stat-box strong {
      color: #1e40af;
    }
    .alert {
      background: #fef2f2;
      border-left: 4px solid #dc2626;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    .success {
      background: #f0fdf4;
      border-left: 4px solid #16a34a;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #6b7280;
      text-align: center;
    }
    .button {
      display: inline-block;
      background: #2563eb;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    ${footer ? `<div class="footer">${footer}</div>` : ''}
    <div class="footer">
      <p>ASI-BF Système de Gestion Intégré<br>
      Cette alerte est générée automatiquement</p>
    </div>
  </div>
</body>
</html>
  `
}
