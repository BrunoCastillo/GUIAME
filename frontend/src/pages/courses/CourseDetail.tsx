import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { courseService, Course } from '../../services/courseService'
import { moduleService, Module, ModuleContent } from '../../services/moduleService'
import { useAuthStore } from '../../store/authStore'
import { BookOpen, Plus, Edit, Trash2, FileText, Video, Link as LinkIcon, CheckCircle, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [moduleContents, setModuleContents] = useState<Record<number, ModuleContent[]>>({})
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [deletingModuleId, setDeletingModuleId] = useState<number | null>(null)
  const [deletingContentId, setDeletingContentId] = useState<number | null>(null)

  const isInstructor = user?.role === 'profesor' || user?.role === 'administrador' || user?.role === 'company_admin'
  const isStudent = user?.role === 'estudiante'

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return
      try {
        setLoading(true)
        const [courseData, modulesData] = await Promise.all([
          courseService.getCourse(parseInt(id)),
          moduleService.getCourseModules(parseInt(id))
        ])
        setCourse(courseData)
        setModules(modulesData)
        
        // Cargar contenido de cada módulo
        const contents: Record<number, ModuleContent[]> = {}
        const contentPromises = modulesData.map(async (module) => {
          try {
            const content = await moduleService.getModuleContents(module.id)
            return { moduleId: module.id, content }
          } catch (error) {
            console.error(`Error loading content for module ${module.id}:`, error)
            return { moduleId: module.id, content: [] }
          }
        })
        
        const contentResults = await Promise.all(contentPromises)
        contentResults.forEach(({ moduleId, content }) => {
          contents[moduleId] = content
        })
        
        setModuleContents(contents)
      } catch (error) {
        console.error('Error fetching course data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const handleEnroll = async () => {
    if (!id) return
    try {
      await courseService.enrollInCourse(parseInt(id))
      alert('Inscripción exitosa')
      // Recargar datos
      window.location.reload()
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error al inscribirse')
    }
  }

  const handleDeleteModule = async (moduleId: number) => {
    if (!id || !confirm('¿Estás seguro de que deseas eliminar este módulo? Se eliminará todo su contenido.')) {
      return
    }

    try {
      setDeletingModuleId(moduleId)
      await moduleService.deleteModule(parseInt(id), moduleId)
      setModules(modules.filter(m => m.id !== moduleId))
      const newContents = { ...moduleContents }
      delete newContents[moduleId]
      setModuleContents(newContents)
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error al eliminar el módulo')
    } finally {
      setDeletingModuleId(null)
    }
  }

  const handleDeleteContent = async (moduleId: number, contentId: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este contenido?')) {
      return
    }

    try {
      setDeletingContentId(contentId)
      await moduleService.deleteModuleContent(moduleId, contentId)
      setModuleContents({
        ...moduleContents,
        [moduleId]: moduleContents[moduleId].filter(c => c.id !== contentId)
      })
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error al eliminar el contenido')
    } finally {
      setDeletingContentId(null)
    }
  }

  const toggleModule = (moduleId: number) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId)
    } else {
      newExpanded.add(moduleId)
    }
    setExpandedModules(newExpanded)
  }

  const getContentIcon = (contentType: string) => {
    switch (contentType) {
      case 'video':
        return <Video className="w-4 h-4" />
      case 'document':
        return <FileText className="w-4 h-4" />
      case 'link':
        return <LinkIcon className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Cargando curso...</p>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Curso no encontrado</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
        <p className="text-gray-600 mt-2">{course.description || 'Sin descripción'}</p>
      </div>

      {/* Botón de inscripción para estudiantes */}
      {isStudent && (
        <div className="bg-white rounded-lg shadow p-6">
          <button
            onClick={handleEnroll}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Inscribirse al Curso
          </button>
        </div>
      )}

      {/* Botón para crear módulo (solo instructores) */}
      {isInstructor && (
        <div className="flex justify-end">
          <Link
            to={`/courses/${id}/modules/create`}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Crear Módulo (Tema)
          </Link>
        </div>
      )}

      {/* Lista de módulos */}
      <div className="space-y-4">
        {modules.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay módulos disponibles</h3>
            <p className="text-gray-600">
              {isInstructor 
                ? 'Comienza creando el primer módulo (tema) para este curso'
                : 'Este curso aún no tiene módulos disponibles'}
            </p>
          </div>
        ) : (
          modules.map((module) => (
            <div key={module.id} className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => toggleModule(module.id)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {expandedModules.has(module.id) ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900">{module.title}</h3>
                      {module.description && (
                        <p className="text-gray-600 text-sm mt-1">{module.description}</p>
                      )}
                    </div>
                  </div>
                  {isInstructor && (
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/courses/${id}/modules/${module.id}/edit`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Editar módulo"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteModule(module.id)}
                        disabled={deletingModuleId === module.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        title="Eliminar módulo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <Link
                        to={`/courses/${id}/modules/${module.id}/contents/create`}
                        className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary/90 transition-colors flex items-center gap-1"
                        title="Agregar contenido"
                      >
                        <Plus className="w-4 h-4" />
                        Contenido
                      </Link>
                    </div>
                  )}
                </div>

                {/* Contenido del módulo (expandible) */}
                {expandedModules.has(module.id) && (
                  <div className="mt-4 pt-4 border-t">
                    {moduleContents[module.id]?.length === 0 ? (
                      <p className="text-gray-500 text-sm">
                        {isInstructor 
                          ? 'Este módulo no tiene contenido. Agrega contenido para que los estudiantes puedan verlo.'
                          : 'Este módulo aún no tiene contenido disponible.'}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {moduleContents[module.id]?.map((content) => (
                          <div
                            key={content.id}
                            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                {getContentIcon(content.content_type)}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-gray-500 uppercase">
                                      {content.content_type}
                                    </span>
                                  </div>
                                  {content.content && (
                                    <div className="mt-2 text-sm text-gray-700">
                                      {content.content_type === 'text' ? (
                                        <div className="whitespace-pre-wrap">{content.content}</div>
                                      ) : content.content_type === 'link' ? (
                                        <a
                                          href={content.content || '#'}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline flex items-center gap-1"
                                        >
                                          {content.content}
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      ) : (
                                        <p>{content.content}</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {isInstructor && (
                                <div className="flex items-center gap-2 ml-4">
                                  <Link
                                    to={`/courses/${id}/modules/${module.id}/contents/${content.id}/edit`}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Editar contenido"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Link>
                                  <button
                                    onClick={() => handleDeleteContent(module.id, content.id)}
                                    disabled={deletingContentId === content.id}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                    title="Eliminar contenido"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

