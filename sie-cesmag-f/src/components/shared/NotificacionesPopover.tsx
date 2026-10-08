import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Bell } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import {
  useMarcarLeidaMutation,
  useMarcarTodasLeidasMutation,
  useNotificacionesQuery,
} from "@/domain/notificacion/queries"
import { NOTIFICACION_ICONO } from "@/domain/notificacion/display"
import type { Notificacion } from "@/domain/notificacion/types"
import { useAuthStore } from "@/stores/auth-store"

/** Tipos de notificación ligados a una asesoría: al hacer clic, llevan al calendario. */
const TIPOS_CON_CALENDARIO = new Set(["agendamiento_asesoria", "recordatorio_asesoria"])

/** Tipos de notificación ligados a un entregable: al hacer clic, llevan a su ficha. */
const TIPOS_CON_ENTREGABLE = new Set(["recordatorio_entregable", "resultado_revision", "entrega_recibida"])

/**
 * Centro de notificaciones, compartido entre el portal admin y el portal
 * del emprendedor. Las notificaciones de asesoría llevan al calendario en
 * vez de abrir un módulo propio (el calendario no vive en el sidebar, solo
 * se llega desde aquí).
 */
export function NotificacionesPopover() {
  const [open, setOpen] = useState(false)
  const { data, isPending } = useNotificacionesQuery()
  const marcarLeida = useMarcarLeidaMutation()
  const marcarTodas = useMarcarTodasLeidasMutation()
  const ambito = useAuthStore((state) => state.sesion?.ambito)
  const navigate = useNavigate()

  const noLeidas = data?.filter((n) => !n.leido).length ?? 0

  const alHacerClic = (notificacion: Notificacion) => {
    if (!notificacion.leido) {
      marcarLeida.mutate(notificacion.idNotificacion, {
        onError: () => toast.error("No se pudo marcar como leída. Intente de nuevo."),
      })
    }

    if (TIPOS_CON_CALENDARIO.has(notificacion.tipo)) {
      setOpen(false)
      const base = ambito === "emprendedor" ? "/emprendedor/calendario" : "/admin/calendario"
      navigate(notificacion.idAsesoria != null ? `${base}?idAsesoria=${notificacion.idAsesoria}` : base)
      return
    }

    if (TIPOS_CON_ENTREGABLE.has(notificacion.tipo)) {
      setOpen(false)
      const base = ambito === "emprendedor" ? "/emprendedor/mis-entregables" : "/admin/entregables"
      navigate(notificacion.idEntregable != null ? `${base}?idEntregable=${notificacion.idEntregable}` : base)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notificaciones" className="relative">
          <Bell className="size-5" />
          {noLeidas > 0 && (
            <span className="absolute top-1.5 right-1.5 flex size-2 rounded-full bg-destructive-600" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-sm font-semibold text-primary-900">Notificaciones</p>
          {noLeidas > 0 && (
            <button
              type="button"
              onClick={() =>
                marcarTodas.mutate(undefined, {
                  onError: () => toast.error("No se pudo marcar todas como leídas. Intente de nuevo."),
                })
              }
              className="text-xs font-medium text-primary-700 hover:underline"
            >
              Marcar todas como leídas
            </button>
          )}
        </div>

        {isPending && (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        )}

        {!isPending && data?.length === 0 && (
          <EmptyState
            icon={Bell}
            title="Sin notificaciones nuevas"
            description="Aquí verá recordatorios de asesorías y entregables próximos."
          />
        )}

        {!isPending && data && data.length > 0 && (
          <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto">
            {data.map((notificacion) => {
              const Icono = NOTIFICACION_ICONO[notificacion.tipo]
              return (
                <li key={notificacion.idNotificacion}>
                  <button
                    type="button"
                    onClick={() => alHacerClic(notificacion)}
                    className={`flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left text-sm hover:bg-muted ${
                      notificacion.leido ? "" : "bg-primary-700/5"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${
                        notificacion.leido
                          ? "bg-muted text-muted-foreground"
                          : "bg-destructive-600/10 text-destructive-600"
                      }`}
                    >
                      <Icono className="size-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block ${notificacion.leido ? "text-foreground" : "font-medium text-foreground"}`}
                      >
                        {notificacion.mensaje}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notificacion.fechaCreacion), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    </span>
                    {!notificacion.leido && (
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-destructive-600" />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
