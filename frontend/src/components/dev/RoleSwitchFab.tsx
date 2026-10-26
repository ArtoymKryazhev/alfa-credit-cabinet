import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEMO_PASSWORD, getLastClientLogin } from '../../api/auth'
import { useAuth } from '../../auth/AuthContext'

export function RoleSwitchFab() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user || (user.role !== 'client' && user.role !== 'manager')) {
    return null
  }

  const isManager = user.role === 'manager'

  async function switchTo(role: 'client' | 'manager') {
    if (busy) return
    if (role === 'manager' && isManager) return
    if (role === 'client' && !isManager) return

    setBusy(true)
    setError(null)
    try {
      if (role === 'manager') {
        await login('manager', DEMO_PASSWORD)
        navigate('/manager', { replace: true })
      } else {
        const clientLogin = getLastClientLogin()
        await login(clientLogin, DEMO_PASSWORD)
        navigate('/app', { replace: true })
      }
    } catch {
      setError('Не удалось переключить роль')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2">
      {error ? (
        <p className="pointer-events-auto m-0 rounded-[10px] bg-white/95 px-3 py-2 text-[12px] leading-4 text-[#ef3124] shadow-[0_8px_24px_rgba(15,25,55,0.12)]">
          {error}
        </p>
      ) : null}

      <div
        className="pointer-events-auto relative flex h-11 w-[220px] items-center rounded-full bg-[#212124] p-1 shadow-[0_12px_32px_rgba(15,25,55,0.28)]"
        role="group"
        aria-label="Переключение роли для демо"
      >
        <span
          aria-hidden
          className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-white transition-transform duration-300 ease-out ${
            isManager ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'
          }`}
          style={{ left: 4 }}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => void switchTo('client')}
          className={`relative z-10 flex h-9 flex-1 items-center justify-center rounded-full border-0 bg-transparent text-[13px] font-medium transition-colors duration-300 disabled:opacity-60 ${
            isManager ? 'text-white/70' : 'text-[rgba(3,3,6,0.88)]'
          }`}
        >
          {busy && !isManager ? '…' : 'Клиент'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void switchTo('manager')}
          className={`relative z-10 flex h-9 flex-1 items-center justify-center rounded-full border-0 bg-transparent text-[13px] font-medium transition-colors duration-300 disabled:opacity-60 ${
            isManager ? 'text-[rgba(3,3,6,0.88)]' : 'text-white/70'
          }`}
        >
          {busy && isManager ? '…' : 'Менеджер'}
        </button>
      </div>
    </div>
  )
}
