import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { companyService, CompanyCreate } from '../../services/companyService'
import { useAuthStore } from '../../store/authStore'
import { Save, X, Building2, AlertCircle } from 'lucide-react'

export default function CreateCompany() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<CompanyCreate>({
    name: '',
    description: '',
    logo_url: ''
  })

  // Verificar si el usuario es administrador
  const isAdmin = user?.role === 'administrador'

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-red-900 mb-2">Acceso Denegado</h3>
          <p className="text-red-700">No tienes permisos para crear empresas.</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('El nombre de la empresa es requerido')
      return
    }

    if (formData.name.trim().length < 3) {
      setError('El nombre debe tener al menos 3 caracteres')
      return
    }

    try {
      setLoading(true)
      await companyService.createCompany(formData)
      // Redirigir a la lista de empresas
      navigate('/companies')
    } catch (err: any) {
      console.error('Error creating company:', err)
      setError(err.response?.data?.detail || 'Error al crear la empresa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-8 h-8" />
            Crear Nueva Empresa
          </h1>
          <p className="text-gray-600 mt-2">Completa la información para crear una nueva empresa</p>
        </div>
        <button
          onClick={() => navigate('/companies')}
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
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Nombre de la Empresa *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Ej: Acme Corporation"
            required
            minLength={3}
            maxLength={200}
          />
          <p className="text-xs text-gray-500 mt-1">Mínimo 3 caracteres, máximo 200</p>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Descripción
          </label>
          <textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Describe la empresa, su industria, servicios, etc..."
            maxLength={1000}
          />
          <p className="text-xs text-gray-500 mt-1">
            {(formData.description || '').length}/1000 caracteres
          </p>
        </div>

        <div>
          <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700 mb-2">
            URL del Logo (Opcional)
          </label>
          <input
            type="url"
            id="logo_url"
            value={formData.logo_url || ''}
            onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="https://ejemplo.com/logo.png"
          />
          <p className="text-xs text-gray-500 mt-1">URL completa de la imagen del logo</p>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Creando...' : 'Crear Empresa'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/companies')}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Información sobre empresas:</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Las empresas permiten organizar usuarios y recursos en un sistema multi-tenant</li>
          <li>Cada empresa puede tener múltiples usuarios, cursos y documentos</li>
          <li>El logo es opcional y puede agregarse después</li>
        </ul>
      </div>
    </div>
  )
}

