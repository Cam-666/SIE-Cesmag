import { AlertTriangle, CalendarClock, FileCheck2, Rocket, Users } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatCard } from "@/components/shared/StatCard"
import { BarList } from "@/components/shared/BarList"
import {
  useDistribucionPorEtapaQuery,
  useEntregablesRecientesQuery,
  useProximasAsesoriasQuery,
  useResumenIndicadoresQuery,
} from "@/domain/indicadores/queries"
import { ESTADO_ASESORIA_BADGE } from "@/domain/asesoria/display"
import { ESTADO_ACTIVIDAD_BADGE } from "@/domain/entregable/display"

function ErrorInline({ mensaje }: { mensaje: string }) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="No se pudo cargar la información"
      description={mensaje}
    />
  )
}

/** Resumen visual del estado del sistema. */
export function DashboardPage() {
  const navigate = useNavigate()
  const resumen = useResumenIndicadoresQuery()
  const distribucion = useDistribucionPorEtapaQuery()
  const proximasAsesorias = useProximasAsesoriasQuery()
  const entregablesRecientes = useEntregablesRecientesQuery()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-primary-900">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumen general del sistema de emprendimientos.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Emprendimientos activos"
          value={resumen.data?.activos ?? "—"}
          icon={Rocket}
          loading={resumen.isPending}
          accent="primary"
        />
        <StatCard
          label="Emprendedores registrados"
          value={resumen.data?.emprendedores ?? "—"}
          icon={Users}
          loading={resumen.isPending}
          accent="destructive"
        />
        <StatCard
          label="Asesorías registradas"
          value={resumen.data?.asesorias ?? "—"}
          icon={CalendarClock}
          loading={resumen.isPending}
          accent="primary"
        />
        <StatCard
          label="Compromisos (entregables)"
          value={resumen.data?.compromisos ?? "—"}
          icon={FileCheck2}
          loading={resumen.isPending}
          accent="destructive"
        />
      </div>

      {resumen.isError && <ErrorInline mensaje="No fue posible obtener los indicadores." />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Emprendimientos por etapa</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            {distribucion.isPending &&
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}

            {distribucion.isError && (
              <ErrorInline mensaje="No fue posible obtener la distribución por etapa." />
            )}

            {distribucion.data?.length === 0 && (
              <EmptyState
                icon={Rocket}
                title="Sin emprendimientos registrados"
                description="Aún no hay emprendimientos activos en ninguna etapa de la ruta."
              />
            )}

            {distribucion.data && distribucion.data.length > 0 && (
              <BarList
                items={distribucion.data.map((etapa) => ({
                  id: etapa.idEtapa,
                  label: etapa.nombreEtapa,
                  value: etapa.cantidad,
                }))}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximas asesorías</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            {proximasAsesorias.isPending &&
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}

            {proximasAsesorias.isError && (
              <ErrorInline mensaje="No fue posible obtener las próximas asesorías." />
            )}

            {proximasAsesorias.data?.length === 0 && (
              <EmptyState icon={CalendarClock} title="No hay asesorías programadas" />
            )}

            {proximasAsesorias.data?.map((asesoria) => (
              <button
                key={asesoria.idAsesoria}
                type="button"
                onClick={() => navigate("/admin/asesorias")}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-left hover:bg-muted"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {asesoria.emprendimiento}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(asesoria.fechaAsesoria), "d 'de' MMMM, h:mm a", {
                      locale: es,
                    })}{" "}
                    · {asesoria.asesor}
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

      <Card>
        <CardHeader>
          <CardTitle>Entregables recientes</CardTitle>
        </CardHeader>
        <CardContent className="gap-3">
          {entregablesRecientes.isPending &&
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}

          {entregablesRecientes.isError && (
            <ErrorInline mensaje="No fue posible obtener los entregables recientes." />
          )}

          {entregablesRecientes.data?.length === 0 && (
            <EmptyState icon={FileCheck2} title="No hay entregables recientes" />
          )}

          {entregablesRecientes.data?.map((entregable) => (
            <button
              key={entregable.idEntregable}
              type="button"
              onClick={() => navigate("/admin/entregables")}
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-left hover:bg-muted"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{entregable.titulo}</p>
                <p className="text-xs text-muted-foreground">{entregable.emprendimiento}</p>
              </div>
              <Badge variant={ESTADO_ACTIVIDAD_BADGE[entregable.estadoActividad].variant}>
                {ESTADO_ACTIVIDAD_BADGE[entregable.estadoActividad].label}
              </Badge>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
