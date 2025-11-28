import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/Dashboard'
import Courses from './pages/courses/Courses'
import CourseDetail from './pages/courses/CourseDetail'
import CreateCourse from './pages/courses/CreateCourse'
import CreateModule from './pages/courses/modules/CreateModule'
import EditModule from './pages/courses/modules/EditModule'
import CreateModuleContent from './pages/courses/modules/CreateModuleContent'
import EditModuleContent from './pages/courses/modules/EditModuleContent'
import Chat from './pages/chat/Chat'
import RAGChat from './pages/chat/RAGChat'
import Calendar from './pages/Calendar'
import Profile from './pages/Profile'
import Documents from './pages/documents/Documents'
import Companies from './pages/companies/Companies'
import CreateCompany from './pages/companies/CreateCompany'
import EditCompany from './pages/companies/EditCompany'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/courses" element={<Courses />} />
                  <Route path="/courses/create" element={<CreateCourse />} />
                  <Route path="/courses/:id" element={<CourseDetail />} />
                  <Route path="/courses/:id/modules/create" element={<CreateModule />} />
                  <Route path="/courses/:id/modules/:moduleId/edit" element={<EditModule />} />
                  <Route path="/courses/:id/modules/:moduleId/contents/create" element={<CreateModuleContent />} />
                  <Route path="/courses/:id/modules/:moduleId/contents/:contentId/edit" element={<EditModuleContent />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/rag" element={<RAGChat />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/documents" element={<Documents />} />
                  <Route path="/companies" element={<Companies />} />
                  <Route path="/companies/create" element={<CreateCompany />} />
                  <Route path="/companies/:id/edit" element={<EditCompany />} />
                </Routes>
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  )
}

export default App

