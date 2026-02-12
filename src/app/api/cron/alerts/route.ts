import { NextRequest, NextResponse } from 'next/server'
import { runAlertChecks } from '@/lib/alerts/engine'

export const dynamic = 'force-dynamic' // Ensure it runs every time

export async function GET(request: NextRequest) {
    // Verify authorization (simple CRON_SECRET check)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const results = await runAlertChecks()
        return NextResponse.json({
            success: true,
            results,
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error('Cron job error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
