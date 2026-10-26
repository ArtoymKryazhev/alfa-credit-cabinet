import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'

type ManagerHeaderProps = {
  onLogout: () => void
}

export function ManagerHeader({ onLogout }: ManagerHeaderProps) {
  const { user } = useAuth()

  return (
    <header className="flex h-[72px] items-center justify-between bg-[#0b0b0c] px-10 text-white">
      <div>
        <Link to="/manager" className="m-0 text-lg font-bold text-white no-underline">
          Кабинет менеджера
        </Link>
        <p className="m-0 text-sm text-white/60">
          {user?.display_name ?? 'Менеджер'}
        </p>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="rounded-full border border-white/20 bg-transparent px-4 py-2 text-sm text-white/90"
      >
        Выйти
      </button>
    </header>
  )
}
