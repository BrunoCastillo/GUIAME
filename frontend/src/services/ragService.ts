import { api } from './api'

export interface RAGQuery {
  query: string
  company_id?: number
}

export interface RAGResponse {
  response: string
  sources: Array<{
    document_id: number
    title: string
    snippet: string
    score: number
  }>
  model_used: string
  tokens_used?: number
}

export const ragService = {
  async query(query: string, companyId?: number): Promise<RAGResponse> {
    const response = await api.post('/rag/query', {
      query,
      company_id: companyId,
    })
    return response.data
  },

  async getHistory(): Promise<any[]> {
    const response = await api.get('/rag/history')
    return response.data
  },
}

