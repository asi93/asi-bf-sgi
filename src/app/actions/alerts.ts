'use server'

import { runAlertChecks } from '@/lib/alerts/engine'

export async function runManualAlertChecks() {
    try {
        const results = await runAlertChecks()
        return { success: true, results }
    } catch (error) {
        console.error('Manual alert check error:', error)
        return { success: false, error: 'Failed to run alert checks' }
    }
}
