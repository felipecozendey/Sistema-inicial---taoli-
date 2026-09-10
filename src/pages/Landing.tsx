import { useEffect } from 'react'
import { LandingNavbar } from '@/components/landing/LandingNavbar'
import { LandingHero } from '@/components/landing/LandingHero'
import { LandingFeatures } from '@/components/landing/LandingFeatures'
import { LandingSteps } from '@/components/landing/LandingSteps'
import { LandingFinalCta } from '@/components/landing/LandingFinalCta'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { useSiteSettingsStore } from '@/stores/useSiteSettingsStore'

export default function Landing() {
  const { flags, loadSiteData } = useSiteSettingsStore()

  useEffect(() => {
    loadSiteData()
  }, [loadSiteData])

  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground selection:bg-[#58CC02]/20">
      <LandingNavbar />

      <main className="flex-1">
        {flags.hero !== false && <LandingHero />}
        {flags.features_section !== false && <LandingFeatures />}
        {flags.how_it_works !== false && <LandingSteps />}
        {flags.final_cta !== false && <LandingFinalCta />}
      </main>

      {flags.footer !== false && <LandingFooter />}
    </div>
  )
}
