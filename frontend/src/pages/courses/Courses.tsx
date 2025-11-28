import { useEffect, useState } from 'react'
import { courseService, Course } from '../../services/courseService'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Plus, BookOpen } from 'lucide-react'

export default function Courses() {
  const { user } = useAuthStore()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  // Verificar si el usuario puede crear cursos (profesor, admin o company_admin)
  const canCreateCourse = user?.role === 'profesor' || 
                         user?.role === 'administrador' || 
                         user?.role === 'company_admin'

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await courseService.getCourses()
        setCourses(data)
      } catch (error) {
        console.error('Error fetching courses:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCourses()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cursos</h1>
          <p className="text-gray-600 mt-2">Explora todos los cursos disponibles</p>
        </div>
        {canCreateCourse && (
          <Link
            to="/courses/create"
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Crear Curso
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-600">Cargando cursos...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay cursos disponibles</h3>
          <p className="text-gray-600 mb-6">
            {canCreateCourse 
              ? 'Comienza creando tu primer curso' 
              : 'Aún no hay cursos disponibles en la plataforma'}
          </p>
          {canCreateCourse && (
            <Link
              to="/courses/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Crear Primer Curso
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              to={`/courses/${course.id}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
              <p className="text-gray-600 text-sm line-clamp-3">
                {course.description || 'Sin descripción'}
              </p>
              <div className="mt-4 text-xs text-gray-500">
                Creado: {new Date(course.created_at).toLocaleDateString('es-ES')}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

