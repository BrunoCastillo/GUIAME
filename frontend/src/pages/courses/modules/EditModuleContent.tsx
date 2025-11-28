import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { moduleService, ModuleContentUpdate } from '../../../services/moduleService'
import { Save, X, FileText, Loader2 } from 'lucide-react'

export default function EditModuleContent() {
  const navigate = useNavigate()
  const { id, moduleId, contentId } = useParams<{ id: string, moduleId: string, contentId: string }>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<ModuleContentUpdate>({
    content_type: 'text',
    content: '',
    order: 0
  })

  useEffect(() => {
    const fetchContent = async () => {
      if (!moduleId || !contentId) {
        setError('ID de módulo o contenido no válido')
        setLoading(false)
        return
      }

      try {
        const content = await moduleService.getModuleContent(parseInt(moduleId), parseInt(contentId))
        setFormData({
          content_type: content.content_type,
          content: content.content || '',
          order: content.order
        })
      } catch (err: any) {
        console.error('Error fetching content:', err)
        setError(err.response?.data?.detail || 'Error al cargar el contenido')
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [moduleId, contentId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!id || !moduleId || !contentId) {
      setError('ID de curso, módulo o contenido no válido')
      return
    }

    if (formData.content_type === 'text' && !formData.content?.trim()) {
      setError('El contenido de texto es requerido')
      return
    }

    if (formData.content_type === 'link' && !formData.content?.trim()) {
      setError('La URL del enlace es requerida')
      return
    }

    try {
      setSaving(true)
      await moduleService.updateModuleContent(parseInt(moduleId), parseInt(contentId), formData)
      navigate(`/courses/${id}`)
    } catch (err: any) {
      console.error('Error updating content:', err)
      setError(err.response?.data?.detail || 'Error al actualizar el contenido')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-3 text-gray-600">Cargando contenido...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-8 h-8" />
            Editar Contenido
          </h1>
          <p className="text-gray-600 mt-2">Modifica el contenido del módulo</p>
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
          <label htmlFor="content_type" className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Contenido *
          </label>
          <select
            id="content_type"
            value={formData.content_type || 'text'}
            onChange={(e) => setFormData({ ...formData, content_type: e.target.value as any })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          >
            <option value="text">Texto</option>
            <option value="video">Video</option>
            <option value="link">Enlace</option>
            <option value="document">Documento</option>
          </select>
        </div>

        {formData.content_type === 'text' && (
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Contenido de Texto *
            </label>
            <textarea
              id="content"
              value={formData.content || ''}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Escribe el contenido que los estudiantes verán..."
              required
            />
          </div>
        )}

        {formData.content_type === 'link' && (
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              URL del Enlace *
            </label>
            <input
              type="url"
              id="content"
              value={formData.content || ''}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="https://ejemplo.com/recurso"
              required
            />
          </div>
        )}

        {formData.content_type === 'video' && (
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              URL del Video
            </label>
            <input
              type="url"
              id="content"
              value={formData.content || ''}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
        )}

        {formData.content_type === 'document' && (
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción del Documento
            </label>
            <input
              type="text"
              id="content"
              value={formData.content || ''}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Descripción o nombre del documento"
            />
          </div>
        )}

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

