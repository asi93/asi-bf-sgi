import { NextRequest, NextResponse } from 'next/server'
import { validateMagicLink } from '@/lib/magic-links/generator'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    const { token } = await params

    if (!token) {
        return NextResponse.redirect(new URL('/error?message=Token manquant', request.url))
    }

    try {
        const result = await validateMagicLink(token)

        if (!result.isValid) {
            return NextResponse.redirect(
                new URL(`/error?message=${encodeURIComponent(result.error || 'Lien invalide')}`, request.url)
            )
        }

        const { resourceType, resourceId, filters } = result

        // Determine target URL based on resource type
        let targetUrl = '/'

        switch (resourceType) {
            case 'signalement_detail':
                targetUrl = `/signalements/view?id=${resourceId}`
                break
            case 'top20':
                targetUrl = '/signalements?view=top20'
                break
            case 'signalements_table':
                targetUrl = '/signalements'
                break
            default:
                targetUrl = '/'
        }

        // Append filters if present
        if (filters && Object.keys(filters).length > 0) {
            const url = new URL(targetUrl, request.url)
            Object.entries(filters).forEach(([key, value]) => {
                url.searchParams.append(key, String(value))
            })
            targetUrl = url.toString()
        }

        return NextResponse.redirect(new URL(targetUrl, request.url))
    } catch (error) {
        console.error('Magic Link Error:', error)
        return NextResponse.redirect(new URL('/error?message=Erreur interne', request.url))
    }
}
