import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

// Cache simple en mémoire (30 minutes)
const cache = new Map<string, { data: AIInsight[]; timestamp: number }>()
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

export interface AIInsight {
    type: 'critical' | 'warning' | 'info' | 'success'
    title: string
    message: string
    action?: {
        label: string
        href: string
    }
    relatedModules?: string[]
}

interface Stats {
    projets: { total: number; en_cours: number; montant_total: number }
    finances: { taux_execution: number; liquidations_total: number; engagements_total: number }
    stocks: { articles_alerte: number; total_articles: number; valeur_totale: number }
    equipements: { total: number; en_service: number; en_maintenance: number }
    incidents: { total: number; ouverts: number; impact_financier: number }
    alertes: { total: number; haute: number; moyenne: number }
}

function getCacheKey(stats: Stats): string {
    // Hash simple des stats principales
    return JSON.stringify({
        p: stats.projets.en_cours,
        f: stats.finances.taux_execution,
        s: stats.stocks.articles_alerte,
        e: stats.equipements.en_maintenance,
        i: stats.incidents.ouverts,
    })
}

function getFromCache(key: string): AIInsight[] | null {
    const cached = cache.get(key)
    if (!cached) return null

    const age = Date.now() - cached.timestamp
    if (age > CACHE_DURATION) {
        cache.delete(key)
        return null
    }

    return cached.data
}

function setCache(key: string, data: AIInsight[]) {
    cache.set(key, { data, timestamp: Date.now() })
}

function generateFallbackInsights(stats: Stats): AIInsight[] {
    const insights: AIInsight[] = []

    // Insight stocks critiques
    if (stats.stocks.articles_alerte > 0) {
        insights.push({
            type: 'critical',
            title: 'Stocks critiques détectés',
            message: `${stats.stocks.articles_alerte} article(s) en alerte nécessitent un réapprovisionnement immédiat.`,
            action: {
                label: 'Voir stocks',
                href: '/stocks',
            },
            relatedModules: ['stocks'],
        })
    }

    // Insight équipements en maintenance
    if (stats.equipements.en_maintenance > 3) {
        insights.push({
            type: 'warning',
            title: 'Taux de maintenance élevé',
            message: `${stats.equipements.en_maintenance} équipements en maintenance sur ${stats.equipements.total}. Cela peut impacter les projets.`,
            action: {
                label: 'Voir équipements',
                href: '/equipements',
            },
            relatedModules: ['equipements'],
        })
    }

    // Insight incidents ouverts
    if (stats.incidents.ouverts > 5) {
        insights.push({
            type: 'warning',
            title: 'Incidents en attente',
            message: `${stats.incidents.ouverts} incident(s) ouvert(s) nécessitent une action. Impact financier estimé: ${(stats.incidents.impact_financier / 1000000).toFixed(1)}M FCFA.`,
            action: {
                label: 'Voir incidents',
                href: '/signalements',
            },
            relatedModules: ['signalements'],
        })
    }

    // Insight positif si tout va bien
    if (insights.length === 0) {
        insights.push({
            type: 'success',
            title: 'Opérations normales',
            message: `${stats.projets.en_cours} projet(s) en cours avec un taux d'exécution de ${stats.finances.taux_execution}%. Aucune alerte critique détectée.`,
        })
    }

    return insights.slice(0, 4)
}

async function generateGPTInsights(stats: Stats): Promise<AIInsight[]> {
    const prompt = `Tu es un analyste BI expert en gestion de projets BTP en Afrique francophone.

**Contexte actuel** :
- Projets : ${stats.projets.total} total (${stats.projets.en_cours} en cours, montant: ${(stats.projets.montant_total / 1000000).toFixed(1)}M FCFA)
- Exécution budget : ${stats.finances.taux_execution}% (${(stats.finances.liquidations_total / 1000000).toFixed(1)}M FCFA liquidés sur ${(stats.finances.engagements_total / 1000000).toFixed(1)}M engagés)
- Stocks : ${stats.stocks.articles_alerte} article(s) en alerte sur ${stats.stocks.total_articles} total (valeur: ${(stats.stocks.valeur_totale / 1000000).toFixed(1)}M FCFA)
- Équipements : ${stats.equipements.en_maintenance} en maintenance sur ${stats.equipements.total} total (${stats.equipements.en_service} en service)
- Incidents : ${stats.incidents.ouverts} ouverts sur ${stats.incidents.total} total (impact: ${(stats.incidents.impact_financier / 1000000).toFixed(1)}M FCFA)
- Alertes : ${stats.alertes.total} (${stats.alertes.haute} haute priorité, ${stats.alertes.moyenne} moyenne)

**Mission** :
Génère 3-4 insights actionnables maximum pour un directeur. Sois concis, précis et professionnel.

**Types d'insights** :
- "critical" : Problème urgent nécessitant action immédiate
- "warning" : Attention requise, risque moyen terme
- "info" : Information importante, pas urgent
- "success" : Performance positive à souligner

**Format JSON strict** :
{
  "insights": [
    {
      "type": "critical|warning|info|success",
      "title": "Titre court (max 60 car)",
      "message": "Message détaillé mais concis (max 150 car)",
      "action": {
        "label": "Action à faire",
        "href": "/module"
      },
      "relatedModules": ["stocks", "projets", "equipements", "signalements", "gife"]
    }
  ]
}

Réponds UNIQUEMENT avec le JSON, sans markdown ni texte additionnel.`

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            max_tokens: 600,
            temperature: 0.7,
        })

        const content = response.choices[0].message.content
        if (!content) throw new Error('Empty response from OpenAI')

        const parsed = JSON.parse(content)
        const insights = parsed.insights || []

        // Validation basique
        if (!Array.isArray(insights) || insights.length === 0) {
            throw new Error('Invalid insights format')
        }

        // Log usage pour tracking coût
        console.log('[AI Insights] Tokens used:', {
            prompt: response.usage?.prompt_tokens,
            completion: response.usage?.completion_tokens,
            total: response.usage?.total_tokens,
            cost: ((response.usage?.total_tokens || 0) / 1000000) * 0.15, // GPT-4o-mini pricing
        })

        return insights.slice(0, 4)
    } catch (error) {
        console.error('[AI Insights] GPT error:', error)
        throw error
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { stats } = body as { stats: Stats }

        if (!stats) {
            return NextResponse.json({ error: 'Stats required' }, { status: 400 })
        }

        // Check cache
        const cacheKey = getCacheKey(stats)
        const cached = getFromCache(cacheKey)
        if (cached) {
            console.log('[AI Insights] Cache hit')
            return NextResponse.json({ insights: cached, cached: true })
        }

        // Generate insights with GPT
        let insights: AIInsight[]
        try {
            insights = await generateGPTInsights(stats)
        } catch (gptError) {
            console.warn('[AI Insights] Falling back to rule-based insights')
            insights = generateFallbackInsights(stats)
        }

        // Cache results
        setCache(cacheKey, insights)

        return NextResponse.json({ insights, cached: false })
    } catch (error) {
        console.error('[AI Insights] Error:', error)
        return NextResponse.json(
            { error: 'Failed to generate insights' },
            { status: 500 }
        )
    }
}
