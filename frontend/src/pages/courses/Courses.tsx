import { useEffect, useState } from 'react'
import { courseService, Course } from '../../services/courseService'
import { Link } from 'react-router-dom'

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cursos</h1>
        <p className="text-gray-600 mt-2">Explora todos los cursos disponibles</p>
      </div>

      {loading ? (
        <p className="text-gray-600">Cargando cursos...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              to={`/courses/${course.id}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
              <p className="text-gray-600 text-sm">{course.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

