import { useState } from "react"
import { Outlet } from "react-router-dom"
import { EmprendedorSidebar } from "@/portals/emprendedor/layout/EmprendedorSidebar"
import { EmprendedorTopbar } from "@/portals/emprendedor/layout/EmprendedorTopbar"
import { useSesionAlDia } from "@/domain/auth/queries"

/** Shell del portal del emprendedor — experiencia separada del portal admin (no comparten shell). */
export function EmprendedorLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  useSesionAlDia()

  return (
    <div className="flex h-dvh overflow-hidden bg-muted/40">
      <EmprendedorSidebar mobileOpen={mobileMenuOpen} onMobileOpenChange={setMobileMenuOpen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <EmprendedorTopbar onAbrirMenuMovil={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
