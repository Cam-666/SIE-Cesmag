import { Navigate, Route, Routes } from "react-router-dom"
import { AdminLayout } from "@/portals/admin/layout/AdminLayout"
import { DashboardPage } from "@/portals/admin/pages/dashboard/DashboardPage"
import { EmprendimientosPage } from "@/portals/admin/pages/emprendimientos/EmprendimientosPage"
import { EmprendimientoDetallePage } from "@/portals/admin/pages/emprendimientos/EmprendimientoDetallePage"
import { AsesoriasPage } from "@/portals/admin/pages/asesorias/AsesoriasPage"
import { EntregablesPage } from "@/portals/admin/pages/entregables/EntregablesPage"
import { ReportesPage } from "@/portals/admin/pages/reportes/ReportesPage"
import { UsuariosRolesPage } from "@/portals/admin/pages/usuarios-roles/UsuariosRolesPage"
import { MiPerfilAdminPage } from "@/portals/admin/pages/mi-perfil/MiPerfilAdminPage"
import { CalendarioPage } from "@/portals/admin/pages/calendario/CalendarioPage"

/** Rutas anidadas del portal administrativo, montadas bajo /admin/* (RequireAuth ambito="admin"). */
export function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="emprendimientos" element={<EmprendimientosPage />} />
        <Route path="emprendimientos/:id" element={<EmprendimientoDetallePage />} />
        <Route path="asesorias/*" element={<AsesoriasPage />} />
        <Route path="entregables/*" element={<EntregablesPage />} />
        <Route path="reportes/*" element={<ReportesPage />} />
        <Route path="usuarios-roles/*" element={<UsuariosRolesPage />} />
        <Route path="mi-perfil" element={<MiPerfilAdminPage />} />
        <Route path="calendario" element={<CalendarioPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  )
}
