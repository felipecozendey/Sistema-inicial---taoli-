import { Outlet } from 'react-router-dom'
import { Sidebar } from './layout/sidebar'
import { BottomNav } from './layout/bottom-nav'

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
