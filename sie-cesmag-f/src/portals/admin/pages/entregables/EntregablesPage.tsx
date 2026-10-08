import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { AlertTriangle, CheckCircle2, Clock, FileCheck2, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatCard } from "@/components/shared/StatCard"
import { EntregableRevisionDialog } from "@/components/shared/EntregableRevisionDialog"
import { useEntregablesQuery } from "@/domain/entregable/queries"
import { ESTADO_APROBACION_ENTREGABLE_BADGE, estadoAprobacionDe } from "@/domain/entregable/display"
import type { EstadoRevision } from "@/domain/entregable/types"
import { NuevoEntregableDialog } from "@/portals/admin/pages/entregables/components/NuevoEntregableDialog"
import { usePermiso } from "@/hooks/usePermiso"

/** Listado, registro y revisión de entregables. */
export function EntregablesPage() {
  const [estado, setEstado] = useState<EstadoRevision | "todos">("todos")
  const [searchParams] = useSearchParams()
  const [idSeleccionado, setIdSeleccionado] = useState<number | null>(() => {
    const idEntregable = searchParams.get("idEntregable")
    return idEntregable ? Number(idEntregable) : null
  })

  const { data, isPending, isError } = useEntregablesQuery({ estado })
  const puedeAnadir = usePermiso("entregables", "anadir")

  const total = data?.length ?? 0
  const aprobados = data?.filter((e) => e.estadoRevision === "aprobado").length ?? 0
  const pendientes = data?.filter((e) => e.estadoRevision === "pendiente").length ?? 0
  const rechazados = data?.filter((e) => e.estadoRevision === "rechazado").length ?? 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-primary-900">Entregables</h1>
          <p className="text-sm text-muted-foreground">
            Revise los entregables cargados por los emprendedores y su historial de intentos.
          </p>
        </div>
        {puedeAnadir && <NuevoEntregableDialog />}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total entregables" value={total} icon={FileCheck2} loading={isPending} accent="primary" />
        <StatCard label="Aprobados" value={aprobados} icon={CheckCircle2} loading={isPending} accent="primary" />
        <StatCard label="Pendientes" value={pendientes} icon={Clock} loading={isPending} accent="destructive" />
        <StatCard label="Rechazados" value={rechazados} icon={XCircle} loading={isPending} accent="destructive" />
      </div>

      <Select value={estado} onValueChange={(v) => setEstado(v as EstadoRevision | "todos")}>
        <SelectTrigger className="w-full sm:w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos los estados</SelectItem>
          <SelectItem value="pendiente">Pendiente de revisión</SelectItem>
          <SelectItem value="aprobado">Aprobado</SelectItem>
          <SelectItem value="rechazado">Rechazado</SelectItem>
        </SelectContent>
      </Select>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entregable</TableHead>
              <TableHead>Emprendimiento</TableHead>
              <TableHead>Fase</TableHead>
              <TableHead>Estado de aprobación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isPending &&
              !isError &&
              data?.map((entregable) => (
                <TableRow
                  key={entregable.idEntregable}
                  className="cursor-pointer"
                  onClick={() => setIdSeleccionado(entregable.idEntregable)}
                >
                  <TableCell className="font-medium text-foreground">{entregable.titulo}</TableCell>
                  <TableCell className="text-sm text-foreground">{entregable.emprendimiento}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{entregable.faseNombre}</TableCell>
                  <TableCell>
                    {(() => {
                      const estadoCombinado = estadoAprobacionDe(entregable.estadoRevision)
                      return (
                        <Badge variant={ESTADO_APROBACION_ENTREGABLE_BADGE[estadoCombinado].variant}>
                          {ESTADO_APROBACION_ENTREGABLE_BADGE[estadoCombinado].label}
                        </Badge>
                      )
                    })()}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {!isPending && !isError && data?.length === 0 && (
          <div className="p-6">
            <EmptyState icon={FileCheck2} title="Sin entregables registrados" />
          </div>
        )}

        {isError && (
          <div className="p-6">
            <EmptyState
              icon={AlertTriangle}
              title="No se pudo cargar el listado de entregables"
              description="Intente nuevamente en unos momentos."
            />
          </div>
        )}
      </div>

      <EntregableRevisionDialog
        idEntregable={idSeleccionado}
        onOpenChange={(open) => !open && setIdSeleccionado(null)}
      />
    </div>
  )
}
