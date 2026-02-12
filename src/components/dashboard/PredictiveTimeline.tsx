'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Calendar,
    AlertCircle,
    AlertTriangle,
    Info,
    RefreshCw,
    Package,
    DollarSign,
    FileCheck,
    Wrench,
    ChevronDown,
    ChevronUp,
    ArrowRight,
} from 'lucide-react'
import Link from 'next/link'

interface TimelineEvent {
    id: string
    date: Date
    timeframe: '0-3j' | '3-7j' | '7-15j' | '15-30j'
    severity: 'critical' | 'warning' | 'info'
    category: 'stock' | 'budget' | 'compliance' | 'incident' | 'equipment'
    title: string
    description: string
    impact: {
        financial?: number
        operational?: string
    }
    action: {
        label: string
        href?: string
    }
}

export default function PredictiveTimeline() {
    const [events, setEvents] = useState<TimelineEvent[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['0-3j', '3-7j']))

    const fetchTimeline = async (force = false) => {
        if (force) setIsRefreshing(true)
        else setIsLoading(true)

        try {
            const response = await fetch('/api/timeline/predict')
            if (!response.ok) throw new Error('Failed to fetch timeline')

            const data = await response.json()
            setEvents(
                (data.events || []).map((e: any) => ({
                    ...e,
                    date: new Date(e.date),
                }))
            )
        } catch (error) {
            console.error('Error fetching timeline:', error)
            setEvents([])
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }

    useEffect(() => {
        fetchTimeline()
    }, [])

    const toggleSection = (timeframe: string) => {
        setExpandedSections((prev) => {
            const next = new Set(prev)
            if (next.has(timeframe)) {
                next.delete(timeframe)
            } else {
                next.add(timeframe)
            }
            return next
        })
    }

    const groupedEvents = {
        '0-3j': events.filter((e) => e.timeframe === '0-3j'),
        '3-7j': events.filter((e) => e.timeframe === '3-7j'),
        '7-15j': events.filter((e) => e.timeframe === '7-15j'),
        '15-30j': events.filter((e) => e.timeframe === '15-30j'),
    }

    const getSectionConfig = (timeframe: string) => {
        switch (timeframe) {
            case '0-3j':
                return {
                    label: '🔴 URGENT (0-3 jours)',
                    icon: AlertCircle,
                    bg: 'bg-red-50',
                    border: 'border-red-300',
                    textColor: 'text-red-800',
                    badgeColor: 'bg-red-500',
                }
            case '3-7j':
                return {
                    label: '🟠 ATTENTION (3-7 jours)',
                    icon: AlertTriangle,
                    bg: 'bg-orange-50',
                    border: 'border-orange-300',
                    textColor: 'text-orange-800',
                    badgeColor: 'bg-orange-500',
                }
            case '7-15j':
                return {
                    label: '🟡 SURVEILLER (7-15 jours)',
                    icon: AlertTriangle,
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-300',
                    textColor: 'text-yellow-800',
                    badgeColor: 'bg-yellow-500',
                }
            default:
                return {
                    label: '🟢 À PRÉVOIR (15-30 jours)',
                    icon: Info,
                    bg: 'bg-blue-50',
                    border: 'border-blue-300',
                    textColor: 'text-blue-800',
                    badgeColor: 'bg-blue-500',
                }
        }
    }

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'stock':
                return Package
            case 'budget':
                return DollarSign
            case 'compliance':
                return FileCheck
            case 'equipment':
                return Wrench
            default:
                return AlertCircle
        }
    }

    const formatImpact = (impact: TimelineEvent['impact']) => {
        const parts = []
        if (impact.financial) {
            parts.push(`💰 ${(impact.financial / 1000000).toFixed(1)}M FCFA`)
        }
        if (impact.operational) {
            parts.push(`⚙️ ${impact.operational}`)
        }
        return parts.join(' • ')
    }

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-purple-600" />
                        <CardTitle>Radar - Prochains 30 jours</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => fetchTimeline(true)} disabled={isRefreshing}>
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
                <CardDescription>
                    {events.length} événement(s) détecté(s) • Timeline prédictive
                </CardDescription>
            </CardHeader>

            <CardContent>
                {isLoading ? (
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="h-20 bg-gray-100 rounded-lg"></div>
                            </div>
                        ))}
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Aucun événement critique détecté</p>
                        <p className="text-xs mt-1">Le système fonctionne normalement</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(groupedEvents).map(([timeframe, timeframeEvents]) => {
                            if (timeframeEvents.length === 0) return null

                            const config = getSectionConfig(timeframe)
                            const isExpanded = expandedSections.has(timeframe)

                            return (
                                <div key={timeframe} className={`border ${config.border} rounded-lg overflow-hidden`}>
                                    {/* Section Header */}
                                    <button
                                        onClick={() => toggleSection(timeframe)}
                                        className={`w-full px-4 py-3 ${config.bg} flex items-center justify-between hover:opacity-80 transition`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={`font-semibold ${config.textColor}`}>{config.label}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${config.badgeColor} text-white`}>
                                                {timeframeEvents.length}
                                            </span>
                                        </div>
                                        {isExpanded ? (
                                            <ChevronUp className={`h-4 w-4 ${config.textColor}`} />
                                        ) : (
                                            <ChevronDown className={`h-4 w-4 ${config.textColor}`} />
                                        )}
                                    </button>

                                    {/* Events List */}
                                    {isExpanded && (
                                        <div className="divide-y">
                                            {timeframeEvents.map((event) => {
                                                const CategoryIcon = getCategoryIcon(event.category)

                                                return (
                                                    <div key={event.id} className="p-4 bg-white hover:bg-gray-50 transition">
                                                        <div className="flex items-start gap-3">
                                                            <div
                                                                className={`p-2 rounded-lg ${config.bg} ${config.border} border flex-shrink-0`}
                                                            >
                                                                <CategoryIcon className={`h-4 w-4 ${config.textColor}`} />
                                                            </div>

                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-semibold text-gray-900 text-sm">{event.title}</h4>
                                                                <p className="text-sm text-gray-600 mt-1">{event.description}</p>

                                                                {(event.impact.financial || event.impact.operational) && (
                                                                    <p className="text-xs text-gray-500 mt-2">{formatImpact(event.impact)}</p>
                                                                )}

                                                                {event.action.href ? (
                                                                    <Link href={event.action.href}>
                                                                        <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs">
                                                                            {event.action.label}
                                                                            <ArrowRight className="h-3 w-3 ml-1" />
                                                                        </Button>
                                                                    </Link>
                                                                ) : (
                                                                    <p className="text-xs text-gray-500 mt-2">▸ {event.action.label}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
