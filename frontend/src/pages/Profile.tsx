import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { userService, Profile as ProfileType, ProfileUpdate } from '../services/userService'
import { User as UserIcon, Mail, Building, Shield, Save, Lock, AlertCircle } from 'lucide-react'

export default function Profile() {
  const { user } = useAuthStore()
  const [profile, setProfile] = useState<ProfileType | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Estados para edición de perfil
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<ProfileUpdate>({
    first_name: '',
    last_name: '',
    phone: '',
    position: '',
    department: '',
    bio: ''
  })
  
  // Estados para cambio de contraseña
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError('')
      const profileData = await userService.getMyProfile()
      setProfile(profileData)
      setFormData({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        phone: profileData.phone || '',
        position: profileData.position || '',
        department: profileData.department || '',
        bio: profileData.bio || ''
      })
    } catch (err: any) {
      // Si el perfil no existe (404), permitir crear uno
      if (err.response?.status === 404) {
        setProfile(null)
      } else {
        setError(err.response?.data?.detail || 'Error al cargar el perfil')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProfile = async () => {
    if (!formData.first_name || !formData.last_name) {
      setError('Nombre y apellido son requeridos')
      return
    }

    try {
      setSaving(true)
      setError('')
      const newProfile = await userService.createProfile({
        first_name: formData.first_name!,
        last_name: formData.last_name!,
        phone: formData.phone || undefined,
        position: formData.position || undefined,
        department: formData.department || undefined,
        bio: formData.bio || undefined
      })
      setProfile(newProfile)
      setIsEditing(false)
      setSuccess('Perfil creado exitosamente')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear el perfil')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateProfile = async () => {
    try {
      setSaving(true)
      setError('')
      const updatedProfile = await userService.updateMyProfile(formData)
      setProfile(updatedProfile)
      setIsEditing(false)
      setSuccess('Perfil actualizado exitosamente')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al actualizar el perfil')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveProfile = () => {
    if (profile) {
      handleUpdateProfile()
    } else {
      handleCreateProfile()
    }
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordSuccess('')

    // Validaciones
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
      setPasswordError('Todos los campos son requeridos')
      return
    }

    if (passwordData.new_password.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError('Las contraseñas no coinciden')
      return
    }

    try {
      setSaving(true)
      await userService.changePassword(passwordData.current_password, passwordData.new_password)
      setPasswordSuccess('Contraseña actualizada exitosamente')
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
      setTimeout(() => {
        setShowPasswordForm(false)
        setPasswordSuccess('')
      }, 2000)
    } catch (err: any) {
      setPasswordError(err.response?.data?.detail || 'Error al cambiar la contraseña')
    } finally {
      setSaving(false)
    }
  }

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      'administrador': 'Administrador',
      'company_admin': 'Administrador de Empresa',
      'profesor': 'Profesor',
      'estudiante': 'Estudiante'
    }
    return roleMap[role] || role
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600 mt-2">Cargando información...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600 mt-2">Gestiona tu información personal</p>
      </div>

      {/* Mensajes de éxito/error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información del Usuario */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Información Personal</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Editar
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cargo
                    </label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departamento
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Biografía
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      if (profile) {
                        setFormData({
                          first_name: profile.first_name || '',
                          last_name: profile.last_name || '',
                          phone: profile.phone || '',
                          position: profile.position || '',
                          department: profile.department || '',
                          bio: profile.bio || ''
                        })
                      }
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <UserIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Nombre completo</p>
                      <p className="font-medium">
                        {profile ? `${profile.first_name} ${profile.last_name}` : 'No configurado'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{user?.email}</p>
                    </div>
                  </div>
                </div>

                {profile?.phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5" />
                    <div>
                      <p className="text-sm text-gray-600">Teléfono</p>
                      <p className="font-medium">{profile.phone}</p>
                    </div>
                  </div>
                )}

                {profile?.position && (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5" />
                    <div>
                      <p className="text-sm text-gray-600">Cargo</p>
                      <p className="font-medium">{profile.position}</p>
                    </div>
                  </div>
                )}

                {profile?.department && (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5" />
                    <div>
                      <p className="text-sm text-gray-600">Departamento</p>
                      <p className="font-medium">{profile.department}</p>
                    </div>
                  </div>
                )}

                {profile?.bio && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Biografía</p>
                    <p className="text-gray-700">{profile.bio}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cambio de Contraseña */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Cambiar Contraseña
              </h2>
              {!showPasswordForm && (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Cambiar
                </button>
              )}
            </div>

            {showPasswordForm && (
              <div className="space-y-4">
                {passwordError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    {passwordSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña Actual *
                  </label>
                  <input
                    type="password"
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva Contraseña *
                  </label>
                  <input
                    type="password"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar Nueva Contraseña *
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleChangePassword}
                    disabled={saving}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Guardando...' : 'Guardar Contraseña'}
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordForm(false)
                      setPasswordData({
                        current_password: '',
                        new_password: '',
                        confirm_password: ''
                      })
                      setPasswordError('')
                      setPasswordSuccess('')
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Información de Cuenta */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Información de Cuenta</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Rol</p>
                  <p className="font-medium">{user ? getRoleLabel(user.role) : 'N/A'}</p>
                </div>
              </div>

              {user?.company_id && (
                <div className="flex items-center gap-3">
                  <Building className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Empresa ID</p>
                    <p className="font-medium">{user.company_id}</p>
                  </div>
                </div>
              )}

              {profile && (
                <div>
                  <p className="text-sm text-gray-600">Miembro desde</p>
                  <p className="font-medium">
                    {new Date(profile.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
