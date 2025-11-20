import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { courseService, Course } from '../../services/courseService'

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) return
      try {
        const data = await courseService.getCourse(parseInt(id))
        setCourse(data)
      } catch (error) {
        console.error('Error fetching course:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCourse()
  }, [id])

  const handleEnroll = async () => {
    if (!id) return
    try {
      await courseService.enrollInCourse(parseInt(id))
      alert('Inscripción exitosa')
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error al inscribirse')
    }
  }

  if (loading) {
    return <p className="text-gray-600">Cargando curso...</p>
  }

  if (!course) {
    return <p className="text-gray-600">Curso no encontrado</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
        <p className="text-gray-600 mt-2">{course.description}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <button
          onClick={handleEnroll}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Inscribirse al Curso
        </button>
      </div>
    </div>
  )
}

