import { useEffect, useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { AlertTriangle, Rocket, Search, UserPlus } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
import { EmptyState } from "@/components/shared/EmptyState"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useEmprendimientosQuery } from "@/domain/emprendimiento/queries"
import {
  codigoEmprendimiento,
  ESTADO_EMPRENDIMIENTO_BADGE,
  estaSinActividadReciente,
  UMBRAL_DIAS_SIN_ACTIVIDAD,
} from "@/domain/emprendimiento/display"
import type { EstadoEmprendimiento } from "@/domain/emprendimiento/types"
import { usePrecandidatosQuery } from "@/domain/formulario/queries"
import type { PrecandidatoListado } from "@/domain/formulario/types"
import { PrecandidatoDecisionDialog } from "@/portals/admin/pages/emprendimientos/components/PrecandidatoDecisionDialog"
import { NuevoEmprendimientoDialog } from "@/portals/admin/pages/emprendimientos/components/NuevoEmprendimientoDialog"
import { usePermiso } from "@/hooks/usePermiso"

/** Consulta de la información de los emprendimientos registrados. */
export function EmprendimientosPage() {
  const navigate = useNavigate()
  const [busquedaInput, setBusquedaInput] = useState("")
  const [busqueda, setBusqueda] = useState("")
  const [estado, setEstado] = useState<EstadoEmprendimiento | "todos">("todos")
  const [precandidatoSeleccionado, setPrecandidatoSeleccionado] = useState<PrecandidatoListado | null>(
    null,
  )

  // Pequeño debounce para no disparar una consulta por cada tecla.
  useEffect(() => {
    const id = setTimeout(() => setBusqueda(busquedaInput), 300)
    return () => clearTimeout(id)
  }, [busquedaInput])

  const { data, isPending, isError, refetch } = useEmprendimientosQuery({ busqueda, estado })
  const precandidatos = usePrecandidatosQuery()
  const puedeCrear = usePermiso("emprendimientos", "anadir")

  const hayFiltrosActivos = busqueda !== "" || estado !== "todos"

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-primary-900">Emprendimientos</h1>
          <p className="text-sm text-muted-foreground">
            Consulte la información, la ruta y el estado de cada emprendimiento registrado.
          </p>
        </div>
        {puedeCrear && <NuevoEmprendimientoDialog />}
      </div>

      <Tabs defaultValue="emprendimientos">
        <TabsList>
          <TabsTrigger value="emprendimientos">Emprendimientos</TabsTrigger>
          <TabsTrigger value="precandidatos">
            Precandidatos
            {!!precandidatos.data?.length && (
              <Badge variant="destructive" className="ml-1">
                {precandidatos.data.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="emprendimientos" className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative sm:max-w-xs sm:flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre..."
                className="pl-8"
                value={busquedaInput}
                onChange={(e) => setBusquedaInput(e.target.value)}
              />
            </div>
            <Select value={estado} onValueChange={(v) => setEstado(v as EstadoEmprendimiento | "todos")}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
                <SelectItem value="terminado">Terminado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Emprendimiento</TableHead>
                  <TableHead>Etapa / Fase</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Última actividad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}

                {!isPending && !isError && data && data.length > 0 &&
                  data.map((emprendimiento) => (
                    <TableRow
                      key={emprendimiento.idEmprendimiento}
                      className="cursor-pointer"
                      onClick={() => navigate(`/admin/emprendimientos/${emprendimiento.idEmprendimiento}`)}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {codigoEmprendimiento(emprendimiento.idEmprendimiento)}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {emprendimiento.nombreReferencia}
                      </TableCell>
                      <TableCell>
                        {emprendimiento.diagnosticoPendiente ? (
                          <Badge variant="destructive">Diagnóstico pendiente</Badge>
                        ) : (
                          <>
                            <p className="text-sm text-foreground">{emprendimiento.etapaNombre}</p>
                            <p className="text-xs text-muted-foreground">{emprendimiento.faseNombre}</p>
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={ESTADO_EMPRENDIMIENTO_BADGE[emprendimiento.estado].variant}>
                          {ESTADO_EMPRENDIMIENTO_BADGE[emprendimiento.estado].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {estaSinActividadReciente(
                          emprendimiento.estado,
                          emprendimiento.ultimaActividad,
                        ) ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-1.5 text-destructive-700">
                                <AlertTriangle className="size-3.5 shrink-0" />
                                {formatDistanceToNow(new Date(emprendimiento.ultimaActividad), {
                                  addSuffix: true,
                                  locale: es,
                                })}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              Sin actividad hace más de {UMBRAL_DIAS_SIN_ACTIVIDAD} días — requiere
                              seguimiento.
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          formatDistanceToNow(new Date(emprendimiento.ultimaActividad), {
                            addSuffix: true,
                            locale: es,
                          })
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>

            {!isPending && !isError && data?.length === 0 && (
              <div className="p-6">
                <EmptyState
                  icon={Rocket}
                  title={hayFiltrosActivos ? "Sin resultados" : "Aún no hay emprendimientos registrados"}
                  description={
                    hayFiltrosActivos
                      ? "Ningún emprendimiento coincide con la búsqueda o el filtro aplicado."
                      : "Los que se creen aquí o se aprueben desde los precandidatos aparecerán en esta lista."
                  }
                />
              </div>
            )}

            {isError && (
              <div className="p-6">
                <EmptyState
                  icon={AlertTriangle}
                  title="No se pudo cargar el listado"
                  description="Ocurrió un problema al consultar los emprendimientos. Intente nuevamente."
                  action={
                    <button
                      onClick={() => refetch()}
                      className="text-sm font-medium text-primary-700 hover:underline"
                    >
                      Reintentar
                    </button>
                  }
                />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="precandidatos">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Emprendimiento propuesto</TableHead>
                  <TableHead>Fecha de respuesta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {precandidatos.isPending &&
                  Array.from({ length: 2 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 4 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}

                {!precandidatos.isPending &&
                  precandidatos.data?.map((p) => (
                    <TableRow
                      key={p.idFormulario}
                      className="cursor-pointer"
                      onClick={() => setPrecandidatoSeleccionado(p)}
                    >
                      <TableCell className="font-medium text-foreground">{p.nombre}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.correo}</TableCell>
                      <TableCell className="text-sm text-foreground">
                        {p.nombreEmprendimientoPropuesto ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(p.fechaRespuesta), "d/MM/yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>

            {!precandidatos.isPending && precandidatos.data?.length === 0 && (
              <div className="p-6">
                <EmptyState
                  icon={UserPlus}
                  title="Sin precandidatos pendientes"
                  description="Los interesados que respondan la encuesta de caracterización aparecerán aquí para su revisión."
                />
              </div>
            )}

            {precandidatos.isError && (
              <div className="p-6">
                <EmptyState
                  icon={AlertTriangle}
                  title="No se pudo cargar el listado de precandidatos"
                />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <PrecandidatoDecisionDialog
        precandidato={precandidatoSeleccionado}
        onOpenChange={(open) => !open && setPrecandidatoSeleccionado(null)}
      />
    </div>
  )
}
