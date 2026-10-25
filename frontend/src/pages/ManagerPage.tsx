import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function ManagerPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f2f3f5]">
      <header className="flex h-[72px] items-center justify-between bg-[#0b0b0c] px-10 text-white">
        <div>
          <p className="m-0 text-lg font-bold">Кабинет менеджера</p>
          <p className="m-0 text-sm text-white/60">{user?.display_name ?? 'Менеджер'}</p>
        </div>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="rounded-full border border-white/20 bg-transparent px-4 py-2 text-sm text-white/90"
        >
          Выйти
        </button>
      </header>
      <main className="mx-auto flex w-full max-w-[960px] flex-1 flex-col items-start justify-center px-8 py-16">
        <h1 className="m-0 text-3xl font-bold text-[rgba(3,3,6,0.88)]">Очередь заявок</h1>
        <p className="mt-4 max-w-xl text-lg leading-7 text-[rgba(3,3,6,0.72)]">
          Очередь появится в T05. Сейчас это заглушка для демо-входа менеджера.
        </p>
      </main>
    </div>
  )
}
