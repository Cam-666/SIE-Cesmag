import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { FileUp, Loader2, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { EvidenciaEnlace } from "@/components/shared/EvidenciaEnlace"
import {
  EXTENSIONES_EVIDENCIA_PERMITIDAS,
  TAMANO_MAXIMO_EVIDENCIA_MB,
  cargarEvidenciaSchema,
  type CargarEvidenciaFormValues,
} from "@/domain/entregable/schemas"
import {
  useCargarEvidenciaMutation,
  useEliminarIntentoPendienteMutation,
  useEntregableQuery,
} from "@/domain/entregable/queries"
import { ESTADO_ACTIVIDAD_BADGE, ESTADO_REVISION_BADGE } from "@/domain/entregable/display"

interface CargarEvidenciaDialogProps {
  idEntregable: number | null
  onOpenChange: (open: boolean) => void
}

function formatearTamano(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Consultar un entregable abierto y cargar el archivo de evidencia. */
export function CargarEvidenciaDialog({ idEntregable, onOpenChange }: CargarEvidenciaDialogProps) {
  const { data, isPending } = useEntregableQuery(idEntregable ?? undefined)
  const cargarEvidencia = useCargarEvidenciaMutation()
  const eliminarIntento = useEliminarIntentoPendienteMutation()

  const {
    register,
    handleSubmit,
    reset,
    resetField,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CargarEvidenciaFormValues>({ resolver: zodResolver(cargarEvidenciaSchema) })

  const archivos = useWatch({ control, name: "archivo" })
  const archivoSeleccionado = archivos?.[0] ?? null

  const ultimoIntento = data?.intentos[data.intentos.length - 1] ?? null
  const yaAprobado = ultimoIntento?.estadoRevision === "aprobado"
  const enRevision = ultimoIntento?.estadoRevision === "pendiente"

  const onEliminar = async () => {
    if (!idEntregable) return
    try {
      await eliminarIntento.mutateAsync(idEntregable)
      toast.success("Entrega borrada. Ya puede volver a cargar el archivo.")
    } catch {
      toast.error("No se pudo borrar la entrega.")
    }
  }

  const onSubmit = async (values: CargarEvidenciaFormValues) => {
    if (!idEntregable) return
    try {
      await cargarEvidencia.mutateAsync({
        idEntregable,
        archivo: values.archivo[0],
        comentario: values.comentario,
      })
      toast.success("Evidencia enviada. Quedará pendiente de revisión.")
      reset()
      onOpenChange(false)
    } catch {
      toast.error("No se pudo enviar la evidencia.")
    }
  }

  return (
    <Dialog open={idEntregable !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detalle del entregable</DialogTitle>
        </DialogHeader>

        {isPending && (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {!isPending && data && (
          <div className="flex flex-col gap-4 text-sm">
            <div>
              <p className="text-base font-medium text-foreground">{data.titulo}</p>
              <p className="text-xs text-muted-foreground">Fase {data.faseNombre}</p>
            </div>

            <p className="text-foreground">{data.descripcion}</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Fecha prevista</p>
                <p className="text-foreground">{format(new Date(data.fechaPrevista), "d/MM/yyyy")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estado del compromiso</p>
                <Badge variant={ESTADO_ACTIVIDAD_BADGE[data.estadoActividad].variant}>
                  {ESTADO_ACTIVIDAD_BADGE[data.estadoActividad].label}
                </Badge>
              </div>
            </div>

            {data.intentos.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-foreground">
                  Historial de intentos ({data.intentos.length})
                </p>
                <ul className="flex flex-col gap-2">
                  {data.intentos.map((intento, i) => (
                    <li key={intento.idIntentoEntrega} className="rounded-md border border-border p-2">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground">Intento {i + 1}</span>
                        <Badge variant={ESTADO_REVISION_BADGE[intento.estadoRevision ?? "pendiente"].variant}>
                          {ESTADO_REVISION_BADGE[intento.estadoRevision ?? "pendiente"].label}
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
                        <p className="mt-1 text-xs text-foreground">
                          <span className="font-medium">Observación del coordinador: </span>
                          {intento.observaciones}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {yaAprobado ? (
              <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                Este entregable ya fue aprobado. No es necesario volver a entregarlo.
              </p>
            ) : enRevision ? (
              <div className="flex flex-col gap-2 rounded-md bg-muted px-3 py-2">
                <p className="text-xs text-muted-foreground">
                  Su entrega está pendiente de revisión. Si necesita corregir el archivo, puede
                  borrarla y volver a cargarla.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={onEliminar}
                  disabled={eliminarIntento.isPending}
                >
                  {eliminarIntento.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  Borrar entrega
                </Button>
              </div>
            ) : (
              <form className="flex flex-col gap-3 border-t border-border pt-4" onSubmit={handleSubmit(onSubmit)} noValidate>
                <p className="text-sm font-medium text-foreground">
                  {data.intentos.length > 0 ? "Volver a entregar" : "Entregar actividad"}
                </p>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="archivo">Archivo de evidencia</Label>
                  {archivoSeleccionado ? (
                    <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/50 px-3 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <FileUp className="size-4 shrink-0 text-primary-700" />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-foreground">
                            {archivoSeleccionado.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatearTamano(archivoSeleccionado.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label="Quitar archivo"
                        onClick={() => resetField("archivo")}
                        className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="archivo"
                      className="flex cursor-pointer flex-col items-center gap-1 rounded-md border border-dashed border-border px-3 py-5 text-center hover:border-primary-500 hover:bg-primary-700/5"
                    >
                      <FileUp className="size-5 text-muted-foreground" />
                      <span className="text-xs font-medium text-primary-700">Seleccionar archivo</span>
                      <span className="text-xs text-muted-foreground">
                        Documento, imagen o comprimido · máx. {TAMANO_MAXIMO_EVIDENCIA_MB} MB
                      </span>
                    </label>
                  )}
                  <input
                    id="archivo"
                    type="file"
                    accept={EXTENSIONES_EVIDENCIA_PERMITIDAS.join(",")}
                    className="sr-only"
                    {...register("archivo")}
                  />
                  {errors.archivo && (
                    <p className="text-xs text-destructive-700">{errors.archivo.message as string}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="comentario">Comentario (opcional)</Label>
                  <Textarea id="comentario" rows={2} {...register("comentario")} />
                </div>
                <Button type="submit" className="w-fit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  {isSubmitting ? "Subiendo evidencia..." : "Enviar entrega"}
                </Button>
              </form>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
