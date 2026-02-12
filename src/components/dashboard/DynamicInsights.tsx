'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Sparkles,
    AlertTriangle,
    Info,
    CheckCircle,
    AlertCircle,
    RefreshCw,
    TrendingUp,
    ArrowRight
} from 'lucide-react'
import Link from 'next/link'

interface AIInsight {
    type: 'critical' | 'warning' | 'info' | 'success'
    title: string
    message: string
    action?: {
        label: string
        href: string
    }
    relatedModules?: string[]
}

interface DynamicInsightsProps {
    stats: any
    chartData?: any
}

export default function DynamicInsights({ stats, chartData }: DynamicInsightsProps) {
    const [insights, setInsights] = useState<AIInsight[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [isCached, setIsCached] = useState(false)

    const fetchInsights = async (force = false) => {
        if (force) setIsRefreshing(true)
        else setIsLoading(true)

        try {
            const response = await fetch('/api/insights/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stats, chartData }),
            })

            if (!response.ok) throw new Error('Failed to fetch insights')

            const data = await response.json()
            setInsights(data.insights || [])
            setIsCached(data.cached || false)
        } catch (error) {
            console.error('Error fetching insights:', error)
            // Fallback insights
            setInsights([
                {
                    type: 'info',
                    title: 'Analyse en cours',
                    message: 'Les insights IA seront disponibles sous peu.',
                },
            ])
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }

    useEffect(() => {
        if (stats) fetchInsights()
    }, [stats])

    const getInsightConfig = (type: AIInsight['type']) => {
        switch (type) {
            case 'critical':
                return {
                    icon: AlertCircle,
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    iconColor: 'text-red-600',
                    titleColor: 'text-red-900',
                    textColor: 'text-red-700',
                }
            case 'warning':
                return {
                    icon: AlertTriangle,
                    bg: 'bg-orange-50',
                    border: 'border-orange-200',
                    iconColor: 'text-orange-600',
                    titleColor: 'text-orange-900',
                    textColor: 'text-orange-700',
                }
            case 'success':
                return {
                    icon: CheckCircle,
                    bg: 'bg-green-50',
                    border: 'border-green-200',
                    iconColor: 'text-green-600',
                    titleColor: 'text-green-900',
                    textColor: 'text-green-700',
                }
            default: // info
                return {
                    icon: Info,
                    bg: 'bg-blue-50',
                    border: 'border-blue-200',
                    iconColor: 'text-blue-600',
                    titleColor: 'text-blue-900',
                    textColor: 'text-blue-700',
                }
        }
    }

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        <CardTitle>Insights IA</CardTitle>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchInsights(true)}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
                <CardDescription>
                    Analyses intelligentes générées par IA
                    {isCached && <span className="text-xs ml-2">(cache 30min)</span>}
                </CardDescription>
            </CardHeader>

            <CardContent>
                {isLoading ? (
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="h-24 bg-gray-100 rounded-lg"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {insights.map((insight, index) => {
                            const config = getInsightConfig(insight.type)
                            const Icon = config.icon

                            return (
                                <div
                                    key={index}
                                    className={`p-4 ${config.bg} border ${config.border} rounded-lg transition-all hover:shadow-md`}
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <div className="flex items-start gap-3">
                                        <Icon className={`h-5 w-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
                                        <div className="flex-1 min-w-0">
                                            <h4 className={`font-semibold ${config.titleColor} text-sm mb-1`}>
                                                {insight.title}
                                            </h4>
                                            <p className={`text-sm ${config.textColor} leading-relaxed`}>
                                                {insight.message}
                                            </p>

                                            {insight.action && (
                                                <Link href={insight.action.href}>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className={`mt-2 h-8 ${config.iconColor} hover:${config.bg}`}
                                                    >
                                                        {insight.action.label}
                                                        <ArrowRight className="h-3 w-3 ml-1" />
                                                    </Button>
                                                </Link>
                                            )}

                                            {insight.relatedModules && insight.relatedModules.length > 0 && (
                                                <div className="flex gap-1 mt-2">
                                                    {insight.relatedModules.map((module) => (
                                                        <span
                                                            key={module}
                                                            className={`text-xs px-2 py-0.5 rounded ${config.bg} ${config.textColor} border ${config.border}`}
                                                        >
                                                            {module}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}

                        {insights.length === 0 && (
                            <div className="text-center py-8 text-gray-400">
                                <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Aucun insight disponible pour le moment</p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
