import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { authService } from '../services/authService'

interface User {
  id: number
  email: string
  role: string
  company_id: number | null
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (email: string, password: string, role: string) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (email: string, password: string) => {
        const response = await authService.login(email, password)
        console.log('💾 Guardando token en store:', {
          hasToken: !!response.access_token,
          tokenLength: response.access_token?.length || 0,
          tokenPreview: response.access_token?.substring(0, 20) || 'N/A'
        })
        set({
          user: response.user,
          token: response.access_token,
          isAuthenticated: true,
        })
        // Verificar que se guardó correctamente
        setTimeout(() => {
          const stored = localStorage.getItem('auth-storage')
          if (stored) {
            const data = JSON.parse(stored)
            console.log('✅ Token guardado en localStorage:', {
              hasState: !!data?.state,
              hasToken: !!data?.state?.token,
              tokenLength: data?.state?.token?.length || 0
            })
          } else {
            console.error('❌ Token NO se guardó en localStorage')
          }
        }, 100)
      },
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
      },
      register: async (email: string, password: string, role: string) => {
        await authService.register(email, password, role)
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

