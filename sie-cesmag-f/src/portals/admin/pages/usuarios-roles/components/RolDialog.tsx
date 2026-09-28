import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Loader2, Pencil, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Textarea } from "@/components/ui/textarea"
import { rolSchema, type RolFormValues } from "@/domain/usuario/schemas"
import { useGuardarRolMutation } from "@/domain/usuario/queries"
import {
  ACCION_PERMISO_LABEL,
  ACCIONES_DISPONIBLES_POR_MODULO,
  ACCIONES_PERMISO,
  MODULOS_ADMIN,
  MODULO_ADMIN_LABEL,
} from "@/domain/usuario/display"
import type { AccionPermiso, ModuloAdmin, PermisoModulo, Rol } from "@/domain/usuario/types"

function permisosVacios(): PermisoModulo[] {
  return MODULOS_ADMIN.map((modulo) => ({ modulo, acciones: [] }))
}

// Descarta acciones que el módulo no admite (p. ej. "editar" en Dashboard),
// por si el rol trae datos heredados de una versión anterior de la matriz.
function normalizarPermisos(permisos: PermisoModulo[]): PermisoModulo[] {
  return permisos.map((p) => ({
    ...p,
    acciones: p.acciones.filter((a) => ACCIONES_DISPONIBLES_POR_MODULO[p.modulo].includes(a)),
  }))
}

interface RolDialogProps {
  /** Si se provee, el diálogo edita ese rol; si no, crea uno nuevo. */
  rol?: Rol
}

/** Nombre, descripción y permisos (ver/editar/eliminar/añadir) por módulo. */
export function RolDialog({ rol }: RolDialogProps) {
  const [open, setOpen] = useState(false)
  const [permisos, setPermisos] = useState<PermisoModulo[]>(
    rol ? normalizarPermisos(rol.permisos) : permisosVacios(),
  )
  const guardarRol = useGuardarRolMutation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RolFormValues>({
    resolver: zodResolver(rolSchema),
    defaultValues: { nombre: rol?.nombre ?? "", descripcion: rol?.descripcion ?? "" },
  })

  const alAbrirCambiar = (siguienteAbierto: boolean) => {
    setOpen(siguienteAbierto)
    if (siguienteAbierto) {
      reset({ nombre: rol?.nombre ?? "", descripcion: rol?.descripcion ?? "" })
      setPermisos(rol ? normalizarPermisos(rol.permisos) : permisosVacios())
    }
  }

  const tienePermiso = (modulo: ModuloAdmin, accion: AccionPermiso) =>
    permisos.find((p) => p.modulo === modulo)?.acciones.includes(accion) ?? false

  const alternarPermiso = (modulo: ModuloAdmin, accion: AccionPermiso, marcado: boolean) => {
    setPermisos((actual) =>
      actual.map((p) =>
        p.modulo === modulo
          ? { ...p, acciones: marcado ? [...p.acciones, accion] : p.acciones.filter((a) => a !== accion) }
          : p,
      ),
    )
  }

  const onSubmit = async (values: RolFormValues) => {
    try {
      await guardarRol.mutateAsync({ idRol: rol?.idRol, nombre: values.nombre, descripcion: values.descripcion, permisos })
      toast.success(rol ? "Rol actualizado." : "Rol creado.")
      setOpen(false)
    } catch {
      toast.error("No se pudo guardar el rol.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={alAbrirCambiar}>
      <DialogTrigger asChild>
        {rol ? (
          <Button variant="outline" size="sm">
            <Pencil className="size-4" />
            Editar
          </Button>
        ) : (
          <Button>
            <Plus className="size-4" />
            Nuevo rol
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{rol ? "Editar rol" : "Nuevo rol"}</DialogTitle>
          <DialogDescription>
            Defina el rol y los permisos por módulo (ver, editar, eliminar, añadir) aplicables a
            todos los emprendimientos.
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nombre">Nombre del rol</Label>
              <Input id="nombre" {...register("nombre")} />
              {errors.nombre && <p className="text-xs text-destructive-700">{errors.nombre.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea id="descripcion" rows={1} {...register("descripcion")} />
              {errors.descripcion && (
                <p className="text-xs text-destructive-700">{errors.descripcion.message}</p>
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Permisos por módulo</p>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Módulo</th>
                    {ACCIONES_PERMISO.map((accion) => (
                      <th key={accion} className="px-3 py-2 text-center font-medium text-muted-foreground">
                        {ACCION_PERMISO_LABEL[accion]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MODULOS_ADMIN.map((modulo) => (
                    <tr key={modulo} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 text-foreground">{MODULO_ADMIN_LABEL[modulo]}</td>
                      {ACCIONES_PERMISO.map((accion) => {
                        const aplica = ACCIONES_DISPONIBLES_POR_MODULO[modulo].includes(accion)
                        return (
                          <td key={accion} className="px-3 py-2 text-center">
                            {aplica ? (
                              <Checkbox
                                checked={tienePermiso(modulo, accion)}
                                onCheckedChange={(v) => alternarPermiso(modulo, accion, v === true)}
                                aria-label={`${MODULO_ADMIN_LABEL[modulo]} · ${ACCION_PERMISO_LABEL[accion]}`}
                              />
                            ) : (
                              <span className="text-muted-foreground" aria-hidden="true">
                                —
                              </span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              "—" indica que la acción no aplica a ese módulo (p. ej. Dashboard y Reportes son de
              solo lectura, y solo Asesorías tiene una acción de eliminar real).
            </p>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={guardarRol.isPending}>
              {guardarRol.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
