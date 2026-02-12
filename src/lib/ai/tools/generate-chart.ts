import { createServerClient } from '@/lib/supabase'

export interface ChartData {
    label: string
    value: number
}

export interface ChartConfig {
    type: 'bar' | 'line' | 'pie' | 'scatter' | 'area'
    title: string
    data: ChartData[]
    xAxisLabel?: string
    yAxisLabel?: string
    colors?: string[]
}

/**
 * Generate a chart using QuickChart.io API
 * Returns a URL to the generated chart image
 */
export async function generateChart(config: ChartConfig): Promise<string> {
    const { type, title, data, xAxisLabel, yAxisLabel, colors } = config

    // Default color palette (professional blues/greens)
    const defaultColors = [
        '#3B82F6', // blue-500
        '#10B981', // green-500
        '#F59E0B', // amber-500
        '#EF4444', // red-500
        '#8B5CF6', // purple-500
        '#EC4899', // pink-500
        '#14B8A6', // teal-500
        '#F97316', // orange-500
    ]

    const chartColors = colors || defaultColors

    // Build Chart.js configuration
    const chartConfig: any = {
        type,
        data: {
            labels: data.map(d => d.label),
            datasets: [{
                label: title,
                data: data.map(d => d.value),
                backgroundColor: type === 'pie' ? chartColors : chartColors[0] + '80', // 80 = 50% opacity
                borderColor: chartColors[0],
                borderWidth: 2,
                fill: type === 'area'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: title,
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: type === 'pie',
                    position: 'bottom'
                }
            },
            scales: type !== 'pie' ? {
                x: {
                    title: {
                        display: !!xAxisLabel,
                        text: xAxisLabel || ''
                    }
                },
                y: {
                    title: {
                        display: !!yAxisLabel,
                        text: yAxisLabel || ''
                    },
                    beginAtZero: true
                }
            } : undefined
        }
    }

    // Encode chart config for QuickChart.io
    const chartConfigEncoded = encodeURIComponent(JSON.stringify(chartConfig))

    // QuickChart.io URL (free tier, no API key needed)
    const quickChartUrl = `https://quickchart.io/chart?c=${chartConfigEncoded}&width=800&height=400&backgroundColor=white`

    return quickChartUrl
}

// AI Tool definition for OpenAI
export const generateChartTool = {
    name: 'generate_chart',
    description: `Generate a chart to visualize data. Use this when the user asks for graphs, charts, or visual representations of data.
  
  Chart types:
  - bar: Compare values across categories (e.g., budgets by project)
  - line: Show trends over time (e.g., incidents per month)
  - pie: Show proportions/distribution (e.g., expense breakdown)
  - scatter: Show correlations between two variables
  - area: Show cumulative trends over time
  
  Always use this tool when data would be clearer as a visual representation.`,
    parameters: {
        type: 'object',
        properties: {
            type: {
                type: 'string',
                enum: ['bar', 'line', 'pie', 'scatter', 'area'],
                description: 'Type of chart to generate'
            },
            title: {
                type: 'string',
                description: 'Chart title (e.g., "Budgets par Projet")'
            },
            data: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        label: {
                            type: 'string',
                            description: 'Label for this data point (e.g., project name, month)'
                        },
                        value: {
                            type: 'number',
                            description: 'Numeric value for this data point'
                        }
                    },
                    required: ['label', 'value']
                },
                description: 'Array of data points to plot'
            },
            xAxisLabel: {
                type: 'string',
                description: 'Label for X axis (optional)'
            },
            yAxisLabel: {
                type: 'string',
                description: 'Label for Y axis (optional, e.g., "FCFA", "Nombre")'
            },
            colors: {
                type: 'array',
                items: {
                    type: 'string'
                },
                description: 'Optional array of hex colors for the chart'
            }
        },
        required: ['type', 'title', 'data']
    }
}

// Handler function for the AI tool
export async function handleGenerateChart(args: any): Promise<string> {
    try {
        const chartUrl = await generateChart(args as ChartConfig)
        return `![${args.title}](${chartUrl})\n\n📊 Graphique généré avec succès.`
    } catch (error) {
        console.error('Chart generation error:', error)
        return '❌ Erreur lors de la génération du graphique.'
    }
}
