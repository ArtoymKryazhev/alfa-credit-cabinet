import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { RequireAuth } from './auth/RequireAuth'
import { RoleSwitchFab } from './components/dev/RoleSwitchFab'
import { AppWorkspacePage } from './pages/AppWorkspacePage'
import { LoginPage } from './pages/LoginPage'
import { ManagerApplicationPage } from './pages/ManagerApplicationPage'
import { ManagerPage } from './pages/ManagerPage'

function LoginRoute() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0b0c] text-white/80">
        Загрузка…
      </div>
    )
  }
  if (user) {
    return <Navigate to={user.role === 'manager' ? '/manager' : '/app'} replace />
  }
  return <LoginPage />
}

function ClientAppRoute() {
  return (
    <RequireAuth role="client">
      <AppWorkspacePage />
    </RequireAuth>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/app" element={<ClientAppRoute />} />
          <Route path="/app/business" element={<ClientAppRoute />} />
          <Route path="/app/applications" element={<ClientAppRoute />} />
          <Route path="/app/applications/:id" element={<ClientAppRoute />} />
          <Route
            path="/manager"
            element={
              <RequireAuth role="manager">
                <ManagerPage />
              </RequireAuth>
            }
          />
          <Route
            path="/manager/applications/:id"
            element={
              <RequireAuth role="manager">
                <ManagerApplicationPage />
              </RequireAuth>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <RoleSwitchFab />
      </BrowserRouter>
    </AuthProvider>
  )
}
