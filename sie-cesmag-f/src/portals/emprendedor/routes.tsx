import { Navigate, Route, Routes } from "react-router-dom"
import { EmprendedorLayout } from "@/portals/emprendedor/layout/EmprendedorLayout"
import { DashboardPage } from "@/portals/emprendedor/pages/dashboard/DashboardPage"
import { MiEmprendimientoPage } from "@/portals/emprendedor/pages/mi-emprendimiento/MiEmprendimientoPage"
import { MisEntregablesPage } from "@/portals/emprendedor/pages/mis-entregables/MisEntregablesPage"
import { MisAsesoriasPage } from "@/portals/emprendedor/pages/mis-asesorias/MisAsesoriasPage"
import { MiPerfilPage } from "@/portals/emprendedor/pages/mi-perfil/MiPerfilPage"
import { CalendarioPage } from "@/portals/emprendedor/pages/calendario/CalendarioPage"

/** Rutas anidadas del portal del emprendedor, montadas bajo /emprendedor/* (RequireAuth ambito="emprendedor"). */
export function EmprendedorRoutes() {
  return (
    <Routes>
      <Route element={<EmprendedorLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="mi-emprendimiento" element={<MiEmprendimientoPage />} />
        <Route path="mis-entregables/*" element={<MisEntregablesPage />} />
        <Route path="mis-asesorias/*" element={<MisAsesoriasPage />} />
        <Route path="mi-perfil" element={<MiPerfilPage />} />
        <Route path="calendario" element={<CalendarioPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  )
}
