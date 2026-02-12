'use client'

import React, { useState, useEffect } from 'react'
import { Bell, User, Mail, Phone, Save, Loader2 } from 'lucide-react'
// import { supabase } from '@/lib/supabase' // Uncomment when using real data

export default function UserPreferences() {
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [alertsEnabled, setAlertsEnabled] = useState(true)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    useEffect(() => {
        // Load existing preferences
        const loadPrefs = async () => {
            // In a real app we would get the current user session
            // For now we'll simulate loading global admin prefs
            // const supabase = createClient()
            // const { data } = await supabase.from('user_preferences').select('*').single()
            // if (data) { ... }
            setEmail('admin@asi-bf.com')
            setPhone('226XXXXXXXX')
        }
        loadPrefs()
    }, [])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')

        try {
            // Simulate save
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Real implementation:
            // await supabase.from('user_preferences').upsert({ email, phone, alerts_enabled: alertsEnabled })

            setMessage('Préférences sauvegardées avec succès !')
        } catch (error) {
            setMessage('Erreur lors de la sauvegarde.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-md mx-auto mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Préférences de Notification</h2>

            <form onSubmit={handleSave} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email pour les alertes</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="admin@exemple.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Numéro WhatsApp</label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="226XXXXXXXX"
                    />
                    <p className="text-xs text-gray-500 mt-1">Au format international sans le +</p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                    <input
                        type="checkbox"
                        id="alerts"
                        checked={alertsEnabled}
                        onChange={(e) => setAlertsEnabled(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="alerts" className="text-sm text-gray-700">Activer les alertes proactives</label>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors mt-4"
                >
                    {loading ? 'Sauvegarde...' : 'Sauvegarder les préférences'}
                </button>

                {message && (
                    <p className={`text-sm text-center mt-2 ${message.includes('succès') ? 'text-green-600' : 'text-red-600'}`}>
                        {message}
                    </p>
                )}
            </form>
        </div>
    )
}
