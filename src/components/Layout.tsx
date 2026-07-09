import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/sidebar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { FocusRadarToggle } from '@/components/focus-radar/focus-radar-toggle'

export default function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:pl-64 print:pl-0">
        <main className="p-4 md:p-8 pb-20 md:pb-8 print:p-0">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <FocusRadarToggle />
    </div>
  )
}
