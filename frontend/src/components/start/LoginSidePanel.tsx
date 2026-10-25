import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../../api/auth'
import { useAuth } from '../../auth/AuthContext'
import crossIcon from '../../assets/icon-cross.svg'
import firstLoginIcon from '../../assets/icon-first-login-button.png'
import huaweiIcon from '../../assets/icon-huawei-store.png'
import linkArrow from '../../assets/icon-link-arrow.png'
import rustoreIcon from '../../assets/icon-rustore.png'
import samsungIcon from '../../assets/icon-samsung-store.png'
import secondLoginIcon from '../../assets/icon-second-login-button.png'
import qrCode from '../../assets/img-login-qr-code.png'
import referralBanner from '../../assets/start/referral-banner.png'

export function LoginSidePanel() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [selected, setSelected] = useState<string>(DEMO_ACCOUNTS[0].login)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleDemoLogin(loginName: string = selected) {
    setBusy(true)
    setError(null)
    try {
      const user = await login(loginName, DEMO_PASSWORD)
      navigate(user.role === 'manager' ? '/manager' : '/app', { replace: true })
    } catch {
      setError('Не удалось войти. Проверьте, что backend запущен.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <aside className="login-side-panel">
      <div className="login-side-panel-inner">
        <div className="absolute left-5 top-5 flex h-[58px] w-[448px] items-start justify-between">
          <h1 className="m-0 pl-3 pt-1.5 text-[29.6px] font-bold leading-9 tracking-[0.1px] text-[rgba(3,3,6,0.88)]">
            Выберите способ входа
          </h1>
          <button type="button" className="flex size-12 items-center justify-center" aria-label="Закрыть">
            <img src={crossIcon} alt="" className="size-6" width={24} height={24} />
          </button>
        </div>

        <div className="absolute left-10 top-[102px] flex w-[420px] flex-col gap-3">
          <label className="flex flex-col gap-2 rounded-[24px] bg-[#f2f3f5] px-6 py-4">
            <span className="flex items-center gap-4">
              <img src={firstLoginIcon} alt="" className="h-12 w-[60px] shrink-0 object-contain" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[18px] font-bold leading-6 text-[rgba(3,3,6,0.88)]">
                  Демо-вход
                </span>
                <span className="text-base leading-6 text-[rgba(3,3,6,0.88)]">
                  Пароль для всех: {DEMO_PASSWORD}
                </span>
              </span>
            </span>
            <select
              className="mt-1 h-12 w-full rounded-[16px] border-0 bg-white px-4 text-base text-[rgba(3,3,6,0.88)]"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              disabled={busy}
            >
              {DEMO_ACCOUNTS.map((account) => (
                <option key={account.login} value={account.login}>
                  {account.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleDemoLogin()}
              className="flex h-12 w-full items-center justify-center rounded-[16px] border-0 bg-[#ef3124] text-base font-bold text-white disabled:opacity-60"
            >
              {busy ? 'Вход…' : 'Войти'}
            </button>
            {error ? (
              <p className="m-0 text-sm leading-5 text-[#ef3124]">{error}</p>
            ) : null}
          </label>

          <button
            type="button"
            disabled={busy}
            onClick={() => void handleDemoLogin('manager')}
            className="flex h-24 w-full items-center rounded-[24px] border-0 bg-[#f2f3f5] px-6 text-left disabled:opacity-60"
          >
            <img src={secondLoginIcon} alt="" className="h-12 w-[60px] shrink-0 object-contain" />
            <span className="ml-6 flex-1 text-[18px] font-bold leading-6 text-[rgba(3,3,6,0.88)]">
              Быстрый вход менеджера
            </span>
            <img src={linkArrow} alt="" className="ml-2 h-6 w-9 shrink-0 object-contain" />
          </button>
        </div>

        <p className="absolute left-10 top-[420px] m-0 text-[22px] font-bold leading-[26px] tracking-[0.2px] text-[rgba(3,3,6,0.88)]">
          Альфа-Бизнес в&nbsp;смартфоне
        </p>

        <div className="absolute left-10 top-[470px] flex h-[52px] w-[420px] rounded-full bg-[rgba(30,43,68,0.08)] p-0.5">
          <div className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#212124] text-base text-white/95">
            Андроид
          </div>
          <div className="flex h-12 flex-1 items-center justify-center text-base text-[rgba(3,3,6,0.88)]">
            Айфон
          </div>
        </div>

        <div className="absolute left-10 top-[546px] h-[388px] w-[420px] rounded-[32px] bg-[#f2f3f5] px-8 pt-8">
          <p className="m-0 text-lg font-bold leading-6 text-[rgba(3,3,6,0.88)]">Установите приложение</p>
          <ol className="mt-3 list-none space-y-3 p-0 pl-5 text-base leading-6 text-[rgba(3,3,6,0.88)]">
            <li className="relative pl-1 before:absolute before:-left-5 before:font-bold before:text-[#ef3124] before:content-['1']">
              Отсканируйте QR-код камерой телефона и&nbsp;перейдите по&nbsp;ссылке
            </li>
            <li className="relative pl-1 before:absolute before:-left-5 before:font-bold before:text-[#ef3124] before:content-['2']">
              Выберите удобный магазин приложений
            </li>
            <li className="relative pl-1 before:absolute before:-left-5 before:font-bold before:text-[#ef3124] before:content-['3']">
              Скачайте и&nbsp;установите
            </li>
          </ol>

          <div className="mt-6 flex h-40 items-start gap-3 rounded-[16px] bg-white p-6">
            <img src={qrCode} alt="QR-код" className="h-[108px] w-[124px] object-contain" />
            <div className="flex flex-col gap-2 pt-3">
              <div className="flex items-center gap-2">
                <img src={samsungIcon} alt="" className="size-6 object-contain" />
                <span className="text-xs leading-4 text-[rgba(3,3,6,0.88)]">Samsung Galaxy Store</span>
              </div>
              <div className="flex items-center gap-2">
                <img src={huaweiIcon} alt="" className="size-6 object-contain" />
                <span className="text-xs leading-4 text-[rgba(3,3,6,0.88)]">Huawei AppGallery</span>
              </div>
              <div className="flex items-center gap-2">
                <img src={rustoreIcon} alt="" className="size-6 object-contain" />
                <span className="text-xs leading-4 text-[rgba(3,3,6,0.88)]">Магазин RuStore</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute left-10 top-[982px] h-[134px] w-[420px] overflow-hidden rounded-[24px] bg-[#121213]">
          <img
            src={referralBanner}
            alt=""
            className="pointer-events-none absolute left-0 top-0 h-[103%] w-full max-w-none"
          />
          <p className="absolute left-6 top-6 z-10 m-0 w-[248px] text-lg font-bold leading-[22px] tracking-[0.38px] text-white/95">
            Рекомендуйте Альфа‑Банк
          </p>
          <p className="absolute left-6 top-[51.33px] z-10 m-0 w-[206px] whitespace-pre-wrap text-sm leading-5 tracking-[-0.08px] text-white/95">
            {`Посоветуйте открыть счёт\nдрузьям\u00a0— вы\u00a0получите 4000,\nа\u00a0друзья получат 2000\u00a0баллов`}
          </p>
        </div>
      </div>
    </aside>
  )
}
