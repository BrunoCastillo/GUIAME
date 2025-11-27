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
    // Limpiar cualquier token malformado antes de hacer la petición
    try {
      const authStorage = localStorage.getItem('auth-storage')
      if (authStorage) {
        const authData = JSON.parse(authStorage)
        const token = authData?.state?.token
        if (token && typeof token === 'string' && token.includes('eyJ')) {
          console.warn('🧹 Limpiando token JWT de Supabase antes del registro')
          localStorage.removeItem('auth-storage')
        }
      }
    } catch (e) {
      // Ignorar errores
    }
    
    // Usar el proxy de Vite para evitar problemas de CORS
    // El proxy está configurado en vite.config.ts para redirigir /api a http://localhost:8000
    const registerUrl = '/api/v1/auth/register'
    
    console.log('📤 Registrando usuario en:', registerUrl)
    console.log('📤 Datos:', { email, password: '***', role })
    
    try {
      // Usar fetch con el proxy de Vite (ruta relativa)
      const response = await fetch(registerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          role,
        }),
      })
      
      // Obtener el contenido de la respuesta
      const contentType = response.headers.get('content-type')
      let responseData: any
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json()
      } else {
        const text = await response.text()
        console.error('❌ Respuesta no es JSON:', text)
        // Intentar parsear como JSON de todas formas
        try {
          responseData = JSON.parse(text)
        } catch {
          responseData = { detail: text || `Error ${response.status}: ${response.statusText}` }
        }
      }
      
      if (!response.ok) {
        const errorMessage = responseData.detail || responseData.message || `Error ${response.status}: ${response.statusText}`
        console.error('❌ Error del servidor:', responseData)
        throw new Error(errorMessage)
      }
      
      console.log('✅ Usuario registrado exitosamente:', responseData)
      return responseData
    } catch (error: any) {
      // Si es un error de red, mostrar mensaje más claro
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('❌ Error de red al conectar con el servidor')
        throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.')
      }
      throw error
    }
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

