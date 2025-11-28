import { useEffect, useState } from 'react'
import { courseService, Course } from '../services/courseService'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { BookOpen, Calendar, MessageSquare, Plus, CheckCircle } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuthStore()
  const [myCourses, setMyCourses] = useState<Course[]>([])
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const isStudent = user?.role === 'estudiante'

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        if (isStudent) {
          // Para estudiantes: obtener cursos inscritos y disponibles
          const [enrolled, available] = await Promise.all([
            courseService.getMyCourses(),
            courseService.getCourses()
          ])
          
          setMyCourses(Array.isArray(enrolled) ? enrolled : [])
          
          // Filtrar cursos disponibles (excluir los ya inscritos)
          const enrolledIds = new Set(enrolled.map(c => c.id))
          const availableFiltered = (Array.isArray(available) ? available : [])
            .filter(course => !enrolledIds.has(course.id))
          setAvailableCourses(availableFiltered)
        } else {
          // Para otros roles: mostrar todos los cursos
          const data = await courseService.getCourses()
          if (Array.isArray(data)) {
            setMyCourses(data.slice(0, 6))
            setAvailableCourses([])
          } else {
            setMyCourses([])
            setAvailableCourses([])
          }
        }
      } catch (error) {
        console.error('Error fetching courses:', error)
        setMyCourses([])
        setAvailableCourses([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [isStudent])

  const handleEnroll = async (courseId: number) => {
    try {
      setEnrolling(courseId)
      setMessage(null)
      
      await courseService.enrollInCourse(courseId)
      
      // Actualizar listas
      const course = availableCourses.find(c => c.id === courseId)
      if (course) {
        setMyCourses([...myCourses, course])
        setAvailableCourses(availableCourses.filter(c => c.id !== courseId))
      }
      
      setMessage({ type: 'success', text: 'Te has inscrito exitosamente al curso' })
      
      // Ocultar mensaje después de 3 segundos
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      console.error('Error enrolling in course:', error)
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Error al inscribirse en el curso' 
      })
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setEnrolling(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Bienvenido a la plataforma de capacitación</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Mis Cursos</p>
              <p className="text-2xl font-bold">{myCourses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Próximos Eventos</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Mensajes</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cursos Inscritos */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Mis Cursos Inscritos</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <p className="text-gray-600">Cargando cursos...</p>
          ) : myCourses.length === 0 ? (
            <p className="text-gray-600">No tienes cursos inscritos</p>
          ) : (
            <div className="space-y-4">
              {myCourses.map((course) => (
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{course.title}</h3>
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                        {course.description || 'Sin descripción'}
                      </p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500 ml-4 flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cursos Disponibles (solo para estudiantes) */}
      {isStudent && availableCourses.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Cursos Disponibles</h2>
            <p className="text-sm text-gray-600 mt-1">Inscríbete en nuevos cursos</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {availableCourses.map((course) => (
                <div
                  key={course.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{course.title}</h3>
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                        {course.description || 'Sin descripción'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleEnroll(course.id)}
                      disabled={enrolling === course.id}
                      className="ml-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
                    >
                      {enrolling === course.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Inscribiendo...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Inscribirse</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

