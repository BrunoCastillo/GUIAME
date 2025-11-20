import { useState, useEffect, useRef } from 'react'
import { ragService, RAGResponse } from '../../services/ragService'
import { Send, Bot } from 'lucide-react'

interface Message {
  id: string
  query: string
  response: string
  sources: any[]
  timestamp: Date
}

export default function RAGChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      query,
      response: '',
      sources: [],
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setQuery('')
    setLoading(true)

    try {
      const response: RAGResponse = await ragService.query(query)
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        query: '',
        response: response.response,
        sources: response.sources,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error('Error querying RAG:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-200px)] bg-white rounded-lg shadow">
      <div className="p-4 border-b flex items-center gap-2">
        <Bot className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-semibold">Asistente IA</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Haz una pregunta sobre los documentos disponibles</p>
          </div>
        )}
        {messages.map((message) => (
          <div key={message.id} className="space-y-2">
            {message.query && (
              <div className="p-3 bg-primary text-white rounded-lg ml-auto max-w-[70%]">
                <p>{message.query}</p>
              </div>
            )}
            {message.response && (
              <div className="p-3 bg-gray-100 rounded-lg max-w-[70%]">
                <p>{message.response}</p>
                {message.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs font-semibold mb-1">Fuentes:</p>
                    {message.sources.map((source, idx) => (
                      <p key={idx} className="text-xs text-gray-600">
                        • {source.title}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="p-3 bg-gray-100 rounded-lg max-w-[70%]">
            <p className="text-gray-500">Pensando...</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleQuery} className="p-4 border-t flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pregunta sobre los documentos..."
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  )
}

