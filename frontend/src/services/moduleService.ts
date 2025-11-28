import { api } from './api'

export interface Module {
  id: number
  course_id: number
  title: string
  description: string | null
  order: number
  is_active: boolean
  created_at: string
  updated_at: string | null
}

export interface ModuleCreate {
  title: string
  description?: string | null
  order?: number
}

export interface ModuleUpdate {
  title?: string
  description?: string | null
  order?: number
  is_active?: boolean
}

export interface ModuleContent {
  id: number
  module_id: number
  content_type: 'text' | 'video' | 'document' | 'link'
  content: string | null
  document_id: number | null
  order: number
  created_at: string
}

export interface ModuleContentCreate {
  content_type: 'text' | 'video' | 'document' | 'link'
  content?: string | null
  document_id?: number | null
  order?: number
}

export interface ModuleContentUpdate {
  content_type?: 'text' | 'video' | 'document' | 'link'
  content?: string | null
  document_id?: number | null
  order?: number
}

export const moduleService = {
  /**
   * Obtener todos los módulos de un curso
   */
  async getCourseModules(courseId: number): Promise<Module[]> {
    const response = await api.get(`/courses/${courseId}/modules`)
    const data = response.data
    return Array.isArray(data) ? data : []
  },

  /**
   * Crear un nuevo módulo en un curso
   */
  async createModule(courseId: number, moduleData: ModuleCreate): Promise<Module> {
    const response = await api.post(`/courses/${courseId}/modules`, moduleData)
    return response.data
  },

  /**
   * Obtener un módulo específico
   */
  async getModule(courseId: number, moduleId: number): Promise<Module> {
    const response = await api.get(`/courses/${courseId}/modules/${moduleId}`)
    return response.data
  },

  /**
   * Actualizar un módulo
   */
  async updateModule(courseId: number, moduleId: number, moduleData: ModuleUpdate): Promise<Module> {
    const response = await api.put(`/courses/${courseId}/modules/${moduleId}`, moduleData)
    return response.data
  },

  /**
   * Eliminar un módulo
   */
  async deleteModule(courseId: number, moduleId: number): Promise<void> {
    await api.delete(`/courses/${courseId}/modules/${moduleId}`)
  },

  /**
   * Obtener todo el contenido de un módulo
   */
  async getModuleContents(moduleId: number): Promise<ModuleContent[]> {
    const response = await api.get(`/modules/${moduleId}/contents`)
    const data = response.data
    return Array.isArray(data) ? data : []
  },

  /**
   * Crear nuevo contenido en un módulo
   */
  async createModuleContent(moduleId: number, contentData: ModuleContentCreate): Promise<ModuleContent> {
    const response = await api.post(`/modules/${moduleId}/contents`, contentData)
    return response.data
  },

  /**
   * Obtener un contenido específico
   */
  async getModuleContent(moduleId: number, contentId: number): Promise<ModuleContent> {
    const response = await api.get(`/modules/${moduleId}/contents/${contentId}`)
    return response.data
  },

  /**
   * Actualizar contenido de un módulo
   */
  async updateModuleContent(
    moduleId: number,
    contentId: number,
    contentData: ModuleContentUpdate
  ): Promise<ModuleContent> {
    const response = await api.put(`/modules/${moduleId}/contents/${contentId}`, contentData)
    return response.data
  },

  /**
   * Eliminar contenido de un módulo
   */
  async deleteModuleContent(moduleId: number, contentId: number): Promise<void> {
    await api.delete(`/modules/${moduleId}/contents/${contentId}`)
  },
}

