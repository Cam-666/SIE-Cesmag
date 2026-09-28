import {
  BarChart3,
  CalendarClock,
  FileCheck2,
  LayoutDashboard,
  Rocket,
  Users,
  type LucideIcon,
} from "lucide-react"
import type { ModuloAdmin } from "@/domain/usuario/types"

export interface AdminNavItem {
  modulo: ModuloAdmin
  label: string
  to: string
  icon: LucideIcon
}

/** Ítems del sidebar admin, en el orden del wireframe (Vicerrector/Coordinador/Empleado). */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { modulo: "dashboard", label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
  {
    modulo: "emprendimientos",
    label: "Emprendimientos",
    to: "/admin/emprendimientos",
    icon: Rocket,
  },
  { modulo: "asesorias", label: "Asesorías", to: "/admin/asesorias", icon: CalendarClock },
  { modulo: "entregables", label: "Entregables", to: "/admin/entregables", icon: FileCheck2 },
  {
    modulo: "reportes",
    label: "Reportes e Indicadores",
    to: "/admin/reportes",
    icon: BarChart3,
  },
  { modulo: "usuarios-roles", label: "Usuarios y Roles", to: "/admin/usuarios-roles", icon: Users },
]
