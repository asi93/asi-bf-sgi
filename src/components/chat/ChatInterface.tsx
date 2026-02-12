'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Sparkles, Copy, Printer, Check, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  data?: unknown
}

const quickActions = [
  { label: 'KPIs Globaux', query: 'Donne-moi les KPIs globaux du SGI' },
  { label: 'Finances Projet', query: 'Analyse financière détaillée du projet AEP Atakpamé' },
  { label: 'Stocks Critiques', query: 'Quels articles sont en stock critique?' },
  { label: 'Équipements', query: 'Liste les équipements et véhicules du parc' },
  { label: 'Marchés', query: 'Liste les marchés et contrats en cours' },
  { label: 'Incidents', query: 'Combien d\'incidents non résolus avons-nous?' },
]

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Bonjour! Je suis l\'assistant IA d\'ASI-TRACK. Je peux interroger vos données en temps réel: projets, stocks, équipements, finances, incidents et plus. Posez votre question!',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input
    if (!text.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      const data = await response.json()

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || 'Desole, je n\'ai pas pu traiter votre demande.',
        timestamp: new Date(),
        data: data.data,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Erreur chat:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Desole, une erreur s\'est produite. Veuillez reessayer.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-primary-600 to-primary-700 rounded-t-xl">
        <div className="p-2 bg-white/20 rounded-lg">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Assistant IA ASI-TRACK</h3>
          <p className="text-xs text-white/80">Interrogez vos donnees en langage naturel</p>
        </div>
        <Sparkles className="w-4 h-4 text-yellow-300 ml-auto" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              'flex gap-3',
              message.role === 'user' ? 'flex-row-reverse' : ''
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                message.role === 'user'
                  ? 'bg-primary-600'
                  : 'bg-gray-100'
              )}
            >
              {message.role === 'user' ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-gray-600" />
              )}
            </div>
            <div
              className={cn(
                'max-w-[85%] rounded-2xl px-4 py-3 relative group',
                message.role === 'user'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
              )}
            >
              {message.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-2">
                          <table className="min-w-full border-collapse border border-gray-300 rounded-lg" {...props} />
                        </div>
                      ),
                      thead: ({ node, ...props }) => <thead className="bg-gray-100" {...props} />,
                      th: ({ node, ...props }) => <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-xs uppercase" {...props} />,
                      td: ({ node, ...props }) => <td className="border border-gray-300 px-3 py-2 text-xs" {...props} />,
                      tr: ({ node, ...props }) => <tr className="even:bg-gray-50/50" {...props} />,
                      img: ({ node, src, alt, ...props }) => {
                        const [isFullscreen, setIsFullscreen] = useState(false)

                        return (
                          <>
                            <div className="my-4 relative group">
                              <img
                                src={src}
                                alt={alt || 'Chart'}
                                className="rounded-lg border border-gray-200 shadow-sm w-full cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => setIsFullscreen(true)}
                                {...props}
                              />
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  className="h-8 w-8 bg-white shadow-md border"
                                  onClick={() => setIsFullscreen(true)}
                                  title="Plein écran"
                                >
                                  <Maximize2 className="h-4 w-4" />
                                </Button>
                                <a
                                  href={src as string}
                                  download={`chart-${Date.now()}.png`}
                                  className="inline-flex items-center justify-center h-8 w-8 bg-white shadow-md border rounded-md hover:bg-gray-50"
                                  title="Télécharger"
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                </a>
                              </div>
                            </div>

                            {/* Fullscreen Modal */}
                            {isFullscreen && (
                              <div
                                className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                                onClick={() => setIsFullscreen(false)}
                              >
                                <div className="relative max-w-6xl w-full">
                                  <Button
                                    variant="secondary"
                                    size="icon"
                                    className="absolute top-4 right-4 h-10 w-10 bg-white shadow-lg"
                                    onClick={() => setIsFullscreen(false)}
                                  >
                                    <Minimize2 className="h-5 w-5" />
                                  </Button>
                                  <img
                                    src={src}
                                    alt={alt || 'Chart'}
                                    className="w-full h-auto rounded-lg"
                                  />
                                </div>
                              </div >
                            )}
                          </>
                        )
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              )}

              {message.role === 'assistant' && (
                <div className="absolute -right-2 top-0 translate-x-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 pl-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7 bg-white shadow-sm border"
                    onClick={() => {
                      navigator.clipboard.writeText(message.content)
                      // Could add a toast here
                    }}
                    title="Copier"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7 bg-white shadow-sm border"
                    onClick={() => {
                      const printWin = window.open('', '', 'width=800,height=600');
                      if (printWin) {
                        printWin.document.write(`
                                <html>
                                    <head>
                                        <title>ASI-TRACK - Rapport IA</title>
                                        <style>
                                            body { font-family: sans-serif; padding: 40px; }
                                            table { border-collapse: collapse; width: 100%; margin: 20px 0; }
                                            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                                            th { bg-color: #f5f5f5; }
                                            .header { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; margin-bottom: 20px; }
                                        </style>
                                    </head>
                                    <body>
                                        <div class="header"><h1>ASI-TRACK - Assistant IA</h1></div>
                                        <div>${message.content.replace(/\n/g, '<br>')}</div>
                                    </body>
                                </html>
                            `);
                        printWin.document.close();
                        printWin.print();
                      }
                    }}
                    title="Imprimer"
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              <p
                className={cn(
                  'text-[10px] mt-2 font-medium',
                  message.role === 'user' ? 'text-white/70' : 'text-gray-400'
                )}
              >
                {message.timestamp.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <Bot className="w-4 h-4 text-gray-600" />
            </div>
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 border-t border-gray-100">
        <p className="text-xs text-gray-500 mb-2">Actions rapides:</p>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => sendMessage(action.query)}
              disabled={isLoading}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors disabled:opacity-50"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Posez votre question..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
