import { useState } from "react"
import { Outlet } from "react-router-dom"
import { AdminSidebar } from "@/portals/admin/layout/AdminSidebar"
import { AdminTopbar } from "@/portals/admin/layout/AdminTopbar"
import { useSesionAlDia } from "@/domain/auth/queries"

/** Shell del portal administrativo (Vicerrector / Coordinador / Administrativo). */
export function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  useSesionAlDia()

  return (
    <div className="flex h-dvh overflow-hidden bg-muted/40 print:block print:h-auto print:overflow-visible">
      <AdminSidebar mobileOpen={mobileMenuOpen} onMobileOpenChange={setMobileMenuOpen} />
      <div className="flex min-w-0 flex-1 flex-col print:block">
        <AdminTopbar onAbrirMenuMovil={() => setMobileMenuOpen(true)} />
        {/* Al imprimir (p. ej. "Generar informe" de Reportes) solo debe salir el
            contenido de la página — ni el sidebar ni el topbar tienen sentido
            en papel. Cada página decide qué de SU PROPIO contenido también se
            oculta (filtros, botones) marcándolo con print:hidden. */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 print:overflow-visible print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
