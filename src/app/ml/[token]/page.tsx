import { notFound } from 'next/navigation'
import { MagicLinkViewer } from '@/components/magic-links/MagicLinkViewer'
import { validateMagicLink } from '@/lib/magic-links/generator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export default async function MagicLinkPage({
    params,
}: {
    params: Promise<{ token: string }>
}) {
    const { token } = await params

    if (!token) notFound()

    try {
        const result = await validateMagicLink(token)

        if (!result.isValid) {
            return (
                <div className="flex h-screen items-center justify-center p-4 bg-gray-50">
                    <Alert variant="destructive" className="max-w-md shadow-xl bg-white border-red-200">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Lien invalide ou expiré</AlertTitle>
                        <AlertDescription>
                            Ce lien magique n'est plus valide. Veuillez en demander un nouveau à l'assistant.
                        </AlertDescription>
                    </Alert>
                </div>
            )
        }

        // Extract snapshot data from metadata
        // result type inferred from validateMagicLink which returns { isValid, error?, ...decodedPayload } 
        // + we assume logic inside validateMagicLink or the payload content matches what we stored.
        // Actually validateMagicLink usually checks DB.

        const toolName = result.metadata?.toolName || result.metadata?.toolsUsed?.[0] || 'custom'
        const snapshotData = result.metadata?.data || null

        return (
            <div className="min-h-screen bg-gray-50/50">
                <div className="container mx-auto py-12 px-4 max-w-7xl">
                    <div className="mb-10 text-center space-y-2">
                        <div className="inline-block p-3 rounded-full bg-blue-100 mb-4">
                            <span className="text-2xl">✨</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
                            Rapport Instantané
                        </h1>
                        <p className="text-muted-foreground font-medium">
                            Généré par l'Assistant SGI le {new Date().toLocaleDateString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
                        </p>

                        {!snapshotData && (
                            <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded-lg inline-block text-sm border border-yellow-200">
                                ⚠️ Ce lien ne contient pas d'instantané de données. Il a peut-être été généré avec une ancienne version de l'assistant.
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border p-1">
                        <MagicLinkViewer toolName={toolName} data={snapshotData} metadata={result.metadata} />
                    </div>

                    <div className="mt-12 text-center text-xs text-gray-400">
                        ASI-BF SGI • Système de Gestion Intégré
                    </div>
                </div>
            </div>
        )

    } catch (error) {
        console.error('Magic Link Page Error:', error)
        return (
            <div className="flex h-screen items-center justify-center p-4 bg-gray-50">
                <Alert variant="destructive" className="max-w-md bg-white shadow-lg">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erreur système</AlertTitle>
                    <AlertDescription>Impossible de charger les données du rapport. Veuillez réessayer plus tard.</AlertDescription>
                </Alert>
            </div>
        )
    }
}
