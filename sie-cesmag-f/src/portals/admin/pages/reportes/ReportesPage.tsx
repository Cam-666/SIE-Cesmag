import { useMemo, useState } from "react"
import { subDays, subMonths } from "date-fns"
import { AlertTriangle, CheckCircle2, Clock3, FileDown, Rocket, Users, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { BarList } from "@/components/shared/BarList"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatCard } from "@/components/shared/StatCard"
import {
  useAvancePorFaseQuery,
  useDesercionPorEtapaQuery,
  useDistribucionPorEtapaQuery,
  useResumenIndicadoresQuery,
  useRetencionDesercionQuery,
  useTiempoPermanenciaQuery,
} from "@/domain/indicadores/queries"
import type { FiltroPeriodo } from "@/domain/indicadores/types"

const PRESETS_PERIODO = ["todo", "30d", "90d", "1a"] as const
type PresetPeriodo = (typeof PRESETS_PERIODO)[number]

const PRESET_LABEL: Record<PresetPeriodo, string> = {
  todo: "Todo el periodo",
  "30d": "Últimos 30 días",
  "90d": "Últimos 90 días",
  "1a": "Último año",
}

function periodoDePreset(preset: PresetPeriodo): FiltroPeriodo | undefined {
  const hoy = new Date()
  if (preset === "todo") return undefined
  if (preset === "30d") return { desde: subDays(hoy, 30).toISOString(), hasta: hoy.toISOString() }
  if (preset === "90d") return { desde: subDays(hoy, 90).toISOString(), hasta: hoy.toISOString() }
  return { desde: subMonths(hoy, 12).toISOString(), hasta: hoy.toISOString() }
}

/** Indicadores de gestión, deserción y permanencia. */
export function ReportesPage() {
  const [preset, setPreset] = useState<PresetPeriodo>("todo")
  const periodo = useMemo(() => periodoDePreset(preset), [preset])

  const resumen = useResumenIndicadoresQuery(periodo)
  const distribucion = useDistribucionPorEtapaQuery(periodo)
  const avancePorFase = useAvancePorFaseQuery(periodo)
  const desercion = useDesercionPorEtapaQuery(periodo)
  const retencion = useRetencionDesercionQuery(periodo)
  const permanencia = useTiempoPermanenciaQuery(periodo)

  const totalRetencion = (retencion.data?.retenidos ?? 0) + (retencion.data?.desertados ?? 0)
  const pctRetenidos = totalRetencion > 0 ? ((retencion.data?.retenidos ?? 0) / totalRetencion) * 100 : 0
  const pctDesertados = totalRetencion > 0 ? ((retencion.data?.desertados ?? 0) / totalRetencion) * 100 : 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-primary-900">Reportes e Indicadores</h1>
          <p className="text-sm text-muted-foreground">
            Indicadores de gestión, deserción por etapa y tiempo de permanencia.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={preset} onValueChange={(v) => setPreset(v as PresetPeriodo)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRESETS_PERIODO.map((p) => (
                <SelectItem key={p} value={p}>
                  {PRESET_LABEL[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => window.print()}>
            <FileDown className="size-4" />
            Generar informe
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="Total emprendimientos"
          value={resumen.data?.totalEmprendimientos ?? "—"}
          icon={Rocket}
          loading={resumen.isPending}
          accent="primary"
        />
        <StatCard
          label="Activos"
          value={resumen.data?.activos ?? "—"}
          icon={CheckCircle2}
          loading={resumen.isPending}
          accent="primary"
        />
        <StatCard
          label="Inactivos"
          value={resumen.data?.inactivos ?? "—"}
          icon={Clock3}
          loading={resumen.isPending}
          accent="destructive"
        />
        <StatCard
          label="Completados"
          value={resumen.data?.completados ?? "—"}
          icon={CheckCircle2}
          loading={resumen.isPending}
          accent="primary"
        />
        <StatCard
          label="Emprendedores"
          value={resumen.data?.emprendedores ?? "—"}
          icon={Users}
          loading={resumen.isPending}
          accent="destructive"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribución por etapa</CardTitle>
          </CardHeader>
          <CardContent>
            {distribucion.isPending && <Skeleton className="h-32 w-full" />}
            {distribucion.isError && (
              <EmptyState icon={AlertTriangle} title="No se pudo cargar la distribución" />
            )}
            {distribucion.data && distribucion.data.length > 0 && (
              <BarList
                items={distribucion.data.map((e) => ({
                  id: e.idEtapa,
                  label: e.nombreEtapa,
                  value: e.cantidad,
                }))}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avance por fase</CardTitle>
          </CardHeader>
          <CardContent className="max-h-80 overflow-y-auto">
            {avancePorFase.isPending && <Skeleton className="h-32 w-full" />}
            {avancePorFase.isError && (
              <EmptyState icon={AlertTriangle} title="No se pudo cargar el avance por fase" />
            )}
            {avancePorFase.data && avancePorFase.data.length > 0 && (
              <BarList
                items={avancePorFase.data.map((f) => ({
                  id: f.idFase,
                  label: f.nombreFase,
                  value: f.cantidad,
                }))}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Retención vs. deserción</CardTitle>
          </CardHeader>
          <CardContent>
            {retencion.isPending && <Skeleton className="h-16 w-full" />}
            {retencion.isError && (
              <EmptyState icon={AlertTriangle} title="No se pudo cargar la retención" />
            )}
            {retencion.data && totalRetencion > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary-500" style={{ width: `${pctRetenidos}%` }} />
                  <div className="h-full w-0.5 bg-background" />
                  <div className="h-full bg-destructive-500" style={{ width: `${pctDesertados}%` }} />
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-primary-500" />
                    <span className="text-muted-foreground">Retenidos</span>
                    <span className="font-medium text-foreground">{retencion.data.retenidos}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-destructive-500" />
                    <span className="text-muted-foreground">Desertados</span>
                    <span className="font-medium text-foreground">{retencion.data.desertados}</span>
                  </div>
                </div>
              </div>
            )}
            {retencion.data && totalRetencion === 0 && (
              <EmptyState icon={Users} title="Sin registros en el periodo seleccionado" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deserción por etapa</CardTitle>
          </CardHeader>
          <CardContent>
            {desercion.isPending && <Skeleton className="h-32 w-full" />}
            {desercion.isError && (
              <EmptyState icon={AlertTriangle} title="No se pudo cargar la deserción por etapa" />
            )}
            {desercion.data?.every((e) => e.cantidadDesistimientos === 0) && (
              <EmptyState
                icon={XCircle}
                title="Sin desistimientos registrados"
                description="No se han identificado desistimientos en el periodo seleccionado."
              />
            )}
            {desercion.data && !desercion.data.every((e) => e.cantidadDesistimientos === 0) && (
              <BarList
                colorClassName="bg-destructive-600"
                items={desercion.data.map((e) => ({
                  id: e.idEtapa,
                  label: e.nombreEtapa,
                  value: e.cantidadDesistimientos,
                }))}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tiempo de permanencia en la ruta</CardTitle>
        </CardHeader>
        <CardContent>
          {permanencia.isPending && (
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}
          {permanencia.isError && (
            <EmptyState icon={AlertTriangle} title="No se pudo cargar el tiempo de permanencia" />
          )}
          {permanencia.data && permanencia.data.promedioDias === 0 && (
            <EmptyState
              icon={Clock3}
              title="Aún no hay emprendimientos que hayan culminado la ruta"
              description="Este indicador se calcula sobre emprendimientos en estado Terminado."
            />
          )}
          {permanencia.data && permanencia.data.promedioDias > 0 && (
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Promedio (días)" value={permanencia.data.promedioDias} icon={Clock3} accent="primary" />
              <StatCard label="Mínimo (días)" value={permanencia.data.minimoDias} icon={Clock3} accent="primary" />
              <StatCard label="Máximo (días)" value={permanencia.data.maximoDias} icon={Clock3} accent="destructive" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
