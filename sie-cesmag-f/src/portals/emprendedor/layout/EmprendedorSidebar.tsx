import { LifeBuoy } from "lucide-react"
import { NavLink } from "react-router-dom"
import { toast } from "sonner"
import escudoCesmag from "@/assets/escudo-cesmag.png"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { EMPRENDEDOR_NAV_ITEMS } from "@/portals/emprendedor/layout/nav-items"

interface EmprendedorSidebarProps {
  mobileOpen: boolean
  onMobileOpenChange: (open: boolean) => void
}

function irASoporte() {
  toast.info("Escríbanos a soporte@unicesmag.edu.co")
}

/**
 * Sidebar del portal del emprendedor (shell propio, sin compartir con el
 * admin). En escritorio (md+) es un riel angosto de solo íconos que se
 * expande al pasar el cursor, sin mover el contenido de fondo (permanece
 * fijo). En móvil se abre como panel deslizante desde el topbar.
 */
export function EmprendedorSidebar({ mobileOpen, onMobileOpenChange }: EmprendedorSidebarProps) {
  return (
    <>
      <aside className="group hidden w-18 shrink-0 flex-col overflow-hidden bg-primary-900 text-white transition-[width] duration-200 ease-in-out hover:w-64 md:flex">
        <div className="flex items-center gap-2.5 px-4.5 py-5">
          <img src={escudoCesmag} alt="Escudo Universidad CESMAG" className="h-9 w-9 shrink-0" />
          <div className="min-w-0 leading-tight opacity-0 transition-opacity delay-75 duration-150 group-hover:opacity-100">
            <p className="text-base font-bold tracking-wide whitespace-nowrap">SIE Cesmag</p>
            <p className="text-[11px] whitespace-nowrap text-white/50">Mi proceso de emprendimiento</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          {EMPRENDEDOR_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={item.label}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-destructive-700 text-white"
                    : "text-white/75 hover:bg-primary-800 hover:text-white"
                }`
              }
            >
              <item.icon className="size-4.5 shrink-0" />
              <span className="min-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-opacity delay-75 duration-150 group-hover:opacity-100">
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={irASoporte}
          className="flex items-center gap-2 px-4.5 py-4 text-left text-xs text-white/60 hover:text-white"
        >
          <LifeBuoy className="size-4 shrink-0" />
          <span className="min-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-opacity delay-75 duration-150 group-hover:opacity-100">
            Soporte
            <br />
            <span className="text-white/40">Contacte a soporte</span>
          </span>
        </button>
      </aside>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="w-72 gap-0 border-none bg-primary-900 p-0 text-white">
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          <div className="flex items-center gap-2.5 px-5 py-5">
            <img src={escudoCesmag} alt="Escudo Universidad CESMAG" className="h-9 w-9 shrink-0" />
            <div className="leading-tight">
              <p className="text-base font-bold tracking-wide">SIE Cesmag</p>
              <p className="text-[11px] text-white/50">Mi proceso de emprendimiento</p>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
            {EMPRENDEDOR_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onMobileOpenChange(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-destructive-700 text-white"
                      : "text-white/75 hover:bg-primary-800 hover:text-white"
                  }`
                }
              >
                <item.icon className="size-4.5 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            onClick={irASoporte}
            className="flex items-center gap-2 px-5 py-4 text-left text-xs text-white/60 hover:text-white"
          >
            <LifeBuoy className="size-4" />
            <span>
              Soporte
              <br />
              <span className="text-white/40">Contacte a soporte</span>
            </span>
          </button>
        </SheetContent>
      </Sheet>
    </>
  )
}
