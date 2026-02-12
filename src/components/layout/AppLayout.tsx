'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Camera,
  LayoutDashboard,
  FolderKanban,
  Package,
  Truck,
  FileText,
  AlertTriangle,
  Shield,
  Ship,
  Users,
  Settings,
  Bell,
  Menu,
  X,
  RefreshCw,
  MapPin,
  ShoppingCart,
  FileCheck,
  MessageSquare,
  Bot
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import ChatInterface from '@/components/chat/ChatInterface'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navItems = [
  { name: 'Tableau de Bord', icon: LayoutDashboard, href: '/' },
  { name: 'Projets', icon: FolderKanban, href: '/projets' },
  { name: 'Marchés (GESMA)', icon: FileCheck, href: '/marches' },
  { name: 'Finances (GIFE)', icon: FileText, href: '/finances' },
  { name: 'Stocks (GIS)', icon: Package, href: '/stocks' },
  { name: 'Équipements (GIFL)', icon: Truck, href: '/equipements' },
  { name: 'Missions (GIOM)', icon: MapPin, href: '/missions' },
  { name: 'Commandes (GIC)', icon: ShoppingCart, href: '/commandes' },
  { name: 'Incidents (GIH)', icon: AlertTriangle, href: '/incidents' },
  { name: 'Galerie Média', icon: Camera, href: '/gallery' },
  { name: 'Assurances (GIASS)', icon: Shield, href: '/assurances' },
  { name: 'Imports', icon: Ship, href: '/imports' },
  { name: 'RH (GIDE)', icon: Users, href: '/rh' },
  { name: 'Signalements', icon: FileText, href: '/signalements' },
]

interface AppLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  onRefresh?: () => void
  isLoading?: boolean
}

export default function AppLayout({ children, title, subtitle, onRefresh, isLoading }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AT</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900">ASI-TRACK</h1>
              <p className="text-xs text-gray-500">Suivi Intelligent</p>
            </div>
          </Link>
          <button
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : ''}`} />
                <span className="flex-1">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200 bg-white">
          <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100">
            <Settings className="w-5 h-5" />
            <span>Paramètres</span>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-semibold text-gray-900">{title || 'Tableau de Bord'}</h2>
              {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
            )}
            <button className="relative p-2 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">AD</span>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          {children}
        </main>

        {/* Floating AI Chat Toggle */}
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setIsChatOpen(!isChatOpen)}
            size="lg"
            className={cn(
              "h-14 w-14 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110",
              isChatOpen ? "bg-red-500 hover:bg-red-600 rotate-90" : "bg-primary-600 hover:bg-primary-700"
            )}
          >
            {isChatOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
          </Button>

          {/* Chat Interface Overlay */}
          {isChatOpen && (
            <div className="absolute bottom-16 right-0 w-[400px] h-[600px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-8rem)] animate-in slide-in-from-bottom-5 duration-300">
              <ChatInterface />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
