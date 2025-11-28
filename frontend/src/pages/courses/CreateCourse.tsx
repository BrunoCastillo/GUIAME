import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { courseService, CourseCreate } from '../../services/courseService'
import { Save, X, BookOpen } from 'lucide-react'

export default function CreateCourse() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<CourseCreate>({
    title: '',
    description: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.title.trim()) {
      setError('El título del curso es requerido')
      return
    }

    if (formData.title.trim().length < 3) {
      setError('El título debe tener al menos 3 caracteres')
      return
    }

    try {
      setLoading(true)
      const newCourse = await courseService.createCourse(formData)
      // Redirigir al detalle del curso creado
      navigate(`/courses/${newCourse.id}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear el curso')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-8 h-8" />
            Crear Nuevo Curso
          </h1>
          <p className="text-gray-600 mt-2">Completa la información para crear un nuevo curso</p>
        </div>
        <button
          onClick={() => navigate('/courses')}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Cancelar
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Título del Curso *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Ej: Introducción a Python"
            required
            minLength={3}
            maxLength={200}
          />
          <p className="text-xs text-gray-500 mt-1">Mínimo 3 caracteres, máximo 200</p>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Descripción del Curso
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Describe el contenido, objetivos y temas que cubrirá el curso..."
            maxLength={2000}
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.description.length}/2000 caracteres
          </p>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Creando...' : 'Crear Curso'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/courses')}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Consejos para crear un buen curso:</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Usa un título claro y descriptivo</li>
          <li>Incluye una descripción detallada de los objetivos y contenidos</li>
          <li>Puedes agregar módulos y contenido después de crear el curso</li>
        </ul>
      </div>
    </div>
  )
}

