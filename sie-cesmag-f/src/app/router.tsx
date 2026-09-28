import { Navigate, Route, Routes } from "react-router-dom"
import { RedirectIfAuthenticated, RequireAuth } from "@/app/guards"
import { rutaPortal } from "@/domain/auth/rutas"
import { useAuthStore } from "@/stores/auth-store"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage"
import { ResetPasswordPage } from "@/features/auth/pages/ResetPasswordPage"
import { AdminRoutes } from "@/portals/admin/routes"
import { EmprendedorRoutes } from "@/portals/emprendedor/routes"

function RaizRedirect() {
  const sesion = useAuthStore((state) => state.sesion)
  return <Navigate to={sesion ? rutaPortal(sesion.ambito) : "/login"} replace />
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RaizRedirect />} />

      <Route
        path="/login"
        element={
          <RedirectIfAuthenticated>
            <LoginPage />
          </RedirectIfAuthenticated>
        }
      />
      <Route path="/recuperar-password" element={<ForgotPasswordPage />} />
      <Route path="/restablecer-password" element={<ResetPasswordPage />} />

      <Route
        path="/admin/*"
        element={
          <RequireAuth ambito="admin">
            <AdminRoutes />
          </RequireAuth>
        }
      />
      <Route
        path="/emprendedor/*"
        element={
          <RequireAuth ambito="emprendedor">
            <EmprendedorRoutes />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
