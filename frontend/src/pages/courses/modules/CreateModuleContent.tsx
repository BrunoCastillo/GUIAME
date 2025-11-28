import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { moduleService, ModuleContentCreate } from '../../../services/moduleService'
import { Save, X, FileText, Video, Link as LinkIcon } from 'lucide-react'

export default function CreateModuleContent() {
  const navigate = useNavigate()
  const { id, moduleId } = useParams<{ id: string, moduleId: string }>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<ModuleContentCreate>({
    content_type: 'text',
    content: '',
    order: 0
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!id || !moduleId) {
      setError('ID de curso o módulo no válido')
      return
    }

    if (!formData.content_type) {
      setError('El tipo de contenido es requerido')
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
      setLoading(true)
      await moduleService.createModuleContent(parseInt(moduleId), formData)
      navigate(`/courses/${id}`)
    } catch (err: any) {
      console.error('Error creating content:', err)
      setError(err.response?.data?.detail || 'Error al crear el contenido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-8 h-8" />
            Agregar Contenido al Módulo
          </h1>
          <p className="text-gray-600 mt-2">Agrega contenido que los estudiantes verán en este módulo</p>
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
            value={formData.content_type}
            onChange={(e) => setFormData({ ...formData, content_type: e.target.value as any })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          >
            <option value="text">Texto</option>
            <option value="video">Video</option>
            <option value="link">Enlace</option>
            <option value="document">Documento</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Selecciona el tipo de contenido que deseas agregar</p>
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
            <p className="text-xs text-gray-500 mt-1">URL completa del recurso externo</p>
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
            <p className="text-xs text-gray-500 mt-1">URL del video (YouTube, Vimeo, etc.)</p>
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
            <p className="text-xs text-gray-500 mt-1">Nota: Los documentos se suben desde la sección de Documentos</p>
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
          <p className="text-xs text-gray-500 mt-1">El orden determina la secuencia del contenido dentro del módulo</p>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Creando...' : 'Crear Contenido'}
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

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Tipos de contenido:</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li><strong>Texto:</strong> Contenido escrito que los estudiantes leerán</li>
          <li><strong>Video:</strong> Enlaces a videos de YouTube, Vimeo u otras plataformas</li>
          <li><strong>Enlace:</strong> URLs a recursos externos</li>
          <li><strong>Documento:</strong> Referencia a documentos subidos en la plataforma</li>
        </ul>
      </div>
    </div>
  )
}

