import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { AlertTriangle, ArrowLeft, CalendarClock, Trash2 } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { EmptyState } from "@/components/shared/EmptyState"
import { RutaMetodologica } from "@/components/shared/RutaMetodologica"
import { ConfirmarEliminarDialog } from "@/components/shared/ConfirmarEliminarDialog"
import { CaracterizacionInfo } from "@/components/shared/CaracterizacionInfo"
import { useEmprendimientoQuery, useEliminarIntegranteMutation } from "@/domain/emprendimiento/queries"
import { codigoEmprendimiento, ESTADO_EMPRENDIMIENTO_BADGE } from "@/domain/emprendimiento/display"
import { useAsesoriasPorEmprendimientoQuery } from "@/domain/asesoria/queries"
import { ESTADO_ASESORIA_BADGE } from "@/domain/asesoria/display"
import type { AsesoriaHistorialItem } from "@/domain/asesoria/types"
import { AgregarIntegranteDialog } from "@/portals/admin/pages/emprendimientos/components/AgregarIntegranteDialog"
import { EditarIntegranteDialog } from "@/portals/admin/pages/emprendimientos/components/EditarIntegranteDialog"
import { GestionEstadoDialog } from "@/portals/admin/pages/emprendimientos/components/GestionEstadoDialog"
import { AsesoriaDetalleDialog } from "@/portals/admin/pages/emprendimientos/components/AsesoriaDetalleDialog"
import { EditarCaracterizacionDialog } from "@/portals/admin/pages/emprendimientos/components/EditarCaracterizacionDialog"
import { FaseEntregablesDialog } from "@/portals/admin/pages/emprendimientos/components/FaseEntregablesDialog"
import { DiagnosticoInicialDialog } from "@/portals/admin/pages/emprendimientos/components/DiagnosticoInicialDialog"
import type { EtapaRuta, FaseRuta } from "@/domain/ruta/types"
import { usePermiso } from "@/hooks/usePermiso"
import { fechaAsesoriaComoLocal } from "@/lib/fecha-asesoria"

/** Situación actual e historial completo de un emprendimiento. */
export function EmprendimientoDetallePage() {
  const { id } = useParams()
  const idEmprendimiento = Number(id)
  const [asesoriaSeleccionada, setAsesoriaSeleccionada] = useState<AsesoriaHistorialItem | null>(null)
  const [faseSeleccionada, setFaseSeleccionada] = useState<{ etapa: EtapaRuta; fase: FaseRuta } | null>(
    null,
  )

  const { data, isPending, isError } = useEmprendimientoQuery(idEmprendimiento)
  const historial = useAsesoriasPorEmprendimientoQuery(idEmprendimiento)
  const eliminarIntegrante = useEliminarIntegranteMutation(idEmprendimiento)
  const puedeAnadir = usePermiso("emprendimientos", "anadir")
  const puedeEditar = usePermiso("emprendimientos", "editar")
  const puedeEliminar = usePermiso("emprendimientos", "eliminar")

  if (isPending) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No se pudo cargar el emprendimiento"
        description="Verifique el enlace o intente nuevamente desde el listado."
        action={
          <Link to="/admin/emprendimientos" className="text-sm font-medium text-primary-700 hover:underline">
            Volver a Emprendimientos
          </Link>
        }
      />
    )
  }

  const faseActualNombre = data.faseActual?.fase
    ? `${data.faseActual.fase.numero}. ${data.faseActual.fase.nombre}`
    : "—"
  const etapaActualNombre = data.ruta.find((e) =>
    e.fases.some((f) => f.estadoFase === "en_curso" || f.estadoFase === "pausada"),
  )?.nombre

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/admin/emprendimientos"
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-primary-700 hover:underline"
      >
        <ArrowLeft className="size-4" />
        Volver a Emprendimientos
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-primary-900">{data.nombreReferencia}</h1>
            <Badge variant={ESTADO_EMPRENDIMIENTO_BADGE[data.estado].variant}>
              {ESTADO_EMPRENDIMIENTO_BADGE[data.estado].label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {codigoEmprendimiento(data.idEmprendimiento)}
            {data.diagnosticoPendiente ? (
              " · Sin diagnóstico inicial registrado"
            ) : (
              <>
                {etapaActualNombre && ` · Etapa: ${etapaActualNombre}`} · Fase: {faseActualNombre}
              </>
            )}
          </p>
        </div>
      </div>

      <Tabs defaultValue="resumen">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="historico">Histórico de asesorías</TabsTrigger>
          <TabsTrigger value="adicional">Información adicional</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="flex flex-col gap-4">
          {data.diagnosticoPendiente ? (
            <Card>
              <CardHeader>
                <CardTitle>Registrar diagnóstico inicial</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Este emprendimiento fue aprobado desde un precandidato y todavía no tiene etapa
                  asignada. Registre el diagnóstico de la primera asesoría para definir en qué
                  etapa de la ruta continúa.
                </p>
              </CardHeader>
              <CardContent>
                {puedeEditar ? (
                  <DiagnosticoInicialDialog idEmprendimiento={data.idEmprendimiento} />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No tiene permiso para registrar el diagnóstico inicial.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Ubicación actual en la ruta</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {data.fasesCompletadas} de {data.totalFases} fases completadas
                    </span>
                    <span className="font-medium text-primary-900">
                      {Math.round((data.fasesCompletadas / data.totalFases) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary-600"
                      style={{ width: `${(data.fasesCompletadas / data.totalFases) * 100}%` }}
                    />
                  </div>
                  {data.faseActual?.fase?.entregablesRequeridos && (
                    <p className="mt-3 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Entregable requerido de la fase actual:
                      </span>{" "}
                      {data.faseActual.fase.entregablesRequeridos}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ruta metodológica del emprendimiento</CardTitle>
                </CardHeader>
                <CardContent>
                  <RutaMetodologica
                    ruta={data.ruta}
                    onFaseClick={(etapa, fase) => setFaseSeleccionada({ etapa, fase })}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Haga clic en una fase en curso o completada para ver sus entregables.
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Equipo emprendedor</CardTitle>
                {puedeAnadir && <AgregarIntegranteDialog idEmprendimiento={data.idEmprendimiento} />}
              </CardHeader>
              <CardContent className="gap-2">
                {data.integrantes && data.integrantes.length > 0 ? (
                  data.integrantes.map((integrante) => (
                    <div
                      key={integrante.idUsuario}
                      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-700/10 text-xs font-semibold text-primary-700">
                        {integrante.emprendedor?.nombre?.[0] ?? "?"}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {integrante.emprendedor?.nombre}
                      </span>
                      {puedeEditar && (
                        <EditarIntegranteDialog
                          idEmprendimiento={data.idEmprendimiento}
                          idUsuario={integrante.idUsuario}
                          nombreActual={integrante.emprendedor?.nombre ?? ""}
                        />
                      )}
                      {puedeEliminar && (
                        <ConfirmarEliminarDialog
                          titulo="Quitar integrante"
                          descripcion={`¿Confirma quitar a ${integrante.emprendedor?.nombre} de este emprendimiento?`}
                          textoConfirmar="Quitar"
                          onConfirmar={() =>
                            eliminarIntegrante.mutate(integrante.idUsuario, {
                              onSuccess: () => toast.success("Integrante quitado del emprendimiento."),
                              onError: () => toast.error("No se pudo quitar el integrante."),
                            })
                          }
                          trigger={
                            <button
                              type="button"
                              aria-label="Quitar integrante"
                              className="rounded p-1 text-destructive-700 hover:bg-destructive-700/10"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          }
                        />
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Sin integrantes registrados.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gestión de estado</CardTitle>
                {puedeEditar && (
                  <GestionEstadoDialog idEmprendimiento={data.idEmprendimiento} estadoActual={data.estado} />
                )}
              </CardHeader>
              <CardContent className="gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado</span>
                  <Badge variant={ESTADO_EMPRENDIMIENTO_BADGE[data.estado].variant}>
                    {ESTADO_EMPRENDIMIENTO_BADGE[data.estado].label}
                  </Badge>
                </div>
                {data.motivo && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Motivo</span>
                    <span className="text-right text-foreground">{data.motivo}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Última actividad</span>
                  <span className="text-foreground">
                    {format(new Date(data.ultimaActividad), "d/MM/yyyy")}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Historial del emprendimiento</CardTitle>
              <p className="text-sm text-muted-foreground">
                Traza los cambios de estado y etapa a lo largo del acompañamiento.
              </p>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-3">
                {[
                  { fecha: data.fechaIngreso, label: "Ingreso al proceso" },
                  data.fechaReingreso && { fecha: data.fechaReingreso, label: "Reingreso al proceso" },
                  data.fechaInactividad && {
                    fecha: data.fechaInactividad,
                    label: `Marcado como inactivo${data.motivo ? ` — ${data.motivo}` : ""}`,
                  },
                  data.fechaDesistimiento && {
                    fecha: data.fechaDesistimiento,
                    label: "Desistimiento registrado",
                  },
                  data.fechaCulminacion && {
                    fecha: data.fechaCulminacion,
                    label: "Culminó la ruta de acompañamiento",
                  },
                ]
                  .filter((evento): evento is { fecha: string; label: string } => !!evento)
                  .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
                  .map((evento, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="mt-1 size-2 shrink-0 rounded-full bg-primary-600" />
                      <div>
                        <p className="text-foreground">{evento.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(evento.fecha), "d 'de' MMMM 'de' yyyy", { locale: es })}
                        </p>
                      </div>
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Asesor</TableHead>
                    <TableHead>Fase</TableHead>
                    <TableHead>Tema</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historial.isPending &&
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 5 }).map((__, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}

                  {historial.data?.map((asesoria) => (
                    <TableRow
                      key={asesoria.idAsesoria}
                      className="cursor-pointer"
                      onClick={() => setAsesoriaSeleccionada(asesoria)}
                    >
                      <TableCell className="text-sm text-muted-foreground">
                        {format(fechaAsesoriaComoLocal(asesoria.fechaAsesoria), "d/MM h:mm a", { locale: es })}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{asesoria.asesor}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {asesoria.faseNombre}
                      </TableCell>
                      <TableCell className="text-sm text-foreground">{asesoria.titulo}</TableCell>
                      <TableCell>
                        <Badge variant={ESTADO_ASESORIA_BADGE[asesoria.estadoAsesoria].variant}>
                          {ESTADO_ASESORIA_BADGE[asesoria.estadoAsesoria].label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {!historial.isPending && historial.data?.length === 0 && (
                <div className="p-6">
                  <EmptyState icon={CalendarClock} title="Sin asesorías registradas todavía" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adicional">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Información adicional</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Caracterización capturada en el formulario de acceso.
                </p>
              </div>
              {puedeEditar && (
                <EditarCaracterizacionDialog
                  idEmprendimiento={data.idEmprendimiento}
                  valoresActuales={data.caracterizacion}
                />
              )}
            </CardHeader>
            <CardContent>
              <CaracterizacionInfo datos={data.caracterizacion} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AsesoriaDetalleDialog
        asesoria={asesoriaSeleccionada}
        onOpenChange={(open) => !open && setAsesoriaSeleccionada(null)}
        nombreEmprendimiento={data.nombreReferencia}
      />

      <FaseEntregablesDialog
        idEmprendimiento={data.idEmprendimiento}
        seleccion={faseSeleccionada}
        numeroEtapaIngreso={data.ruta.find((e) => e.idEtapa === data.idEtapaIngreso)?.numero}
        onOpenChange={(open) => !open && setFaseSeleccionada(null)}
      />
    </div>
  )
}
