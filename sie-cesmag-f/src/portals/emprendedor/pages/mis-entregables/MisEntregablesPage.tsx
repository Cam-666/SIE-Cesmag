import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { format } from "date-fns"
import { AlertTriangle, FileCheck2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/shared/EmptyState"
import { useMisEntregablesQuery } from "@/domain/entregable/queries"
import { ESTADO_ENTREGABLE_EMPRENDEDOR_BADGE } from "@/domain/entregable/display"
import type { EstadoEntregableEmprendedor, MiEntregableListado } from "@/domain/entregable/types"
import { CargarEvidenciaDialog } from "@/portals/emprendedor/pages/mis-entregables/components/CargarEvidenciaDialog"

type Filtro = "todos" | EstadoEntregableEmprendedor | "entregado"

const FILTROS: { value: Filtro; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "pendiente", label: "Pendientes" },
  { value: "no_entregado", label: "No entregados" },
  { value: "entregado", label: "Entregados" },
  { value: "en_revision", label: "En revisión" },
  { value: "aprobado", label: "Aprobados" },
]

function coincideFiltro(entregable: MiEntregableListado, filtro: Filtro) {
  if (filtro === "todos") return true
  if (filtro === "entregado") return entregable.estadoActividad === "entregado"
  return entregable.estado === filtro
}

/** Consultar los entregables asignados y cargar la evidencia correspondiente. */
export function MisEntregablesPage() {
  const [filtro, setFiltro] = useState<Filtro>("todos")
  const [searchParams] = useSearchParams()
  const [idSeleccionado, setIdSeleccionado] = useState<number | null>(() => {
    const idEntregable = searchParams.get("idEntregable")
    return idEntregable ? Number(idEntregable) : null
  })
  const { data, isPending, isError } = useMisEntregablesQuery()

  const filtrados = data?.filter((e) => coincideFiltro(e, filtro))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-primary-900">Mis entregables</h1>
          <p className="text-sm text-muted-foreground">
            Consulte sus entregables asignados y cargue la evidencia correspondiente.
          </p>
        </div>
        <Select value={filtro} onValueChange={(v) => setFiltro(v as Filtro)}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTROS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entregable</TableHead>
              <TableHead>Fase</TableHead>
              <TableHead>Fecha límite</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isPending &&
              !isError &&
              filtrados?.map((entregable) => (
                <TableRow key={entregable.idEntregable}>
                  <TableCell className="font-medium text-foreground">{entregable.titulo}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{entregable.faseNombre}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(entregable.fechaPrevista), "d/MM/yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ESTADO_ENTREGABLE_EMPRENDEDOR_BADGE[entregable.estado].variant}>
                      {ESTADO_ENTREGABLE_EMPRENDEDOR_BADGE[entregable.estado].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIdSeleccionado(entregable.idEntregable)}
                    >
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {!isPending && !isError && filtrados?.length === 0 && (
          <div className="p-6">
            <EmptyState
              icon={FileCheck2}
              title="Sin entregables en este filtro"
              description="No hay entregables que coincidan con el filtro seleccionado."
            />
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

      <CargarEvidenciaDialog
        idEntregable={idSeleccionado}
        onOpenChange={(open) => !open && setIdSeleccionado(null)}
      />
    </div>
  )
}
