import { CalendarClock, FileCheck2, LayoutDashboard, Rocket, User, type LucideIcon } from "lucide-react"

export interface EmprendedorNavItem {
  label: string
  to: string
  icon: LucideIcon
}

/** Ítems del sidebar del portal del emprendedor, en el orden del wireframe. */
export const EMPRENDEDOR_NAV_ITEMS: EmprendedorNavItem[] = [
  { label: "Dashboard", to: "/emprendedor/dashboard", icon: LayoutDashboard },
  { label: "Mi emprendimiento", to: "/emprendedor/mi-emprendimiento", icon: Rocket },
  { label: "Mis entregables", to: "/emprendedor/mis-entregables", icon: FileCheck2 },
  { label: "Mis asesorías", to: "/emprendedor/mis-asesorias", icon: CalendarClock },
  { label: "Mi perfil", to: "/emprendedor/mi-perfil", icon: User },
]
