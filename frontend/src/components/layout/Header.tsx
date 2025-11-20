import { useAuthStore } from '../../store/authStore'

export default function Header() {
  const { user } = useAuthStore()

  return (
    <header className="bg-white shadow-sm border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-800">
          Plataforma de Capacitación
        </h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {user?.email}
          </span>
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  )
}

