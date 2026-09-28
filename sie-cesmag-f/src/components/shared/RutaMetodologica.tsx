import { Check } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { EtapaRuta, FaseRuta } from "@/domain/ruta/types"

const ESTADO_ETAPA_LABEL: Record<EtapaRuta["estado"], string> = {
  completada: "Completada",
  en_curso: "En curso",
  pendiente: "Pendiente",
}

interface RutaMetodologicaProps {
  ruta: EtapaRuta[]
  /** Si se provee, cada fase se vuelve clickeable (drill-down de entregables de esa fase). */
  onFaseClick?: (etapa: EtapaRuta, fase: FaseRuta) => void
}

/**
 * Roadmap de la ruta metodológica CESMAG-EI (3 etapas / 12 fases). Se usa
 * tanto en el detalle de emprendimiento del portal admin como en "Mi
 * emprendimiento" del portal del emprendedor. Cada fase muestra su
 * entregable obligatorio al pasar el cursor.
 */
export function RutaMetodologica({ ruta, onFaseClick }: RutaMetodologicaProps) {
  return (
    <div className="flex flex-col gap-4">
      {ruta.map((etapa) => (
        <div key={etapa.idEtapa} className="rounded-lg border border-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-primary-900">
              Etapa {etapa.numero} · {etapa.nombre}
            </p>
            <span
              className={
                etapa.estado === "completada"
                  ? "text-xs font-medium text-primary-700"
                  : etapa.estado === "en_curso"
                    ? "text-xs font-medium text-destructive-600"
                    : "text-xs font-medium text-muted-foreground"
              }
            >
              {ESTADO_ETAPA_LABEL[etapa.estado]}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {etapa.fases.map((fase) => {
              const interactivo = !!onFaseClick && fase.estadoFase !== "pendiente"
              return (
                <Tooltip key={fase.idFase}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      disabled={!interactivo}
                      onClick={() => interactivo && onFaseClick?.(etapa, fase)}
                      className={
                        fase.estadoFase === "completada"
                          ? `flex items-center gap-1.5 rounded-full bg-primary-700 px-3 py-1.5 text-xs font-medium text-white ${interactivo ? "cursor-pointer hover:bg-primary-600" : "cursor-default"}`
                          : fase.estadoFase === "en_curso"
                            ? `flex items-center gap-1.5 rounded-full border-2 border-destructive-600 bg-destructive-600/5 px-3 py-1.5 text-xs font-medium text-destructive-700 ${interactivo ? "cursor-pointer hover:bg-destructive-600/10" : "cursor-default"}`
                            : "flex cursor-default items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground"
                      }
                    >
                      {fase.estadoFase === "completada" && <Check className="size-3" />}
                      {fase.numero}. {fase.nombre}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <span className="font-medium">Entregable: </span>
                    {fase.entregableRequerido ?? "No definido."}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
