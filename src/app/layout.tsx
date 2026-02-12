import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ASI-TRACK - Suivi Intelligent des Operations',
  description: 'ASI-TRACK - Plateforme de suivi intelligent des projets et operations BTP',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className="antialiased bg-gray-50">
        {children}
      </body>
    </html>
  )
}
