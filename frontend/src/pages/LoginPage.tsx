import { LoginSidePanel } from '../components/start/LoginSidePanel'
import { StartBusinessSection } from '../components/start/StartBusinessSection'
import { StartHeader } from '../components/start/StartHeader'
import { StartHeroCards } from '../components/start/StartHeroCards'

export function LoginPage() {
  return (
    <div className="min-h-screen overflow-auto bg-[#0b0b0c]">
      <div className="relative mx-auto h-[1249px] w-[1920px] overflow-hidden font-['Segoe_UI',system-ui,sans-serif]">
        <StartHeroCards />
        <StartBusinessSection />
        <StartHeader />

        {/* Dim overlay — covers landing under the open login panel */}
        <div className="absolute inset-0 z-20 bg-black/55" aria-hidden />

        <LoginSidePanel />
      </div>
    </div>
  )
}
