import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { moduleService, ModuleCreate } from '../../../services/moduleService'
import { Save, X, BookOpen } from 'lucide-react'

export default function CreateModule() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<ModuleCreate>({
    title: '',
    description: '',
    order: 0
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!id) {
      setError('ID de curso no válido')
      return
    }

    if (!formData.title.trim()) {
      setError('El título del módulo es requerido')
      return
    }

    if (formData.title.trim().length < 3) {
      setError('El título debe tener al menos 3 caracteres')
      return
    }

    try {
      setLoading(true)
      await moduleService.createModule(parseInt(id), formData)
      navigate(`/courses/${id}`)
    } catch (err: any) {
      console.error('Error creating module:', err)
      setError(err.response?.data?.detail || 'Error al crear el módulo')
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
            Crear Nuevo Módulo (Tema)
          </h1>
          <p className="text-gray-600 mt-2">Completa la información para crear un nuevo módulo</p>
        </div>
        <button
          onClick={() => navigate(`/courses/${id}`)}
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
            Título del Módulo *
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
            Descripción del Módulo
          </label>
          <textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Describe los temas que se cubrirán en este módulo..."
            maxLength={1000}
          />
          <p className="text-xs text-gray-500 mt-1">
            {(formData.description || '').length}/1000 caracteres
          </p>
        </div>

        <div>
          <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-2">
            Orden
          </label>
          <input
            type="number"
            id="order"
            value={formData.order || 0}
            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            min="0"
          />
          <p className="text-xs text-gray-500 mt-1">El orden determina la secuencia de los módulos (0 = primero)</p>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Creando...' : 'Crear Módulo'}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/courses/${id}`)}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

