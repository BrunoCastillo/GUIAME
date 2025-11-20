import { api } from './api'

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: {
    id: number
    email: string
    role: string
    company_id: number | null
  }
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post('/auth/login', { email, password })
    // Obtener información del usuario
    const userResponse = await api.get('/auth/me')
    return {
      ...response.data,
      user: userResponse.data,
    }
  },

  async register(email: string, password: string, role: string = 'student') {
    const response = await api.post('/auth/register', {
      email,
      password,
      role,
    })
    return response.data
  },

  async refreshToken(refreshToken: string) {
    const response = await api.post('/auth/refresh', {
      refresh_token: refreshToken,
    })
    return response.data
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me')
    return response.data
  },
}

