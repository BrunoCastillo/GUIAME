import { api } from './api'

export interface Course {
  id: number
  title: string
  description: string
  company_id: number
  instructor_id: number
  is_active: boolean
  created_at: string
}

export interface CourseCreate {
  title: string
  description: string
  instructor_id?: number  // Opcional, se usa el usuario actual si no se proporciona
}

export const courseService = {
  async getCourses(): Promise<Course[]> {
    const response = await api.get('/courses/')  // Agregar barra final para evitar redirect 307
    // Asegurar que siempre devolvamos un array
    const data = response.data
    return Array.isArray(data) ? data : []
  },

  async getCourse(id: number): Promise<Course> {
    const response = await api.get(`/courses/${id}`)
    return response.data
  },

  async createCourse(courseData: CourseCreate): Promise<Course> {
    const response = await api.post('/courses', courseData)
    return response.data
  },

  async enrollInCourse(courseId: number) {
    const response = await api.post(`/courses/${courseId}/enroll`)
    return response.data
  },

  /**
   * Obtener los cursos en los que el usuario está inscrito
   */
  async getMyCourses(): Promise<Course[]> {
    const response = await api.get('/courses/my-courses')
    const data = response.data
    return Array.isArray(data) ? data : []
  },
}

