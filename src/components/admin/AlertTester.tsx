'use client'

import React, { useState } from 'react'
import { Bell, Play, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { sendWhatsAppTemplate } from '@/lib/whatsapp/client' // Import to verify compilation

export default function AlertTester() {
    const [isRunning, setIsRunning] = useState(false)
    const [result, setResult] = useState<any>(null)

    const runTest = async () => {
        setIsRunning(true)
        setResult(null)
        try {
            // Simulate API call
            // In real scenario this would call /api/cron/alerts
            await new Promise(resolve => setTimeout(resolve, 2000))

            setResult({
                success: true,
                results: {
                    checks: 12,
                    alertsCreated: 1,
                    notificationsSent: 1,
                    details: [
                        "Alerte Stock: Ciment (Rupture)",
                        "Alerte Budget: Projet Route A4 (105%)",
                        "Notification WhatsApp envoyée"
                    ]
                }
            })
        } catch (error) {
            setResult({ success: false, error: 'Erreur lors du test' })
        } finally {
            setIsRunning(false)
        }
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-gray-900">Testeur d'Alertes & Cron</h3>
                </div>
                <button
                    onClick={runTest}
                    disabled={isRunning}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                    {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    {isRunning ? 'Exécution...' : 'Lancer le moteur'}
                </button>
            </div>

            {result && (
                <div className={`p-4 rounded-lg border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-start gap-3">
                        {result.success ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        ) : (
                            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                        )}
                        <div>
                            <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                                {result.success ? 'Moteur exécuté avec succès' : 'Erreur d\'exécution'}
                            </p>
                            {result.success && (
                                <div className="mt-2 text-sm text-green-700 space-y-1">
                                    <p>• {result.results.checks} règles vérifiées</p>
                                    <p>• {result.results.alertsCreated} alertes créées</p>
                                    <p>• {result.results.notificationsSent} notifications envoyées</p>
                                    {result.results.details && (
                                        <div className="mt-2 p-2 bg-white/50 rounded text-xs font-mono">
                                            {result.results.details.map((d: string, i: number) => (
                                                <div key={i}>{d}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-4 text-xs text-gray-500">
                <p>Simulation du CRON job quotidien. Vérifie les stocks, budgets et incidents.</p>
                <p className="mt-1">Note: Pour activer les vraies notifications, configurez RESEND_API_KEY et les templates WhatsApp.</p>
            </div>
        </div>
    )
}
