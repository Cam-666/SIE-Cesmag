import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { AlertTriangle, CalendarClock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { AsesoriaAccionesDialog } from "@/components/shared/AsesoriaAccionesDialog"
import { useMisAsesoriasQuery } from "@/domain/asesoria/queries"
import { ESTADO_ASESORIA_BADGE } from "@/domain/asesoria/display"
import type { AsesoriaListado } from "@/domain/asesoria/types"
import { AgendarAsesoriaTab } from "@/portals/emprendedor/pages/mis-asesorias/components/AgendarAsesoriaTab"
import { fechaAsesoriaComoLocal } from "@/lib/fecha-asesoria"

const TIPO_ASESORIA_LABEL: Record<AsesoriaListado["tipoAsesoria"], string> = {
  diagnostica: "Diagnóstica",
  seguimiento: "Seguimiento",
}

/** Agenda y agendamiento de asesorías del emprendedor. */
export function MisAsesoriasPage() {
  const [seleccionada, setSeleccionada] = useState<AsesoriaListado | null>(null)
  const { data, isPending, isError } = useMisAsesoriasQuery()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-primary-900">Mis asesorías</h1>
        <p className="text-sm text-muted-foreground">
          Consulte sus asesorías y agende una nueva. El calendario de sus asesorías está disponible
          desde el centro de notificaciones.
        </p>
      </div>

      <Tabs defaultValue="mias">
        <TabsList>
          <TabsTrigger value="mias">Mis asesorías</TabsTrigger>
          <TabsTrigger value="agendar">Agendar asesoría</TabsTrigger>
        </TabsList>

        <TabsContent value="mias">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Asesor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending &&
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}

                {!isPending &&
                  !isError &&
                  data?.map((asesoria) => (
                    <TableRow key={asesoria.idAsesoria}>
                      <TableCell className="text-sm text-foreground">
                        {format(fechaAsesoriaComoLocal(asesoria.fechaAsesoria), "d/MM/yyyy")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(fechaAsesoriaComoLocal(asesoria.fechaAsesoria), "h:mm a", { locale: es })}
                      </TableCell>
                      <TableCell className="text-sm text-foreground">{asesoria.asesor}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {TIPO_ASESORIA_LABEL[asesoria.tipoAsesoria]}
                      </TableCell>
                      <TableCell>
                        <Badge variant={ESTADO_ASESORIA_BADGE[asesoria.estadoAsesoria].variant}>
                          {ESTADO_ASESORIA_BADGE[asesoria.estadoAsesoria].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => setSeleccionada(asesoria)}>
                          Consultar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>

            {!isPending && !isError && data?.length === 0 && (
              <div className="p-6">
                <EmptyState icon={CalendarClock} title="Sin asesorías registradas todavía" />
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

        <TabsContent value="agendar">
          <AgendarAsesoriaTab />
        </TabsContent>
      </Tabs>

      <AsesoriaAccionesDialog
        asesoria={seleccionada}
        onOpenChange={(open) => !open && setSeleccionada(null)}
      />
    </div>
  )
}
