import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm, useWatch } from "react-hook-form"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { fechaAsesoriaComoLocal } from "@/lib/fecha-asesoria"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SelectorHorarioAgenda } from "@/components/shared/SelectorHorarioAgenda"
import {
  cancelarAsesoriaSchema,
  registrarResultadoSchema,
  reprogramarAsesoriaSchema,
  type CancelarAsesoriaFormValues,
  type RegistrarResultadoFormValues,
  type ReprogramarAsesoriaFormValues,
} from "@/domain/asesoria/schemas"
import { useCancelarReprogramarMutation, useRegistrarResultadoMutation } from "@/domain/asesoria/queries"
import { useAgendaAsesorQuery, useMiAgendaQuery } from "@/domain/agenda/queries"
import {
  ESTADO_ASESORIA_BADGE,
  MODALIDAD_LABEL,
  requiereRegistrarResultado,
} from "@/domain/asesoria/display"
import type { AsesoriaListado } from "@/domain/asesoria/types"
import { usePermiso } from "@/hooks/usePermiso"
import { useAuthStore } from "@/stores/auth-store"

interface AsesoriaAccionesDialogProps {
  asesoria: AsesoriaListado | null
  onOpenChange: (open: boolean) => void
}

/**
 * Ver el detalle de una asesoría y, si está programada, cancelarla o
 * reprogramarla. Compartido entre el portal admin (Asesorías) y el portal
 * del emprendedor (Mis asesorías): la acción de cancelar o reprogramar
 * está permitida a ambos.
 */
export function AsesoriaAccionesDialog({ asesoria, onOpenChange }: AsesoriaAccionesDialogProps) {
  const cancelarReprogramar = useCancelarReprogramarMutation()
  const registrarResultado = useRegistrarResultadoMutation()

  // Reprogramar/cancelar está siempre permitido en el portal del
  // emprendedor (no tiene matriz de permisos); en el portal admin depende
  // de los permisos del rol sobre el módulo Asesorías. Registrar el
  // resultado es exclusivo del asesor (portal admin), nunca del emprendedor.
  const ambito = useAuthStore((state) => state.sesion?.ambito)
  const puedeEditarAdmin = usePermiso("asesorias", "editar")
  const puedeEliminarAdmin = usePermiso("asesorias", "eliminar")
  const puedeReprogramar = ambito !== "admin" || puedeEditarAdmin
  const puedeCancelar = ambito !== "admin" || puedeEliminarAdmin

  const cancelarForm = useForm<CancelarAsesoriaFormValues>({
    resolver: zodResolver(cancelarAsesoriaSchema),
  })
  const reprogramarForm = useForm<ReprogramarAsesoriaFormValues>({
    resolver: zodResolver(reprogramarAsesoriaSchema),
  })
  const resultadoForm = useForm<RegistrarResultadoFormValues>({
    resolver: zodResolver(registrarResultadoSchema),
    defaultValues: { realizada: "si" },
  })
  const realizada = useWatch({ control: resultadoForm.control, name: "realizada" })
  const idAgendaReprogramar = useWatch({ control: reprogramarForm.control, name: "idAgenda" })

  // Reprogramar respeta la disponibilidad real: el admin elige entre su
  // propia agenda; el emprendedor, entre la de todo el equipo (coordinador,
  // vicerrector o empleado que tenga el horario).
  const miAgenda = useMiAgendaQuery(ambito === "admin")
  const agendaAsesores = useAgendaAsesorQuery()
  const bloquesParaReprogramar =
    ambito === "admin" ? miAgenda.data?.filter((b) => b.estado !== "reservado") : agendaAsesores.data
  const cargandoBloques = ambito === "admin" ? miAgenda.isPending : agendaAsesores.isPending
  const errorBloques = ambito === "admin" ? miAgenda.isError : agendaAsesores.isError

  if (!asesoria) {
    return <Dialog open={false} onOpenChange={onOpenChange} />
  }

  const pendienteDeResultado = ambito === "admin" && requiereRegistrarResultado(asesoria)

  const onRegistrarResultado = async (values: RegistrarResultadoFormValues) => {
    try {
      await registrarResultado.mutateAsync({
        idAsesoria: asesoria.idAsesoria,
        realizada: values.realizada === "si",
        avance: values.avance,
        observaciones: values.observaciones,
      })
      toast.success(
        values.realizada === "si" ? "Resultado registrado." : "Se dejó constancia de que no se realizó.",
      )
      onOpenChange(false)
    } catch {
      toast.error("No se pudo registrar el resultado.")
    }
  }

  const onCancelar = async (values: CancelarAsesoriaFormValues) => {
    try {
      await cancelarReprogramar.mutateAsync({
        idAsesoria: asesoria.idAsesoria,
        accion: "cancelar",
        motivo: values.motivo,
      })
      toast.success("Asesoría cancelada.")
      onOpenChange(false)
    } catch {
      toast.error("No se pudo cancelar la asesoría.")
    }
  }

  const onReprogramar = async (values: ReprogramarAsesoriaFormValues) => {
    try {
      await cancelarReprogramar.mutateAsync({
        idAsesoria: asesoria.idAsesoria,
        accion: "reprogramar",
        nuevoIdAgenda: Number(values.idAgenda),
      })
      toast.success("Asesoría reprogramada.")
      reprogramarForm.reset()
      onOpenChange(false)
    } catch {
      toast.error("No se pudo reprogramar la asesoría. Puede que el horario ya no esté disponible.")
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalle de la asesoría</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Emprendimiento</p>
              <p className="font-medium text-foreground">{asesoria.emprendimiento}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Asesor</p>
              <p className="font-medium text-foreground">{asesoria.asesor}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fecha y hora</p>
              <p className="font-medium text-foreground">
                {format(fechaAsesoriaComoLocal(asesoria.fechaAsesoria), "d/MM/yyyy h:mm a", { locale: es })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Modalidad</p>
              <p className="font-medium text-foreground">{MODALIDAD_LABEL[asesoria.modalidad]}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Estado:</span>
            <Badge variant={ESTADO_ASESORIA_BADGE[asesoria.estadoAsesoria].variant}>
              {ESTADO_ASESORIA_BADGE[asesoria.estadoAsesoria].label}
            </Badge>
          </div>
          {asesoria.avance && (
            <div>
              <p className="text-xs text-muted-foreground">Avance</p>
              <p className="text-foreground">{asesoria.avance}</p>
            </div>
          )}
          {asesoria.observaciones && (
            <div>
              <p className="text-xs text-muted-foreground">Observaciones</p>
              <p className="text-foreground">{asesoria.observaciones}</p>
            </div>
          )}

          {pendienteDeResultado && (
            <div className="border-t border-border pt-4">
              <p className="mb-1 text-sm font-medium text-foreground">Registrar resultado</p>
              <p className="mb-2 text-xs text-muted-foreground">
                La fecha de esta asesoría ya pasó. Indique si se realizó y deje constancia de lo
                ocurrido.
              </p>
              <form
                className="flex flex-col gap-2"
                onSubmit={resultadoForm.handleSubmit(onRegistrarResultado)}
                noValidate
              >
                <Controller
                  control={resultadoForm.control}
                  name="realizada"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="si">Sí, se realizó</SelectItem>
                        <SelectItem value="no">No se llevó a cabo</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />

                {realizada === "si" ? (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="resultado-avance">Avance / situación tratada</Label>
                    <Textarea id="resultado-avance" rows={3} {...resultadoForm.register("avance")} />
                    {resultadoForm.formState.errors.avance && (
                      <p className="text-xs text-destructive-700">
                        {resultadoForm.formState.errors.avance.message}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="resultado-observaciones">Motivo (evidencia de que no se realizó)</Label>
                    <Textarea id="resultado-observaciones" rows={3} {...resultadoForm.register("observaciones")} />
                    {resultadoForm.formState.errors.observaciones && (
                      <p className="text-xs text-destructive-700">
                        {resultadoForm.formState.errors.observaciones.message}
                      </p>
                    )}
                  </div>
                )}

                <Button type="submit" className="w-fit" disabled={registrarResultado.isPending}>
                  {registrarResultado.isPending && <Loader2 className="size-4 animate-spin" />}
                  Guardar resultado
                </Button>
              </form>
            </div>
          )}

          {!pendienteDeResultado && asesoria.estadoAsesoria === "programada" && (puedeReprogramar || puedeCancelar) && (
            <>
              {puedeReprogramar && (
                <div className="border-t border-border pt-4">
                  <p className="mb-2 text-sm font-medium text-foreground">Reprogramar</p>
                  <form
                    className="flex flex-col gap-2"
                    onSubmit={reprogramarForm.handleSubmit(onReprogramar)}
                    noValidate
                  >
                    <Controller
                      control={reprogramarForm.control}
                      name="idAgenda"
                      render={({ field }) => (
                        <SelectorHorarioAgenda
                          bloques={bloquesParaReprogramar}
                          isPending={cargandoBloques}
                          isError={errorBloques}
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          mensajeVacio="No hay horarios disponibles para reprogramar."
                        />
                      )}
                    />
                    {reprogramarForm.formState.errors.idAgenda && (
                      <p className="text-xs text-destructive-700">
                        {reprogramarForm.formState.errors.idAgenda.message}
                      </p>
                    )}
                    <Button
                      type="submit"
                      variant="outline"
                      className="w-fit"
                      disabled={cancelarReprogramar.isPending || !idAgendaReprogramar}
                    >
                      {cancelarReprogramar.isPending && <Loader2 className="size-4 animate-spin" />}
                      Reprogramar
                    </Button>
                  </form>
                </div>
              )}

              {puedeCancelar && (
                <div className="border-t border-border pt-4">
                  <p className="mb-2 text-sm font-medium text-foreground">Cancelar asesoría</p>
                  <form className="flex flex-col gap-2" onSubmit={cancelarForm.handleSubmit(onCancelar)} noValidate>
                    <Textarea placeholder="Motivo de la cancelación" rows={2} {...cancelarForm.register("motivo")} />
                    {cancelarForm.formState.errors.motivo && (
                      <p className="text-xs text-destructive-700">
                        {cancelarForm.formState.errors.motivo.message}
                      </p>
                    )}
                    <Button type="submit" variant="destructive" className="w-fit" disabled={cancelarReprogramar.isPending}>
                      {cancelarReprogramar.isPending && <Loader2 className="size-4 animate-spin" />}
                      Cancelar asesoría
                    </Button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
