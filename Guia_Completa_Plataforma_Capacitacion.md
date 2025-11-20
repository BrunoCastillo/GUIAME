
# Guía Completa — Plataforma de Capacitación Interactiva Multiempresa  
## React.js + Supabase + DeepSeek/Ollama + RAG + PostgreSQL + ChromaDB

Esta guía técnica en **Markdown** contiene **todas las funcionalidades**, **arquitectura completa**, **módulos frontend y backend**, **flujos clave**, **modelo multiempresa**, **seguridad**, y **procesos RAG** para implementar la plataforma de capacitación interactiva basada en un Plan de Igualdad.

---

# 1. Objetivo General  
Construir una plataforma moderna, escalable y multiempresa que permita:

- Capacitación estructurada por módulos.
- Gestión de cursos, documentos, evaluaciones y progreso.
- Chat con IA usando RAG (DeepSeek/Ollama/ChromaDB).
- Roles y permisos granulares.
- Gestión de empresas, instructores y estudiantes.
- Documentos procesados automáticamente para indexación semántica.
- Panel administrativo completo.

---

# 2. Funcionalidades Frontend

## 2.1 Autenticación y seguridad
- Registro e inicio de sesión con Supabase Auth.  
- Tokens seguros (access + refresh).  
- MFA opcional.  
- Control de roles en frontend + server.  
- Manejo de sesión persistente.  

## 2.2 Dashboard/Home
- Vista personalizada por rol.  
- Próximos eventos.  
- Progreso del usuario.  
- Acceso rápido a cursos, chat y actividades.  

## 2.3 Chatbot LLM (RAG)
- Chat conversacional con asistencia basada en documentos cargados.  
- Muestra fuentes y fragmentos relevantes.  
- Usa embeddings + recuperación vectorial + DeepSeek para generación.  

## 2.4 Chat tradicional
- Chat tipo mensajería con instructores.  
- Notificaciones push.  
- Historial persistente.  

## 2.5 Calendario
- Eventos académicos.  
- Sesiones de capacitación, recordatorios.  
- Inscripciones.  

## 2.6 Perfil de usuario
- Edición de datos personales.  
- Cambio de contraseña.  
- Foto de perfil.  

## 2.7 Gestión de documentos
- Carga de PDF, PPTX, DOCX, videos.  
- Procesamiento automático.  
- OCR y transcripción.  
- Vista previa.  

## 2.8 Actividades académicas
- Tareas, evaluaciones, entregas.  
- Reglas de aprobación (18/20).  
- Seguimiento de avances.  

## 2.9 Componentes UI
- Sidebar, header, cards, alerts, modals.  
- Tabla reutilizable.  
- Sistema de formularios.  

## 2.10 Servicios y APIs
- Servicios centralizados (API, Auth, Chat, RAG).  
- Control de errores y validaciones.  

## 2.11 Responsive Design
- Mobile-first.  
- PWA ready.  

## 2.12 Funcionalidades adicionales
- Manejo de errores globales.  
- Validaciones completas.  
- Notificaciones push y correo.  

---

# 3. Módulos del Backend (17 categorías)

## 3.1 Autenticación y autorización
- JWT con claims personalizados (`role`, `company_id`).  
- Permisos avanzados por rol.  

## 3.2 Gestión de perfiles
- Perfiles extendidos: cargo, departamento, empresa.  

## 3.3 Gestión académica
- Cursos, módulos, evaluaciones, inscripciones.  

## 3.4 Gestión de documentos
- Subida, conversión, extracción de texto.  
- Limpieza, chunking y embeddings.  

## 3.5 Búsqueda vectorial / RAG
- pgvector o ChromaDB.  
- DeepSeek para embeddings o generación.  

## 3.6 Chat IA
- Pipeline completo de consulta → recuperación → generación.  

## 3.7 Chat tradicional
- Sistema tipo mensajería.  

## 3.8 Gestión de eventos
- Calendario, recursos, recordatorios.  

## 3.9 Integración Google Drive
- OAuth2  
- Sincronización selectiva de documentos.  

## 3.10 Servicios de IA
- Conectores Ollama, DeepSeek, OpenAI.  

## 3.11 Panel de administración
- Empresas, usuarios, cursos, documentos, logs.  

## 3.12 Documentación de API
- OpenAPI  
- Swagger  
- ReDoc  

## 3.13 Base de datos
- PostgreSQL + pgvector  
- ChromaDB externo opcional  

## 3.14 Configuración
- Variables de entorno.  
- Feature flags.  

## 3.15 Seguridad
- Sanitización  
- Rate limiting  
- RLS para multiempresa  

## 3.16 Dependencias
- React, Supabase, Vite, Zustand/Redux, Tailwind, Shadcn UI  
- Node.js/Express o Supabase Edge Functions  

## 3.17 Estadísticas y métricas
- Métricas de chat, cursos, eventos.  
- Panel analítico.  

---

# 4. Arquitectura Escalable Multiempresa (1.000 usuarios)

## 4.1 Modelo multi-tenant
Tabla base **companies**  
Todas las demás tablas incluyen `company_id`.

## 4.2 Roles
- **system_admin** → controla todas las empresas.  
- **company_admin** → controla su empresa.  
- **instructor** → gestiona cursos.  
- **student** → consume contenido.  

## 4.3 Componentes principales

### Frontend (React)
- Construido con Vite.  
- UI responsiva.  

### Backend
- Supabase: Auth, Postgres, Storage, pgvector.  
- Edge Functions para lógica avanzada.  
- Workers asíncronos para procesamiento de documentos.  

### Capa RAG
- ChromaDB o pgvector para búsqueda interna.  
- DeepSeek para generación.  
- Ollama opcional.  

### Escalabilidad
- Replicas read-only.  
- Cache Redis para respuestas.  
- Servicios stateless (auto-scale).  

---

# 5. Base de Datos — Esquema Principal

Incluye:

- companies  
- profiles  
- courses  
- modules  
- module_contents  
- quizzes  
- attempts  
- documents  
- chat_logs  
- events  
- notifications  

Con **company_id** en todas las tablas relevantes.  

---

# 6. Flujos Principales

## 6.1 Registro de empresa  
- system_admin crea empresa.  
- company_admin invita a instructores y estudiantes.  

## 6.2 Subida y procesamiento de documentos  
1. Usuario sube archivo.  
2. Worker extrae texto.  
3. Chunking.  
4. Embeddings.  
5. Registro en DB + vector DB.  

## 6.3 Chat RAG  
1. Query del usuario.  
2. Embedding de la pregunta.  
3. Recuperación top-k.  
4. Prompt templating.  
5. Respuesta IA + fuentes.  
6. Registro en logs.  

## 6.4 Evaluaciones  
- 20 preguntas por módulo.  
- Aprobación: **>= 18/20**.  
- Registro automático de progreso.  

## 6.5 Calendario  
- Eventos con recordatorios automáticos.  

---

# 7. Seguridad

- RLS por empresa.  
- JWT con claims.  
- Sanitización anti-XSS.  
- CORS seguro.  
- HTTPS obligatorio.  

---

# 8. Documentación API

- openapi.yaml  
- Swagger UI  
- ReDoc  

---

# 9. Checklist final

- [x] Multiempresa completo  
- [x] 17 módulos backend  
- [x] RAG funcional  
- [x] Búsqueda vectorial  
- [x] DeepSeek integrado  
- [x] Procesamiento automático  
- [x] UI completa + móvil  
- [x] Seguridad avanzada  
- [x] 50+ endpoints  

---

# Fin del documento
