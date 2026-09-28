import { useState } from "react"
import { AlertTriangle, ArrowRight, FileCheck2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { EntregableRevisionDialog } from "@/components/shared/EntregableRevisionDialog"
import { useAvanzarFaseMutation, useEntregablesPorFaseQuery } from "@/domain/entregable/queries"
import {
  ESTADO_ACTIVIDAD_BADGE,
  ESTADO_APROBACION_ENTREGABLE_BADGE,
  estadoAprobacionDe,
} from "@/domain/entregable/display"
import type { EtapaRuta, FaseRuta } from "@/domain/ruta/types"
import { usePermiso } from "@/hooks/usePermiso"

interface FaseEntregablesDialogProps {
  idEmprendimiento: number
  seleccion: { etapa: EtapaRuta; fase: FaseRuta } | null
  onOpenChange: (open: boolean) => void
}

/**
 * Drill-down de una fase de la ruta: sus entregables y, si es la fase en
 * curso con todo aprobado, "Aprobar cumplimiento y avanzar".
 */
export function FaseEntregablesDialog({
  idEmprendimiento,
  seleccion,
  onOpenChange,
}: FaseEntregablesDialogProps) {
  const [idEntregableRevision, setIdEntregableRevision] = useState<number | null>(null)
  const { data, isPending } = useEntregablesPorFaseQuery(idEmprendimiento, seleccion?.fase.idFase)
  const avanzarFase = useAvanzarFaseMutation(idEmprendimiento)
  const puedeEditar = usePermiso("emprendimientos", "editar")

  const esFaseEnCurso = seleccion?.fase.estadoFase === "en_curso"
  const todoAprobado = !!data && data.length > 0 && data.every((e) => e.estadoRevision === "aprobado")

  const onAvanzar = async () => {
    try {
      await avanzarFase.mutateAsync()
      toast.success("Se registró el avance de etapa.")
      onOpenChange(false)
    } catch {
      toast.error("No se pudo registrar el avance de etapa.")
    }
  }

  return (
    <>
      <Dialog open={seleccion !== null} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          {seleccion && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Fase {seleccion.fase.numero} · {seleccion.fase.nombre}
                </DialogTitle>
                <DialogDescription>
                  Etapa {seleccion.etapa.numero} · {seleccion.etapa.nombre}
                </DialogDescription>
              </DialogHeader>

              {seleccion.fase.entregableRequerido && (
                <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Entregable obligatorio: </span>
                  {seleccion.fase.entregableRequerido}
                </p>
              )}

              {isPending && (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              )}

              {!isPending && data?.length === 0 && (
                <EmptyState
                  icon={FileCheck2}
                  title="Sin entregables registrados en esta fase"
                  description="Regístrelos desde el módulo de Entregables."
                />
              )}

              {!isPending && data && data.length > 0 && (
                <div className="flex flex-col gap-2">
                  {data.map((entregable) => (
                    <button
                      key={entregable.idEntregable}
                      onClick={() => setIdEntregableRevision(entregable.idEntregable)}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{entregable.titulo}</p>
                        <p className="text-xs text-muted-foreground">
                          Compromiso:{" "}
                          <Badge variant={ESTADO_ACTIVIDAD_BADGE[entregable.estadoActividad].variant} className="ml-1">
                            {ESTADO_ACTIVIDAD_BADGE[entregable.estadoActividad].label}
                          </Badge>
                        </p>
                      </div>
                      {(() => {
                        const estadoCombinado = estadoAprobacionDe(entregable.estadoRevision)
                        return (
                          <Badge variant={ESTADO_APROBACION_ENTREGABLE_BADGE[estadoCombinado].variant}>
                            {ESTADO_APROBACION_ENTREGABLE_BADGE[estadoCombinado].label}
                          </Badge>
                        )
                      })()}
                    </button>
                  ))}
                </div>
              )}

              {esFaseEnCurso && puedeEditar && (
                <div className="border-t border-border pt-4">
                  <Button
                    className="w-full"
                    disabled={!todoAprobado || avanzarFase.isPending}
                    onClick={onAvanzar}
                  >
                    {avanzarFase.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ArrowRight className="size-4" />
                    )}
                    Aprobar cumplimiento y avanzar
                  </Button>
                  {!todoAprobado && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <AlertTriangle className="size-3.5 shrink-0" />
                      Todos los entregables de la fase deben estar aprobados para avanzar.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <EntregableRevisionDialog
        idEntregable={idEntregableRevision}
        onOpenChange={(open) => !open && setIdEntregableRevision(null)}
      />
    </>
  )
}
