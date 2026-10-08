import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm, useWatch } from "react-hook-form"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { nuevoEntregableSchema, type NuevoEntregableFormValues } from "@/domain/entregable/schemas"
import { useCrearEntregableMutation } from "@/domain/entregable/queries"
import { useEmprendimientoQuery, useEmprendimientosQuery } from "@/domain/emprendimiento/queries"
import { ETAPAS, FASES } from "@/domain/ruta/catalogo"

/** Registrar un entregable asignado a un emprendimiento y fase. */
export function NuevoEntregableDialog() {
  const [open, setOpen] = useState(false)
  const crearEntregable = useCrearEntregableMutation()
  const emprendimientos = useEmprendimientosQuery({})

  const {
    register,
    control,
    handleSubmit,
    reset,
    resetField,
    formState: { errors },
  } = useForm<NuevoEntregableFormValues>({
    resolver: zodResolver(nuevoEntregableSchema),
    // Sin valores iniciales, Zod reporta "expected string, received undefined" en vez del mensaje en español de cada campo.
    defaultValues: { idEmprendimiento: "", idFase: "", titulo: "", descripcion: "", fechaPrevista: "" },
  })

  const idEmprendimientoSeleccionado = useWatch({ control, name: "idEmprendimiento" })
  const detalle = useEmprendimientoQuery(
    idEmprendimientoSeleccionado ? Number(idEmprendimientoSeleccionado) : undefined,
  )
  // Una fase ya completada no admite más entregables — se descarta del
  // selector para no repetir el error de "Nuevo entregable" ofreciendo una
  // fase que el emprendimiento ya superó.
  const idsFaseCompletada = new Set(
    detalle.data?.ruta.flatMap((etapa) => etapa.fases).filter((f) => f.estadoFase === "completada")
      .map((f) => f.idFase) ?? [],
  )
  // Si el emprendimiento entró en una etapa avanzada, las anteriores igual
  // existen en su ruta (quedan "pendiente" para que se vea completa) pero
  // nunca se van a cursar — tampoco se ofrecen aquí.
  const numeroEtapaIngreso = ETAPAS.find((e) => e.idEtapa === detalle.data?.idEtapaIngreso)?.numero
  const fasesDisponibles = FASES.filter((f) => {
    if (idsFaseCompletada.has(f.idFase)) return false
    if (numeroEtapaIngreso === undefined) return true
    const numeroEtapaFase = ETAPAS.find((e) => e.idEtapa === f.idEtapa)?.numero ?? 0
    return numeroEtapaFase >= numeroEtapaIngreso
  })

  // Cambiar de emprendimiento invalida la fase que ya estuviera elegida (las
  // fases completadas difieren de uno a otro).
  useEffect(() => {
    resetField("idFase", { defaultValue: "" })
  }, [idEmprendimientoSeleccionado, resetField])

  const onSubmit = async (values: NuevoEntregableFormValues) => {
    try {
      await crearEntregable.mutateAsync({
        idEmprendimiento: Number(values.idEmprendimiento),
        idFase: Number(values.idFase),
        titulo: values.titulo,
        descripcion: values.descripcion,
        fechaPrevista: values.fechaPrevista,
      })
      toast.success("Entregable registrado.")
      reset()
      setOpen(false)
    } catch {
      toast.error("No se pudo registrar el entregable.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Nuevo entregable
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo entregable</DialogTitle>
          <DialogDescription>
            Registre la actividad o entregable que debe realizar el emprendedor.
          </DialogDescription>
        </DialogHeader>

        <form className="grid grid-cols-2 gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="idEmprendimiento">Emprendimiento</Label>
            <Controller
              control={control}
              name="idEmprendimiento"
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger id="idEmprendimiento" className="w-full">
                    <SelectValue placeholder="Seleccione un emprendimiento" />
                  </SelectTrigger>
                  <SelectContent>
                    {emprendimientos.data?.map((e) => (
                      <SelectItem key={e.idEmprendimiento} value={String(e.idEmprendimiento)}>
                        {e.nombreReferencia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.idEmprendimiento && (
              <p className="text-xs text-destructive-700">{errors.idEmprendimiento.message}</p>
            )}
          </div>

          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="idFase">Fase</Label>
            <Controller
              control={control}
              name="idFase"
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  disabled={!idEmprendimientoSeleccionado}
                >
                  <SelectTrigger id="idFase" className="w-full">
                    <SelectValue placeholder="Seleccione primero un emprendimiento" />
                  </SelectTrigger>
                  <SelectContent>
                    {fasesDisponibles.map((fase) => (
                      <SelectItem key={fase.idFase} value={String(fase.idFase)}>
                        {fase.numero}. {fase.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.idFase && <p className="text-xs text-destructive-700">{errors.idFase.message}</p>}
            {idEmprendimientoSeleccionado && fasesDisponibles.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Este emprendimiento ya completó todas las fases de la ruta.
              </p>
            )}
          </div>

          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="titulo">Título</Label>
            <Input id="titulo" {...register("titulo")} />
            {errors.titulo && <p className="text-xs text-destructive-700">{errors.titulo.message}</p>}
          </div>

          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea id="descripcion" rows={2} {...register("descripcion")} />
            {errors.descripcion && (
              <p className="text-xs text-destructive-700">{errors.descripcion.message}</p>
            )}
          </div>

          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="fechaPrevista">Fecha prevista</Label>
            <Input id="fechaPrevista" type="date" {...register("fechaPrevista")} />
            {errors.fechaPrevista && (
              <p className="text-xs text-destructive-700">{errors.fechaPrevista.message}</p>
            )}
          </div>

          <DialogFooter className="col-span-2">
            <Button type="submit" disabled={crearEntregable.isPending}>
              {crearEntregable.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
