import { useState } from "react"
import { AlertTriangle, ChevronDown, Rocket, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { RutaMetodologica } from "@/components/shared/RutaMetodologica"
import { CaracterizacionInfo } from "@/components/shared/CaracterizacionInfo"
import { useMiEmprendimientoQuery } from "@/domain/emprendimiento/queries"
import { codigoEmprendimiento, ESTADO_EMPRENDIMIENTO_BADGE } from "@/domain/emprendimiento/display"

/** Información y avance del emprendimiento del emprendedor, en modo solo lectura. */
export function MiEmprendimientoPage() {
  const [verRutaCompleta, setVerRutaCompleta] = useState(false)
  const { data, isPending, isError } = useMiEmprendimientoQuery()

  if (isPending) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No se pudo cargar la información de su emprendimiento"
        description="Intente nuevamente en unos momentos."
      />
    )
  }

  const etapaActualNombre = data.ruta.find((e) => e.fases.some((f) => f.estadoFase === "en_curso"))?.nombre
  const faseActualNombre = data.faseActual?.fase
    ? `${data.faseActual.fase.numero}. ${data.faseActual.fase.nombre}`
    : "—"
  const pct = Math.round((data.fasesCompletadas / data.totalFases) * 100)

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 pt-6">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-700 text-white">
            <Rocket className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-primary-900">{data.nombreReferencia}</h1>
              <Badge variant={ESTADO_EMPRENDIMIENTO_BADGE[data.estado].variant}>
                {ESTADO_EMPRENDIMIENTO_BADGE[data.estado].label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {codigoEmprendimiento(data.idEmprendimiento)}
              {data.caracterizacion.sector && ` · ${data.caracterizacion.sector}`}
            </p>
          </div>
        </CardContent>
        {data.caracterizacion.descripcion && (
          <CardContent className="pt-0 text-sm text-foreground">
            {data.caracterizacion.descripcion}
          </CardContent>
        )}
      </Card>

      {/* Progreso de la ruta */}
      <Card>
        <CardHeader>
          <CardTitle>Progreso en la ruta metodológica</CardTitle>
        </CardHeader>
        <CardContent className="gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Etapa actual</p>
              <p className="text-sm font-medium text-foreground">{etapaActualNombre ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fase actual</p>
              <p className="text-sm font-medium text-foreground">{faseActualNombre}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avance general</p>
              <p className="text-sm font-medium text-primary-900">
                {data.fasesCompletadas} de {data.totalFases} fases · {pct}%
              </p>
            </div>
          </div>

          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary-600 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>

          {data.faseActual?.fase?.entregablesRequeridos && (
            <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Entregable requerido de la fase actual: </span>
              {data.faseActual.fase.entregablesRequeridos}
            </p>
          )}

          <button
            type="button"
            onClick={() => setVerRutaCompleta((v) => !v)}
            className="flex w-fit items-center gap-1 text-sm font-medium text-primary-700 hover:underline"
          >
            {verRutaCompleta ? "Ocultar ruta completa" : "Ver ruta completa"}
            <ChevronDown className={`size-4 transition-transform ${verRutaCompleta ? "rotate-180" : ""}`} />
          </button>

          {verRutaCompleta && (
            <div className="border-t border-border pt-4">
              <RutaMetodologica ruta={data.ruta} />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Caracterización */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Información del emprendimiento</CardTitle>
            <p className="text-sm text-muted-foreground">
              Datos capturados en el formulario de caracterización.
            </p>
          </CardHeader>
          <CardContent>
            <CaracterizacionInfo datos={data.caracterizacion} variante="acordeon" />
          </CardContent>
        </Card>

        {/* Equipo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-4 text-primary-700" />
              Equipo emprendedor
            </CardTitle>
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
                  <span className="min-w-0 truncate">{integrante.emprendedor?.nombre}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Sin integrantes registrados.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
