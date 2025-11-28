import { api } from './api'

export interface Company {
  id: number
  name: string
  description: string | null
  logo_url: string | null
  is_active: boolean
  created_at: string
}

export interface CompanyCreate {
  name: string
  description?: string | null
  logo_url?: string | null
}

export interface CompanyUpdate {
  name?: string
  description?: string | null
  logo_url?: string | null
  is_active?: boolean
}

export const companyService = {
  /**
   * Obtener todas las empresas
   * Solo disponible para administradores
   */
  async getCompanies(): Promise<Company[]> {
    const response = await api.get('/companies/')  // Agregar barra final para evitar redirect 307
    return response.data
  },

  /**
   * Obtener una empresa por ID
   */
  async getCompany(id: number): Promise<Company> {
    const response = await api.get(`/companies/${id}`)
    return response.data
  },

  /**
   * Crear una nueva empresa
   * Solo disponible para administradores
   */
  async createCompany(companyData: CompanyCreate): Promise<Company> {
    const response = await api.post('/companies/', companyData)  // Agregar barra final para evitar redirect 307
    return response.data
  },

  /**
   * Actualizar una empresa
   * Solo disponible para administradores
   */
  async updateCompany(id: number, companyData: CompanyUpdate): Promise<Company> {
    const response = await api.put(`/companies/${id}`, companyData)
    return response.data
  },

  /**
   * Eliminar una empresa (soft delete)
   * Solo disponible para administradores
   */
  async deleteCompany(id: number): Promise<void> {
    await api.delete(`/companies/${id}`)
  },
}

