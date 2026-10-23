import { LoginSidePanel } from '../components/start/LoginSidePanel'
import { StartBusinessSection } from '../components/start/StartBusinessSection'
import { StartHeader } from '../components/start/StartHeader'
import { StartHeroCards } from '../components/start/StartHeroCards'

export function LoginPage() {
  return (
    <div className="login-page relative min-h-screen overflow-hidden bg-[#0b0b0c] font-['Segoe_UI',system-ui,sans-serif]">
      <div className="login-light-bleed" aria-hidden />

      <div className="flex min-h-screen items-start justify-center">
        <div className="login-desktop-artboard relative overflow-hidden">
          <StartHeroCards />
          <StartBusinessSection />
          <StartHeader />
        </div>
      </div>

      {/* Dim over landing + bleeds; panel sits above */}
      <div className="pointer-events-none absolute inset-0 z-20 bg-black/55" aria-hidden />

      <LoginSidePanel />
    </div>
  )
}
