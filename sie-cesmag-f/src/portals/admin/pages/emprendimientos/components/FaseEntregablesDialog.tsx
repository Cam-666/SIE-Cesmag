import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { AlertTriangle, ArrowRight, FileCheck2, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { EntregableRevisionDialog } from "@/components/shared/EntregableRevisionDialog"
import {
  useAvanzarFaseMutation,
  useCrearEntregableMutation,
  useEntregablesPorFaseQuery,
} from "@/domain/entregable/queries"
import {
  ESTADO_ACTIVIDAD_BADGE,
  ESTADO_APROBACION_ENTREGABLE_BADGE,
  estadoAprobacionDe,
} from "@/domain/entregable/display"
import type { EtapaRuta, FaseRuta } from "@/domain/ruta/types"
import { usePermiso } from "@/hooks/usePermiso"

/** Emprendimiento y fase ya se conocen por el contexto del diálogo — el atajo solo pide lo que falta. */
const nuevoEntregableRapidoSchema = z.object({
  titulo: z.string().min(1, "Ingrese el título."),
  descripcion: z.string().min(1, "Ingrese la descripción."),
  fechaPrevista: z.string().min(1, "Seleccione la fecha prevista."),
})
type NuevoEntregableRapidoValues = z.infer<typeof nuevoEntregableRapidoSchema>

interface FaseEntregablesDialogProps {
  idEmprendimiento: number
  seleccion: { etapa: EtapaRuta; fase: FaseRuta } | null
  /** Con qué etapa arrancó la ruta — una fase de una etapa anterior nunca se va a cursar. */
  numeroEtapaIngreso: number | undefined
  onOpenChange: (open: boolean) => void
}

/**
 * Drill-down de una fase de la ruta: sus entregables y, si es la fase en
 * curso con todo aprobado, "Aprobar cumplimiento y avanzar".
 */
export function FaseEntregablesDialog({
  idEmprendimiento,
  seleccion,
  numeroEtapaIngreso,
  onOpenChange,
}: FaseEntregablesDialogProps) {
  const [idEntregableRevision, setIdEntregableRevision] = useState<number | null>(null)
  // La fase para la que está abierto el formulario rápido — no un simple
  // booleano, para que se cierre solo al cambiar de fase sin necesitar un
  // efecto que sincronice el estado.
  const [formularioRapidoPara, setFormularioRapidoPara] = useState<number | null>(null)
  const mostrarFormularioRapido = formularioRapidoPara !== null && formularioRapidoPara === seleccion?.fase.idFase
  const { data, isPending } = useEntregablesPorFaseQuery(idEmprendimiento, seleccion?.fase.idFase)
  const avanzarFase = useAvanzarFaseMutation(idEmprendimiento)
  const crearEntregable = useCrearEntregableMutation()
  const puedeEditar = usePermiso("emprendimientos", "editar")
  const puedeAnadirEntregable = usePermiso("entregables", "anadir")

  const esFaseEnCurso = seleccion?.fase.estadoFase === "en_curso"
  const etapaAnteriorAIngreso = numeroEtapaIngreso !== undefined && (seleccion?.etapa.numero ?? 0) < numeroEtapaIngreso
  const faseCompletada = seleccion?.fase.estadoFase === "completada" || etapaAnteriorAIngreso
  const todoAprobado = !!data && data.length > 0 && data.every((e) => e.estadoRevision === "aprobado")

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NuevoEntregableRapidoValues>({ resolver: zodResolver(nuevoEntregableRapidoSchema) })

  const onAgregarRapido = async (values: NuevoEntregableRapidoValues) => {
    if (!seleccion) return
    try {
      await crearEntregable.mutateAsync({ idEmprendimiento, idFase: seleccion.fase.idFase, ...values })
      toast.success("Entregable registrado.")
      reset()
      setFormularioRapidoPara(null)
    } catch {
      toast.error("No se pudo registrar el entregable.")
    }
  }

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

              {!isPending && data?.length === 0 && !mostrarFormularioRapido && (
                <EmptyState
                  icon={FileCheck2}
                  title="Sin entregables registrados en esta fase"
                  description={
                    puedeAnadirEntregable && !faseCompletada ? undefined : "Regístrelos desde el módulo de Entregables."
                  }
                  action={
                    puedeAnadirEntregable &&
                    !faseCompletada && (
                      <Button
                        size="sm"
                        onClick={() => {
                          reset()
                          setFormularioRapidoPara(seleccion.fase.idFase)
                        }}
                      >
                        <Plus className="size-4" />
                        Agregar entregable
                      </Button>
                    )
                  }
                />
              )}

              {mostrarFormularioRapido && (
                <form
                  className="flex flex-col gap-4 rounded-lg border border-border p-4"
                  onSubmit={handleSubmit(onAgregarRapido)}
                  noValidate
                >
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="titulo-rapido">Título</Label>
                    <Input id="titulo-rapido" {...register("titulo")} />
                    {errors.titulo && <p className="text-xs text-destructive-700">{errors.titulo.message}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="descripcion-rapido">Descripción</Label>
                    <Textarea id="descripcion-rapido" rows={2} {...register("descripcion")} />
                    {errors.descripcion && (
                      <p className="text-xs text-destructive-700">{errors.descripcion.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="fechaPrevista-rapido">Fecha prevista</Label>
                    <Input id="fechaPrevista-rapido" type="date" {...register("fechaPrevista")} />
                    {errors.fechaPrevista && (
                      <p className="text-xs text-destructive-700">{errors.fechaPrevista.message}</p>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        reset()
                        setFormularioRapidoPara(null)
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={crearEntregable.isPending}>
                      {crearEntregable.isPending && <Loader2 className="size-4 animate-spin" />}
                      Guardar
                    </Button>
                  </div>
                </form>
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
