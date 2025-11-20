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

export const courseService = {
  async getCourses(): Promise<Course[]> {
    const response = await api.get('/courses')
    return response.data
  },

  async getCourse(id: number): Promise<Course> {
    const response = await api.get(`/courses/${id}`)
    return response.data
  },

  async enrollInCourse(courseId: number) {
    const response = await api.post(`/courses/${courseId}/enroll`)
    return response.data
  },
}

