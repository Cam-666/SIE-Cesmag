import { useState } from "react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarClock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { CalendarioMensual } from "@/components/shared/CalendarioMensual"
import { AsesoriaAccionesDialog } from "@/components/shared/AsesoriaAccionesDialog"
import { ESTADO_ASESORIA_BADGE, MODALIDAD_LABEL } from "@/domain/asesoria/display"
import type { AsesoriaListado } from "@/domain/asesoria/types"

const TIPO_ASESORIA_LABEL: Record<AsesoriaListado["tipoAsesoria"], string> = {
  diagnostica: "Diagnóstica",
  seguimiento: "Seguimiento",
}

interface CalendarioAsesoriasProps {
  data: AsesoriaListado[] | undefined
  isPending: boolean
  /** Muestra el nombre del emprendimiento en cada tarjeta (útil en el portal admin, con varias ventures). */
  mostrarEmprendimiento?: boolean
}

/**
 * Calendario mensual de asesorías + detalle del día, compartido entre el
 * portal admin (todas las asesorías) y el del emprendedor (las suyas). Se
 * llega aquí desde una notificación de agendamiento/recordatorio, no desde
 * un módulo del sidebar.
 */
export function CalendarioAsesorias({ data, isPending, mostrarEmprendimiento }: CalendarioAsesoriasProps) {
  const [seleccionada, setSeleccionada] = useState<AsesoriaListado | null>(null)
  const [mesCalendario, setMesCalendario] = useState(new Date())
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null)

  const fechasConEvento = new Set(data?.map((a) => a.fechaAsesoria.slice(0, 10)))
  const asesoriasDelDia = data?.filter((a) => a.fechaAsesoria.startsWith(diaSeleccionado ?? "\0"))

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            {isPending ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <CalendarioMensual
                mes={mesCalendario}
                onCambiarMes={setMesCalendario}
                fechasConEvento={fechasConEvento}
                fechaSeleccionada={diaSeleccionado}
                onSeleccionarFecha={setDiaSeleccionado}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {diaSeleccionado
                ? format(parseISO(diaSeleccionado), "d 'de' MMMM", { locale: es })
                : "Seleccione un día"}
            </CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            {!diaSeleccionado && (
              <p className="text-sm text-muted-foreground">
                Haga clic en un día del calendario para ver sus asesorías.
              </p>
            )}
            {diaSeleccionado && asesoriasDelDia?.length === 0 && (
              <EmptyState icon={CalendarClock} title="Sin asesorías este día" />
            )}
            {asesoriasDelDia?.map((asesoria) => (
              <button
                key={asesoria.idAsesoria}
                onClick={() => setSeleccionada(asesoria)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {format(new Date(asesoria.fechaAsesoria), "h:mm a", { locale: es })} ·{" "}
                    {mostrarEmprendimiento ? asesoria.emprendimiento : asesoria.asesor}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {TIPO_ASESORIA_LABEL[asesoria.tipoAsesoria]} · {MODALIDAD_LABEL[asesoria.modalidad]}
                  </p>
                </div>
                <Badge variant={ESTADO_ASESORIA_BADGE[asesoria.estadoAsesoria].variant}>
                  {ESTADO_ASESORIA_BADGE[asesoria.estadoAsesoria].label}
                </Badge>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <AsesoriaAccionesDialog
        asesoria={seleccionada}
        onOpenChange={(open) => !open && setSeleccionada(null)}
      />
    </>
  )
}
