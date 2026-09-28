import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { AlertTriangle, CalendarClock, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { EmptyState } from "@/components/shared/EmptyState"
import { AsesoriaAccionesDialog } from "@/components/shared/AsesoriaAccionesDialog"
import { ConfirmarEliminarDialog } from "@/components/shared/ConfirmarEliminarDialog"
import { useAsesoriasQuery, useEliminarAsesoriaMutation } from "@/domain/asesoria/queries"
import {
  ESTADO_ASESORIA_BADGE,
  MODALIDAD_LABEL,
  requiereRegistrarResultado,
} from "@/domain/asesoria/display"
import type { AsesoriaListado, EstadoAsesoria } from "@/domain/asesoria/types"
import { NuevaAsesoriaDialog } from "@/portals/admin/pages/asesorias/components/NuevaAsesoriaDialog"
import { DisponibilidadForm } from "@/portals/admin/pages/asesorias/components/DisponibilidadForm"
import { usePermiso } from "@/hooks/usePermiso"

/** Listado, registro, disponibilidad y gestión de asesorías. */
export function AsesoriasPage() {
  const [estado, setEstado] = useState<EstadoAsesoria | "todos">("todos")
  const [seleccionada, setSeleccionada] = useState<AsesoriaListado | null>(null)

  const { data, isPending, isError } = useAsesoriasQuery({ estado })
  const eliminarAsesoria = useEliminarAsesoriaMutation()
  const puedeAnadir = usePermiso("asesorias", "anadir")
  const puedeEliminar = usePermiso("asesorias", "eliminar")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-primary-900">Asesorías</h1>
          <p className="text-sm text-muted-foreground">
            Registro de asesorías realizadas y su seguimiento por emprendimiento.
          </p>
        </div>
        {puedeAnadir && <NuevaAsesoriaDialog />}
      </div>

      <Tabs defaultValue="listado">
        <TabsList>
          <TabsTrigger value="listado">Listado</TabsTrigger>
          <TabsTrigger value="disponibilidad">Mi disponibilidad</TabsTrigger>
        </TabsList>

        <TabsContent value="listado" className="flex flex-col gap-4">
          <Select value={estado} onValueChange={(v) => setEstado(v as EstadoAsesoria | "todos")}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="programada">Programada</SelectItem>
              <SelectItem value="completada">Completada</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha y hora</TableHead>
                  <TableHead>Emprendimiento</TableHead>
                  <TableHead>Asesor</TableHead>
                  <TableHead>Modalidad</TableHead>
                  <TableHead>Estado</TableHead>
                  {puedeEliminar && <TableHead className="text-right">Acción</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: puedeEliminar ? 6 : 5 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}

                {!isPending &&
                  !isError &&
                  data?.map((asesoria) => (
                    <TableRow
                      key={asesoria.idAsesoria}
                      className="cursor-pointer"
                      onClick={() => setSeleccionada(asesoria)}
                    >
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(asesoria.fechaAsesoria), "d/MM h:mm a", { locale: es })}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {asesoria.emprendimiento}
                      </TableCell>
                      <TableCell className="text-sm text-foreground">{asesoria.asesor}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {MODALIDAD_LABEL[asesoria.modalidad]}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Badge variant={ESTADO_ASESORIA_BADGE[asesoria.estadoAsesoria].variant}>
                            {ESTADO_ASESORIA_BADGE[asesoria.estadoAsesoria].label}
                          </Badge>
                          {requiereRegistrarResultado(asesoria) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertTriangle className="size-3.5 shrink-0 text-destructive-700" />
                              </TooltipTrigger>
                              <TooltipContent>
                                Ya pasó la fecha — registre qué ocurrió en esta asesoría.
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                      {puedeEliminar && (
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          {asesoria.estadoAsesoria === "cancelada" && (
                            <ConfirmarEliminarDialog
                              titulo="Eliminar asesoría cancelada"
                              descripcion={`¿Confirma eliminar del registro esta asesoría cancelada de ${asesoria.emprendimiento}? Esta acción no se puede deshacer.`}
                              onConfirmar={() =>
                                eliminarAsesoria.mutate(asesoria.idAsesoria, {
                                  onSuccess: () => toast.success("Asesoría eliminada."),
                                  onError: () => toast.error("No se pudo eliminar la asesoría."),
                                })
                              }
                              trigger={
                                <button
                                  type="button"
                                  aria-label="Eliminar asesoría"
                                  className="rounded p-1.5 text-destructive-700 hover:bg-destructive-700/10"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              }
                            />
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>

            {!isPending && !isError && data?.length === 0 && (
              <div className="p-6">
                <EmptyState
                  icon={CalendarClock}
                  title="Sin asesorías registradas"
                  description="Las asesorías que registre aparecerán aquí."
                />
              </div>
            )}

            {isError && (
              <div className="p-6">
                <EmptyState
                  icon={AlertTriangle}
                  title="No se pudo cargar el listado de asesorías"
                  description="Intente nuevamente en unos momentos."
                />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="disponibilidad">
          <DisponibilidadForm />
        </TabsContent>
      </Tabs>

      <AsesoriaAccionesDialog
        asesoria={seleccionada}
        onOpenChange={(open) => !open && setSeleccionada(null)}
      />
    </div>
  )
}
