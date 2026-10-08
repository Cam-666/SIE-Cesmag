import { ChevronDown, LogOut, Menu, User as UserIcon } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { NotificacionesPopover } from "@/components/shared/NotificacionesPopover"
import { ADMIN_NAV_ITEMS } from "@/portals/admin/layout/nav-items"
import { useAuthStore } from "@/stores/auth-store"

/** Rutas fuera del sidebar (no son "módulos" con permisos propios): título del topbar. */
const TITULOS_RUTAS_SIN_MODULO: Record<string, string> = {
  "/admin/mi-perfil": "Mi perfil",
  "/admin/calendario": "Mi calendario",
}

function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("")
}

export function AdminTopbar({ onAbrirMenuMovil }: { onAbrirMenuMovil: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const sesion = useAuthStore((state) => state.sesion)
  const cerrarSesion = useAuthStore((state) => state.cerrarSesion)

  const itemActual = ADMIN_NAV_ITEMS.find((item) => location.pathname.startsWith(item.to))
  const tituloSinModulo = TITULOS_RUTAS_SIN_MODULO[location.pathname]
  const titulo = itemActual?.label ?? tituloSinModulo ?? "Dashboard"

  const onCerrarSesion = () => {
    cerrarSesion()
    navigate("/login", { replace: true })
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-4 sm:px-6 print:hidden">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Abrir menú"
          className="md:hidden"
          onClick={onAbrirMenuMovil}
        >
          <Menu className="size-5" />
        </Button>
        <div>
          <p className="text-xs text-muted-foreground">
            Inicio <span> / {titulo}</span>
          </p>
          <h2 className="text-base font-semibold text-primary-900">{titulo}</h2>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <NotificacionesPopover />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary-700 text-xs font-semibold text-white">
                  {sesion ? iniciales(sesion.nombre) : "?"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-medium leading-tight text-foreground">
                  {sesion?.nombre}
                </span>
                <Badge variant="secondary" className="mt-0.5">
                  {sesion?.rolNombre}
                </Badge>
              </span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{sesion?.nombre}</p>
              <p className="text-xs text-muted-foreground">{sesion?.correo}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate("/admin/mi-perfil")}>
              <UserIcon className="size-4" />
              Mi perfil
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={onCerrarSesion}
            >
              <LogOut className="size-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
