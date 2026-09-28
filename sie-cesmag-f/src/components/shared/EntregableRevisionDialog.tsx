import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { EvidenciaEnlace } from "@/components/shared/EvidenciaEnlace"
import { revisarEntregableSchema, type RevisarEntregableFormValues } from "@/domain/entregable/schemas"
import { useEntregableQuery, useRevisarEntregableMutation } from "@/domain/entregable/queries"
import {
  ESTADO_ACTIVIDAD_BADGE,
  ESTADO_APROBACION_ENTREGABLE_BADGE,
  estadoAprobacionDe,
} from "@/domain/entregable/display"
import { usePermiso } from "@/hooks/usePermiso"

interface EntregableRevisionDialogProps {
  idEntregable: number | null
  onOpenChange: (open: boolean) => void
}

/** Revisión de un entregable y su historial de intentos. */
export function EntregableRevisionDialog({ idEntregable, onOpenChange }: EntregableRevisionDialogProps) {
  const { data, isPending } = useEntregableQuery(idEntregable ?? undefined)
  const revisar = useRevisarEntregableMutation()
  const puedeRevisar = usePermiso("entregables", "editar")

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RevisarEntregableFormValues>({
    resolver: zodResolver(revisarEntregableSchema),
    defaultValues: { decision: "aprobado", observaciones: "" },
  })

  const ultimoIntento = data?.intentos[data.intentos.length - 1] ?? null

  const decidir = async (decision: "aprobado" | "rechazado", observaciones: string) => {
    if (!idEntregable) return
    try {
      await revisar.mutateAsync({ idEntregable, decision, observaciones })
      toast.success(decision === "aprobado" ? "Entregable aprobado." : "Entregable rechazado.")
      reset()
      onOpenChange(false)
    } catch {
      toast.error("No se pudo registrar la revisión.")
    }
  }

  // El botón determina la decisión: se sincroniza en el form antes de validar,
  // para que el esquema exija observaciones solo cuando se rechaza.
  const onAprobar = () => {
    setValue("decision", "aprobado")
    void handleSubmit((v) => decidir("aprobado", v.observaciones ?? ""))()
  }
  const onRechazar = () => {
    setValue("decision", "rechazado")
    void handleSubmit((v) => decidir("rechazado", v.observaciones ?? ""))()
  }

  return (
    <Dialog open={idEntregable !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Revisión de entregable</DialogTitle>
        </DialogHeader>

        {isPending && (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {!isPending && data && (
          <div className="flex flex-col gap-4 text-sm">
            <div>
              <p className="text-base font-medium text-foreground">{data.titulo}</p>
              <p className="text-xs text-muted-foreground">
                {data.emprendimiento} · Fase {data.faseNombre}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Estado del compromiso</p>
                <Badge variant={ESTADO_ACTIVIDAD_BADGE[data.estadoActividad].variant}>
                  {ESTADO_ACTIVIDAD_BADGE[data.estadoActividad].label}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estado de revisión</p>
                {(() => {
                  const estadoCombinado = estadoAprobacionDe(ultimoIntento?.estadoRevision ?? null)
                  return (
                    <Badge variant={ESTADO_APROBACION_ENTREGABLE_BADGE[estadoCombinado].variant}>
                      {ESTADO_APROBACION_ENTREGABLE_BADGE[estadoCombinado].label}
                    </Badge>
                  )
                })()}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fecha prevista</p>
                <p className="text-foreground">
                  {format(new Date(data.fechaPrevista), "d/MM/yyyy")}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Evidencia</p>
                {ultimoIntento ? (
                  <EvidenciaEnlace
                    idEntregable={data.idEntregable}
                    rutaEvidencia={ultimoIntento.rutaEvidencia}
                    nombreArchivo={ultimoIntento.nombreArchivo}
                  />
                ) : (
                  <p className="text-muted-foreground">Sin evidencia cargada aún.</p>
                )}
              </div>
            </div>

            {data.intentos.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-foreground">
                  Historial de intentos ({data.intentos.length})
                </p>
                <ul className="flex flex-col gap-2">
                  {data.intentos.map((intento, i) => {
                    const estadoCombinado = estadoAprobacionDe(intento.estadoRevision)
                    return (
                      <li key={intento.idIntentoEntrega} className="rounded-md border border-border p-2">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-foreground">Intento {i + 1}</span>
                          <Badge variant={ESTADO_APROBACION_ENTREGABLE_BADGE[estadoCombinado].variant}>
                            {ESTADO_APROBACION_ENTREGABLE_BADGE[estadoCombinado].label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {intento.fechaEntrega &&
                            format(new Date(intento.fechaEntrega), "d/MM/yyyy h:mm a", { locale: es })}
                        </p>
                        <EvidenciaEnlace
                          idEntregable={data.idEntregable}
                          rutaEvidencia={intento.rutaEvidencia}
                          nombreArchivo={intento.nombreArchivo}
                          className="mt-1 text-xs"
                        />
                        {intento.observaciones && (
                          <p className="mt-1 text-xs text-foreground">{intento.observaciones}</p>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {!ultimoIntento ? (
              <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                El emprendedor aún no ha cargado evidencia para este entregable.
              </p>
            ) : ultimoIntento.estadoRevision === "aprobado" ? (
              <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                Este intento ya fue aprobado. No puede volver a aprobarse ni rechazarse.
              </p>
            ) : ultimoIntento.estadoRevision === "rechazado" ? (
              <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                Este intento fue rechazado. El emprendedor debe cargar una nueva entrega para que
                pueda revisarse de nuevo.
              </p>
            ) : puedeRevisar ? (
              <form className="flex flex-col gap-2 border-t border-border pt-4">
                <Label htmlFor="observaciones">Observaciones del coordinador</Label>
                <Textarea id="observaciones" rows={2} {...register("observaciones")} />
                {errors.observaciones && (
                  <p className="text-xs text-destructive-700">{errors.observaciones.message}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    className="flex-1"
                    disabled={revisar.isPending}
                    onClick={onAprobar}
                  >
                    {revisar.isPending && <Loader2 className="size-4 animate-spin" />}
                    Aprobar
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="flex-1"
                    disabled={revisar.isPending}
                    onClick={onRechazar}
                  >
                    {revisar.isPending && <Loader2 className="size-4 animate-spin" />}
                    Rechazar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  La aprobación habilita el avance cuando se hayan cumplido los requisitos de la etapa.
                </p>
              </form>
            ) : (
              <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                No tiene permiso para revisar entregables.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
