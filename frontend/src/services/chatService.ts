import { api } from './api'

export interface ChatMessage {
  id: number
  sender_id: number
  receiver_id: number | null
  message: string
  is_read: boolean
  created_at: string
}

export const chatService = {
  async getMessages(receiverId?: number): Promise<ChatMessage[]> {
    const params = receiverId ? { receiver_id: receiverId } : {}
    const response = await api.get('/chat', { params })
    return response.data
  },

  async sendMessage(receiverId: number | null, message: string): Promise<ChatMessage> {
    const response = await api.post('/chat', {
      receiver_id: receiverId,
      message,
    })
    return response.data
  },
}

