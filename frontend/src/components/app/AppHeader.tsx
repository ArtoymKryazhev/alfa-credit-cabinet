import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import alfaLogo from '../../assets/icon-alfa-logo.svg'
import businessLogo from '../../assets/img-buisnes-logo.png'
import logoutIcon from '../../assets/icon-logout.svg'
import mailIcon from '../../assets/icon-mail.svg'
import notificationIcon from '../../assets/icon-notification.svg'
import avatarImg from '../../assets/app/avatar-accountant.png'
import backArrow from '../../assets/app/icon-back-arrow.svg'
import lampProgress from '../../assets/app/icon-lamp-progress.png'

export type AppSection = 'products' | 'business' | 'applications'

type AppHeaderProps = {
  activeSection?: AppSection
  onSectionChange?: (section: AppSection) => void
}

const navItemBase =
  'flex h-9 items-center justify-center border-0 px-2 text-[12px] leading-4 transition-colors'
const navItemActive =
  'rounded-[32px] bg-[#f2f3f5] text-[rgba(3,3,6,0.88)]'
const navItemIdle = 'bg-transparent text-white/70 hover:text-white'

export function AppHeader({
  activeSection = 'products',
  onSectionChange,
}: AppHeaderProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const companyLabel = user?.company_name ?? 'Компания'
  const personLabel = user?.display_name ?? 'Клиент'

  return (
    <header className="relative z-20 h-[92px] shrink-0 bg-[#0b0b0c]">
      <div className="relative mx-auto h-full w-[1920px]">
        <button
          type="button"
          className="absolute left-[74px] top-[37px] flex items-center gap-2 border-0 bg-transparent p-0 text-[14px] leading-4 text-white/90"
        >
          <img src={backArrow} alt="" className="size-2.5" width={10} height={10} />
          Назад
        </button>

        <img
          src={alfaLogo}
          alt="Альфа-Банк"
          className="absolute left-[474px] top-[26px] h-10 w-7"
          width={28}
          height={40}
        />

        <nav className="absolute left-[532px] top-[26px] flex h-10 w-[331px] items-center rounded-[32px] bg-[#242427] p-0.5">
          <button
            type="button"
            className={`${navItemBase} w-[145px] shrink-0 ${
              activeSection === 'products' ? navItemActive : navItemIdle
            }`}
            onClick={() => onSectionChange?.('products')}
          >
            Кредитные продукты
          </button>
          <button
            type="button"
            className={`${navItemBase} flex-1 ${
              activeSection === 'business' ? navItemActive : navItemIdle
            }`}
            onClick={() => onSectionChange?.('business')}
          >
            Мой бизнес
          </button>
          <button
            type="button"
            className={`${navItemBase} flex-1 ${
              activeSection === 'applications' ? navItemActive : navItemIdle
            }`}
            onClick={() => onSectionChange?.('applications')}
          >
            Мои заявки
          </button>
        </nav>

        <div className="absolute right-10 top-2 flex h-14 items-center">
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-[10px] border-0 bg-transparent p-2"
            aria-label="Альфа-Интеллект"
          >
            <img src={lampProgress} alt="" className="size-6 object-contain" width={24} height={24} />
          </button>

          <span className="mx-1 h-8 w-px bg-white/20" aria-hidden />

          <button
            type="button"
            className="flex size-10 items-center justify-center border-0 bg-transparent p-0"
            aria-label="Почта"
          >
            <img src={mailIcon} alt="" className="size-5" width={20} height={20} />
          </button>
          <button
            type="button"
            className="flex size-10 items-center justify-center border-0 bg-transparent p-0"
            aria-label="Уведомления"
          >
            <img src={notificationIcon} alt="" className="size-5" width={20} height={20} />
          </button>

          <span className="mx-1 h-8 w-px bg-white/20" aria-hidden />

          <button
            type="button"
            className="ml-1 flex min-w-[170px] items-center gap-3 border-0 bg-transparent px-2 py-0"
          >
            <img
              src={businessLogo}
              alt=""
              className="size-10 shrink-0 rounded-[10px] object-cover"
              width={40}
              height={40}
            />
            <span className="flex min-w-0 flex-col items-start text-left">
              <span className="max-w-[200px] truncate whitespace-nowrap text-[14px] font-medium leading-5 tracking-[0.07px] text-white/88">
                {companyLabel}
              </span>
              <span className="max-w-[200px] truncate whitespace-nowrap text-[12px] leading-4 tracking-[0.06px] text-white/55">
                {personLabel}
              </span>
            </span>
          </button>

          <span className="mx-1 h-8 w-px bg-white/20" aria-hidden />

          <button
            type="button"
            className="ml-1 flex h-10 items-center gap-2 rounded-full border border-[#212124] bg-[#212124] py-2 pl-[9px] pr-[17px]"
          >
            <img
              src={avatarImg}
              alt=""
              className="size-6 rounded-xl object-cover"
              width={24}
              height={24}
            />
            <span className="whitespace-nowrap text-[12px] font-medium leading-4 tracking-[0.19px] text-white/94">
              {user?.login ?? 'Клиент'}
            </span>
          </button>

          <span className="mx-1 h-8 w-px bg-white/20" aria-hidden />

          <button
            type="button"
            className="flex size-10 items-center justify-center border-0 bg-transparent p-0"
            aria-label="Выйти"
            onClick={() => void handleLogout()}
          >
            <img src={logoutIcon} alt="" className="size-5" width={20} height={20} />
          </button>
        </div>
      </div>
    </header>
  )
}
