import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

type RequireAuthProps = {
  role: 'client' | 'manager'
  children: React.ReactNode
}

export function RequireAuth({ role, children }: RequireAuthProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0b0c] text-white/80">
        Загрузка…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (user.role !== role) {
    const fallback = user.role === 'manager' ? '/manager' : '/app'
    return <Navigate to={fallback} replace />
  }

  return children
}
