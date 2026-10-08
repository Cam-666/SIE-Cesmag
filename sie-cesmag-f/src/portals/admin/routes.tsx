import { Navigate, Route, Routes } from "react-router-dom"
import { RequirePermiso } from "@/app/guards"
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
        <Route
          path="dashboard"
          element={
            <RequirePermiso modulo="dashboard">
              <DashboardPage />
            </RequirePermiso>
          }
        />
        <Route
          path="emprendimientos"
          element={
            <RequirePermiso modulo="emprendimientos">
              <EmprendimientosPage />
            </RequirePermiso>
          }
        />
        <Route
          path="emprendimientos/:id"
          element={
            <RequirePermiso modulo="emprendimientos">
              <EmprendimientoDetallePage />
            </RequirePermiso>
          }
        />
        <Route
          path="asesorias/*"
          element={
            <RequirePermiso modulo="asesorias">
              <AsesoriasPage />
            </RequirePermiso>
          }
        />
        <Route
          path="entregables/*"
          element={
            <RequirePermiso modulo="entregables">
              <EntregablesPage />
            </RequirePermiso>
          }
        />
        <Route
          path="reportes/*"
          element={
            <RequirePermiso modulo="reportes">
              <ReportesPage />
            </RequirePermiso>
          }
        />
        <Route
          path="usuarios-roles/*"
          element={
            <RequirePermiso modulo="usuarios-roles">
              <UsuariosRolesPage />
            </RequirePermiso>
          }
        />
        <Route path="mi-perfil" element={<MiPerfilAdminPage />} />
        <Route path="calendario" element={<CalendarioPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  )
}
