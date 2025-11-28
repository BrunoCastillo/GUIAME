import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { companyService, CompanyUpdate } from '../../services/companyService'
import { useAuthStore } from '../../store/authStore'
import { Save, X, Building2, AlertCircle, Loader2 } from 'lucide-react'

export default function EditCompany() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<CompanyUpdate>({
    name: '',
    description: '',
    logo_url: '',
    is_active: true
  })

  // Verificar si el usuario es administrador
  const isAdmin = user?.role === 'administrador'

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false)
      return
    }

    const fetchCompany = async () => {
      if (!id) {
        setError('ID de empresa no proporcionado')
        setLoading(false)
        return
      }

      try {
        const company = await companyService.getCompany(parseInt(id))
        setFormData({
          name: company.name,
          description: company.description || '',
          logo_url: company.logo_url || '',
          is_active: company.is_active
        })
      } catch (err: any) {
        console.error('Error fetching company:', err)
        setError(err.response?.data?.detail || 'Error al cargar la empresa')
      } finally {
        setLoading(false)
      }
    }

    fetchCompany()
  }, [id, isAdmin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!id) {
      setError('ID de empresa no proporcionado')
      return
    }

    if (!formData.name || formData.name.trim().length < 3) {
      setError('El nombre debe tener al menos 3 caracteres')
      return
    }

    try {
      setSaving(true)
      await companyService.updateCompany(parseInt(id), formData)
      // Redirigir a la lista de empresas
      navigate('/companies')
    } catch (err: any) {
      console.error('Error updating company:', err)
      setError(err.response?.data?.detail || 'Error al actualizar la empresa')
    } finally {
      setSaving(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-red-900 mb-2">Acceso Denegado</h3>
          <p className="text-red-700">No tienes permisos para editar empresas.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-3 text-gray-600">Cargando empresa...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-8 h-8" />
            Editar Empresa
          </h1>
          <p className="text-gray-600 mt-2">Modifica la información de la empresa</p>
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
            value={formData.name || ''}
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

        <div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.is_active ?? true}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="text-sm font-medium text-gray-700">Empresa activa</span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-7">
            Las empresas inactivas no pueden ser utilizadas por nuevos usuarios
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
            onClick={() => navigate('/companies')}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

