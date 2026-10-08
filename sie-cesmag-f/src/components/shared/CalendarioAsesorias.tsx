import { useState } from "react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarClock, CalendarDays, FileCheck2, LayoutGrid } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { CalendarioMensual } from "@/components/shared/CalendarioMensual"
import { CalendarioSemanal } from "@/components/shared/CalendarioSemanal"
import { AsesoriaAccionesDialog } from "@/components/shared/AsesoriaAccionesDialog"
import { ESTADO_ASESORIA_BADGE, MODALIDAD_LABEL } from "@/domain/asesoria/display"
import { ESTADO_ACTIVIDAD_BADGE } from "@/domain/entregable/display"
import type { AsesoriaListado } from "@/domain/asesoria/types"
import type { EstadoActividad } from "@/domain/entregable/types"
import type { Id } from "@/types/common"
import { fechaAsesoriaComoLocal } from "@/lib/fecha-asesoria"

const TIPO_ASESORIA_LABEL: Record<AsesoriaListado["tipoAsesoria"], string> = {
  diagnostica: "Diagnóstica",
  seguimiento: "Seguimiento",
}

type Vista = "semana" | "mes"

/** Forma mínima común entre `EntregableComoResponsable` (admin) y `MiEntregableListado` (emprendedor). */
interface EntregableCalendario {
  idEntregable: Id
  titulo: string
  fechaPrevista: string
  estadoActividad: EstadoActividad
  emprendimiento?: string
}

interface CalendarioAsesoriasProps {
  data: AsesoriaListado[] | undefined
  isPending: boolean
  /** Muestra el nombre del emprendimiento en cada tarjeta (útil en el portal admin, con varias ventures). */
  mostrarEmprendimiento?: boolean
  /** Viene de la notificación (?idAsesoria=N): al cargar, salta directo al día y abre esa asesoría. */
  idAsesoriaEnfocada?: number | null
  /** Entregables a mostrar junto a las asesorías (vista de mes) — "Mi calendario" no es solo de asesorías. */
  entregables?: EntregableCalendario[]
  /** A dónde llevar al tocar un entregable del día (cada portal decide su propia ruta). */
  onVerEntregable?: (idEntregable: Id) => void
}

/**
 * Calendario de asesorías, compartido entre el portal admin (todas) y el del
 * emprendedor (las suyas). Dos vistas: "Semana" (grilla de horas, el día a
 * día real — como un calendario de verdad) y "Mes" (vista de pájaro para
 * saltar a una fecha lejana). Se llega aquí desde una notificación de
 * agendamiento/recordatorio, no desde un módulo del sidebar.
 */
export function CalendarioAsesorias({
  data,
  isPending,
  mostrarEmprendimiento,
  idAsesoriaEnfocada,
  entregables,
  onVerEntregable,
}: CalendarioAsesoriasProps) {
  const [vista, setVista] = useState<Vista>("semana")
  const [seleccionada, setSeleccionada] = useState<AsesoriaListado | null>(null)
  const [semanaCalendario, setSemanaCalendario] = useState(new Date())
  const [mesCalendario, setMesCalendario] = useState(new Date())
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null)

  // Salta a la semana/día y abre la asesoría que vino de la notificación en
  // cuanto los datos cargan — ajuste durante el render (no un efecto)
  // siguiendo el patrón de React para sincronizar estado con una condición
  // que cambia una sola vez, así evita el doble render de un efecto.
  const [idAsesoriaAplicada, setIdAsesoriaAplicada] = useState<number | null>(null)
  if (idAsesoriaEnfocada && idAsesoriaEnfocada !== idAsesoriaAplicada && data) {
    const asesoria = data.find((a) => a.idAsesoria === idAsesoriaEnfocada)
    if (asesoria) {
      setIdAsesoriaAplicada(idAsesoriaEnfocada)
      setVista("semana")
      setSemanaCalendario(fechaAsesoriaComoLocal(asesoria.fechaAsesoria))
      setMesCalendario(fechaAsesoriaComoLocal(asesoria.fechaAsesoria))
      setDiaSeleccionado(asesoria.fechaAsesoria.slice(0, 10))
      setSeleccionada(asesoria)
    }
  }

  const fechasConEvento = new Set([
    ...(data?.map((a) => a.fechaAsesoria.slice(0, 10)) ?? []),
    ...(entregables?.map((e) => e.fechaPrevista) ?? []),
  ])
  const asesoriasDelDia = data?.filter((a) => a.fechaAsesoria.startsWith(diaSeleccionado ?? "\0"))
  const entregablesDelDia = entregables?.filter((e) => e.fechaPrevista === diaSeleccionado)

  return (
    <>
      <div className="mb-3 flex justify-end gap-1 rounded-lg bg-muted p-1 w-fit">
        <Button
          type="button"
          size="sm"
          variant={vista === "semana" ? "default" : "ghost"}
          onClick={() => setVista("semana")}
        >
          <CalendarDays className="size-4" />
          Semana
        </Button>
        <Button
          type="button"
          size="sm"
          variant={vista === "mes" ? "default" : "ghost"}
          onClick={() => setVista("mes")}
        >
          <LayoutGrid className="size-4" />
          Mes
        </Button>
      </div>

      {vista === "semana" && (
        <Card>
          <CardContent className="pt-6">
            {isPending ? (
              <Skeleton className="h-96 w-full" />
            ) : (
              <CalendarioSemanal
                semana={semanaCalendario}
                onCambiarSemana={setSemanaCalendario}
                data={data ?? []}
                mostrarEmprendimiento={mostrarEmprendimiento}
                onSeleccionar={setSeleccionada}
              />
            )}
          </CardContent>
        </Card>
      )}

      {vista === "mes" && (
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
                  Haga clic en un día del calendario para ver sus asesorías y entregables.
                </p>
              )}
              {diaSeleccionado && asesoriasDelDia?.length === 0 && entregablesDelDia?.length === 0 && (
                <EmptyState icon={CalendarClock} title="Sin actividad este día" />
              )}
              {entregablesDelDia?.map((entregable) => (
                <button
                  key={entregable.idEntregable}
                  onClick={() => onVerEntregable?.(entregable.idEntregable)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <div className="min-w-0 flex items-start gap-2">
                    <FileCheck2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{entregable.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        Entregable{entregable.emprendimiento ? ` · ${entregable.emprendimiento}` : ""}
                      </p>
                    </div>
                  </div>
                  <Badge variant={ESTADO_ACTIVIDAD_BADGE[entregable.estadoActividad].variant}>
                    {ESTADO_ACTIVIDAD_BADGE[entregable.estadoActividad].label}
                  </Badge>
                </button>
              ))}
              {asesoriasDelDia?.map((asesoria) => (
                <button
                  key={asesoria.idAsesoria}
                  onClick={() => setSeleccionada(asesoria)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {format(fechaAsesoriaComoLocal(asesoria.fechaAsesoria), "h:mm a", { locale: es })} ·{" "}
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
      )}

      <AsesoriaAccionesDialog
        asesoria={seleccionada}
        onOpenChange={(open) => !open && setSeleccionada(null)}
      />
    </>
  )
}
