import { useNavigate } from 'react-router-dom'

export function LoginPage() {
  const navigate = useNavigate()

  function handleEnter() {
    // Temporary stub: no auth API — redirect only until team confirms demo-login
    navigate('/app')
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Кредитный кабинет
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Имитация входа. Авторизация будет добавлена после решения команды.
        </p>
        <button
          type="button"
          onClick={handleEnter}
          className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          Войти
        </button>
      </section>
    </main>
  )
}
