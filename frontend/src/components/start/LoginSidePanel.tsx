import { useNavigate } from 'react-router-dom'
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

  return (
    <aside className="login-side-panel">
      <div className="login-side-panel-inner">
        <div className="absolute left-5 top-5 flex h-[58px] w-[448px] items-start justify-between">
          <h1 className="m-0 pl-3 pt-1.5 text-[28px] font-bold leading-9 tracking-[0.2px] text-[rgba(3,3,6,0.88)]">
            Выберите способ входа
          </h1>
          <button type="button" className="flex size-12 items-center justify-center" aria-label="Закрыть">
            <img src={crossIcon} alt="" className="size-6" width={24} height={24} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate('/app')}
          className="absolute left-10 top-[102px] flex h-[100px] w-[420px] items-center rounded-[20px] bg-[#f2f3f5] px-6 text-left"
        >
          <img src={firstLoginIcon} alt="" className="h-12 w-[60px] shrink-0 object-contain" />
          <span className="ml-6 flex min-w-0 flex-1 flex-col">
            <span className="text-[18px] font-bold leading-6 text-[rgba(3,3,6,0.88)]">Альфа‑Бизнес</span>
            <span className="text-base leading-6 text-[rgba(3,3,6,0.55)]">Интернет-банк</span>
          </span>
          <img src={linkArrow} alt="" className="ml-2 h-6 w-9 shrink-0 object-contain" />
        </button>

        <button
          type="button"
          onClick={() => navigate('/app')}
          className="absolute left-10 top-[218px] flex h-24 w-[420px] items-center rounded-[20px] bg-[#f2f3f5] px-6 text-left"
        >
          <img src={secondLoginIcon} alt="" className="h-12 w-[60px] shrink-0 object-contain" />
          <span className="ml-6 flex-1 text-[18px] font-bold leading-6 text-[rgba(3,3,6,0.88)]">
            Альфа‑Зарплата
          </span>
          <img src={linkArrow} alt="" className="ml-2 h-6 w-9 shrink-0 object-contain" />
        </button>

        <p className="absolute left-10 top-[362px] m-0 text-[20px] font-bold leading-[26px] text-[rgba(3,3,6,0.88)]">
          Альфа-Бизнес в&nbsp;смартфоне
        </p>

        <div className="absolute left-10 top-[412px] flex h-[52px] w-[420px] rounded-full bg-[#e7e8ea] p-0.5">
          <div className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#121213] text-base text-white/95">
            Андроид
          </div>
          <div className="flex h-12 flex-1 items-center justify-center text-base text-[rgba(3,3,6,0.88)]">
            Айфон
          </div>
        </div>

        <div className="absolute left-10 top-[488px] h-[388px] w-[420px] rounded-[24px] bg-[#f2f3f5] px-8 pt-8">
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
                <span className="text-sm leading-4 text-[rgba(3,3,6,0.88)]">Samsung Galaxy Store</span>
              </div>
              <div className="flex items-center gap-2">
                <img src={huaweiIcon} alt="" className="size-6 object-contain" />
                <span className="text-sm leading-4 text-[rgba(3,3,6,0.88)]">Huawei AppGallery</span>
              </div>
              <div className="flex items-center gap-2">
                <img src={rustoreIcon} alt="" className="size-6 object-contain" />
                <span className="text-sm leading-4 text-[rgba(3,3,6,0.88)]">Магазин RuStore</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute left-10 top-[924px] h-[134px] w-[420px] overflow-hidden rounded-[24px] bg-[#121213]">
          <img src={referralBanner} alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute left-6 top-6 z-10 max-w-[230px]">
            <p className="m-0 text-lg font-bold leading-[22px] tracking-[0.38px] text-white/95">
              Рекомендуйте Альфа‑Банк
            </p>
            <p className="mt-1.5 m-0 text-sm leading-5 tracking-[-0.08px] text-white/95">
              Посоветуйте открыть счёт друзьям&nbsp;— вы&nbsp;получите 4000, а&nbsp;друзья получат
              2000&nbsp;баллов
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
