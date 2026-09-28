import { useState } from "react"
import { Outlet } from "react-router-dom"
import { AdminSidebar } from "@/portals/admin/layout/AdminSidebar"
import { AdminTopbar } from "@/portals/admin/layout/AdminTopbar"

/** Shell del portal administrativo (Vicerrector / Coordinador / Empleado). */
export function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-dvh overflow-hidden bg-muted/40">
      <AdminSidebar mobileOpen={mobileMenuOpen} onMobileOpenChange={setMobileMenuOpen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar onAbrirMenuMovil={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
