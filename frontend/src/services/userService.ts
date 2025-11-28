import { api } from './api'

export interface Profile {
  id: number
  user_id: number
  first_name: string
  last_name: string
  phone: string | null
  position: string | null
  department: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string | null
}

export interface ProfileUpdate {
  first_name?: string
  last_name?: string
  phone?: string
  position?: string
  department?: string
  avatar_url?: string
  bio?: string
}

export interface ProfileCreate {
  first_name: string
  last_name: string
  phone?: string
  position?: string
  department?: string
  bio?: string
}

export const userService = {
  // Obtener perfil del usuario actual
  async getMyProfile(): Promise<Profile> {
    const response = await api.get('/users/me/profile')
    return response.data
  },

  // Crear perfil para usuario actual
  async createProfile(profileData: ProfileCreate): Promise<Profile> {
    const response = await api.post('/users/me/profile', profileData)
    return response.data
  },

  // Actualizar perfil del usuario actual
  async updateMyProfile(profileUpdate: ProfileUpdate): Promise<Profile> {
    const response = await api.put('/users/me/profile', profileUpdate)
    return response.data
  },

  // Cambiar contraseña
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    })
  },
}

