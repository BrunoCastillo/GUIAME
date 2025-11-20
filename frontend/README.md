# Frontend - Plataforma de Capacitación

Aplicación web desarrollada con React + TypeScript + Vite para la plataforma de capacitación interactiva.

## Características

- **React 18** con TypeScript
- **Vite** para desarrollo rápido
- **React Router** para navegación
- **Zustand** para gestión de estado
- **Tailwind CSS** para estilos
- **Axios** para peticiones HTTP
- **Responsive Design** mobile-first

## Requisitos

- Node.js 18+
- npm o yarn

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

3. Ejecutar en desarrollo:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/        # Componentes reutilizables
│   │   └── layout/       # Layout, Sidebar, Header
│   ├── pages/            # Páginas de la aplicación
│   │   ├── auth/         # Login, Register
│   │   ├── courses/      # Lista y detalle de cursos
│   │   ├── chat/         # Chat tradicional y RAG
│   │   └── documents/     # Gestión de documentos
│   ├── services/         # Servicios API
│   ├── store/            # Estado global (Zustand)
│   ├── utils/            # Utilidades
│   └── App.tsx           # Componente principal
├── public/               # Archivos estáticos
└── package.json
```

## Páginas Principales

- `/` - Dashboard
- `/courses` - Lista de cursos
- `/courses/:id` - Detalle de curso
- `/chat` - Chat tradicional
- `/rag` - Chat con IA (RAG)
- `/calendar` - Calendario de eventos
- `/documents` - Gestión de documentos
- `/profile` - Perfil de usuario
- `/login` - Iniciar sesión
- `/register` - Registrarse

## Build para Producción

```bash
npm run build
```

Los archivos se generarán en la carpeta `dist/`

## Preview de Producción

```bash
npm run preview
```

## Licencia

Proyecto privado - Todos los derechos reservados

