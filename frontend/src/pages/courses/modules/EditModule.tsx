import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { moduleService, ModuleUpdate } from '../../../services/moduleService'
import { Save, X, BookOpen, Loader2 } from 'lucide-react'

export default function EditModule() {
  const navigate = useNavigate()
  const { id, moduleId } = useParams<{ id: string, moduleId: string }>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<ModuleUpdate>({
    title: '',
    description: '',
    order: 0,
    is_active: true
  })

  useEffect(() => {
    const fetchModule = async () => {
      if (!id || !moduleId) {
        setError('ID de curso o módulo no válido')
        setLoading(false)
        return
      }

      try {
        const module = await moduleService.getModule(parseInt(id), parseInt(moduleId))
        setFormData({
          title: module.title,
          description: module.description || '',
          order: module.order,
          is_active: module.is_active
        })
      } catch (err: any) {
        console.error('Error fetching module:', err)
        setError(err.response?.data?.detail || 'Error al cargar el módulo')
      } finally {
        setLoading(false)
      }
    }

    fetchModule()
  }, [id, moduleId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!id || !moduleId) {
      setError('ID de curso o módulo no válido')
      return
    }

    if (!formData.title || formData.title.trim().length < 3) {
      setError('El título debe tener al menos 3 caracteres')
      return
    }

    try {
      setSaving(true)
      await moduleService.updateModule(parseInt(id), parseInt(moduleId), formData)
      navigate(`/courses/${id}`)
    } catch (err: any) {
      console.error('Error updating module:', err)
      setError(err.response?.data?.detail || 'Error al actualizar el módulo')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-3 text-gray-600">Cargando módulo...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-8 h-8" />
            Editar Módulo (Tema)
          </h1>
          <p className="text-gray-600 mt-2">Modifica la información del módulo</p>
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
            value={formData.title || ''}
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
          <p className="text-xs text-gray-500 mt-1">El orden determina la secuencia de los módulos</p>
        </div>

        <div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.is_active ?? true}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="text-sm font-medium text-gray-700">Módulo activo</span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-7">
            Los módulos inactivos no son visibles para los estudiantes
          </p>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
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

