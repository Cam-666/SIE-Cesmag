import { format } from "date-fns"
import { es } from "date-fns/locale"
import { AlertTriangle, CalendarClock, CheckCircle2, Clock3, FileCheck2 } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatCard } from "@/components/shared/StatCard"
import { useMiDashboardQuery } from "@/domain/emprendedor/queries"
import { ESTADO_ENTREGABLE_EMPRENDEDOR_BADGE } from "@/domain/entregable/display"
import { useAuthStore } from "@/stores/auth-store"
import { fechaAsesoriaComoLocal } from "@/lib/fecha-asesoria"

/** Estado actual del proceso del emprendedor. */
export function DashboardPage() {
  const navigate = useNavigate()
  const sesion = useAuthStore((state) => state.sesion)
  const primerNombre = sesion?.nombre.split(" ")[0] ?? ""
  const { data, isPending, isError } = useMiDashboardQuery()

  if (isError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No se pudo cargar el dashboard"
        description="Intente nuevamente en unos momentos."
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-primary-900">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Hola, {primerNombre}. Aquí tiene el estado actual de su proceso.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progreso general</CardTitle>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            data && (
              <>
                <div className="mb-2 flex items-baseline justify-between">
                  <p className="text-3xl font-semibold text-primary-900">{data.progresoPct}%</p>
                  <p className="text-sm text-muted-foreground">
                    {data.etapaActual} · Fase {data.faseNumero} de {data.totalFases}
                  </p>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-r-full bg-primary-600 transition-all"
                    style={{ width: `${data.progresoPct}%` }}
                  />
                </div>
              </>
            )
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Actividades pendientes"
          value={data?.actividadesPendientes ?? "—"}
          icon={Clock3}
          loading={isPending}
          accent="destructive"
        />
        <StatCard
          label="Entregables entregados"
          value={data?.entregablesEntregados ?? "—"}
          icon={FileCheck2}
          loading={isPending}
          accent="primary"
        />
        <StatCard
          label="Entregables aprobados"
          value={data?.entregablesAprobados ?? "—"}
          icon={CheckCircle2}
          loading={isPending}
          accent="primary"
        />
        <StatCard
          label="Próximas asesorías"
          value={data?.proximasAsesoriasCount ?? "—"}
          icon={CalendarClock}
          loading={isPending}
          accent="destructive"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mis entregables recientes</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            {isPending &&
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}

            {data?.entregablesRecientes.length === 0 && (
              <EmptyState icon={FileCheck2} title="Sin entregables registrados todavía" />
            )}

            {data?.entregablesRecientes.map((entregable) => (
              <button
                key={entregable.idEntregable}
                type="button"
                onClick={() => navigate("/emprendedor/mis-entregables")}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-left hover:bg-muted"
              >
                <p className="truncate text-sm font-medium text-foreground">{entregable.titulo}</p>
                <Badge variant={ESTADO_ENTREGABLE_EMPRENDEDOR_BADGE[entregable.estado].variant}>
                  {ESTADO_ENTREGABLE_EMPRENDEDOR_BADGE[entregable.estado].label}
                </Badge>
              </button>
            ))}

            <Link
              to="/emprendedor/mis-entregables"
              className="text-sm font-medium text-primary-700 hover:underline"
            >
              Ver todos mis entregables
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próxima asesoría</CardTitle>
          </CardHeader>
          <CardContent>
            {isPending && <Skeleton className="h-20 w-full" />}

            {!isPending && !data?.proximaAsesoria && (
              <EmptyState icon={CalendarClock} title="No tiene asesorías programadas" />
            )}

            {data?.proximaAsesoria && (
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{data.proximaAsesoria.titulo}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(fechaAsesoriaComoLocal(data.proximaAsesoria.fechaAsesoria), "d 'de' MMMM, h:mm a", {
                      locale: es,
                    })}{" "}
                    · {data.proximaAsesoria.asesor}
                  </p>
                </div>
                <Button asChild variant="outline" className="w-fit">
                  <Link to="/emprendedor/mis-asesorias">Consultar</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
