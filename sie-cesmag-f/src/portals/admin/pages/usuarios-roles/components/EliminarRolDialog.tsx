import { useState } from "react"
import { Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Rol } from "@/domain/usuario/types"

interface EliminarRolDialogProps {
  rol: Rol
  /** Cuántos usuarios tienen este rol asignado ahora mismo. */
  cantidadUsuarios: number
  /** Roles del mismo ámbito a los que se puede reasignar (excluye este rol y el reservado "Sin rol"). */
  rolesDisponibles: Rol[]
  /** El rol reservado "Sin rol" del mismo ámbito, si existe — habilita la opción "eliminar de todas formas". */
  rolSinRol: Rol | undefined
  isPending: boolean
  onConfirmar: (idRolReemplazo?: number) => void
}

/**
 * Eliminar un rol. `USUARIO.id_rol` no admite quedar vacío en la base de
 * datos, así que si el rol todavía tiene usuarios asignados hay dos
 * caminos: reasignarlos a otro rol real, o eliminar de todas formas, en
 * cuyo caso quedan reasignados al rol reservado "Sin rol" (sin ningún
 * permiso), con una confirmación aparte por ser más drástico.
 */
export function EliminarRolDialog({
  rol,
  cantidadUsuarios,
  rolesDisponibles,
  rolSinRol,
  isPending,
  onConfirmar,
}: EliminarRolDialogProps) {
  const [open, setOpen] = useState(false)
  const [idRolReemplazo, setIdRolReemplazo] = useState<string>("")
  const [confirmandoSinRol, setConfirmandoSinRol] = useState(false)

  const requiereReemplazo = cantidadUsuarios > 0
  const puedeConfirmar = !requiereReemplazo || idRolReemplazo !== ""

  const cerrarTodo = () => {
    setOpen(false)
    setIdRolReemplazo("")
    setConfirmandoSinRol(false)
  }

  const confirmar = () => {
    onConfirmar(requiereReemplazo ? Number(idRolReemplazo) : undefined)
    cerrarTodo()
  }

  const confirmarSinRol = () => {
    if (!rolSinRol) return
    onConfirmar(rolSinRol.idRol)
    cerrarTodo()
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => (v ? setOpen(true) : cerrarTodo())}>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          aria-label="Eliminar rol"
          className="rounded p-1.5 text-destructive-700 hover:bg-destructive-700/10"
        >
          <Trash2 className="size-4" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        {confirmandoSinRol ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar sin reasignar?</AlertDialogTitle>
              <AlertDialogDescription>
                {cantidadUsuarios} usuario{cantidadUsuarios === 1 ? "" : "s"} con el rol &quot;{rol.nombre}
                &quot; se quedar{cantidadUsuarios === 1 ? "á" : "án"} sin ningún permiso hasta que alguien
                le{cantidadUsuarios === 1 ? "" : "s"} asigne un rol nuevo. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setConfirmandoSinRol(false)}>
                Volver
              </Button>
              <Button variant="destructive" disabled={isPending} onClick={confirmarSinRol}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                Sí, eliminar de todas formas
              </Button>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar rol</AlertDialogTitle>
              <AlertDialogDescription>
                {requiereReemplazo
                  ? `"${rol.nombre}" tiene ${cantidadUsuarios} usuario${cantidadUsuarios === 1 ? "" : "s"} asignado${cantidadUsuarios === 1 ? "" : "s"}. Elija a qué rol se reasignarán antes de eliminarlo. Esta acción no se puede deshacer.`
                  : `¿Confirma eliminar el rol "${rol.nombre}"? Esta acción no se puede deshacer.`}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {requiereReemplazo && (
              <div className="flex flex-col gap-1.5 text-left">
                <Label htmlFor="idRolReemplazo">Reasignar usuarios al rol</Label>
                <Select value={idRolReemplazo} onValueChange={setIdRolReemplazo}>
                  <SelectTrigger id="idRolReemplazo" className="w-full">
                    <SelectValue placeholder="Seleccione un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {rolesDisponibles.map((r) => (
                      <SelectItem key={r.idRol} value={String(r.idRol)}>
                        {r.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {rolesDisponibles.length === 0 && (
                  <p className="text-xs text-destructive-700">
                    No hay otro rol del mismo ámbito al cual reasignar.
                  </p>
                )}
                {rolSinRol && (
                  <button
                    type="button"
                    className="mt-1 self-start text-xs font-medium text-destructive-700 hover:underline"
                    onClick={() => setConfirmandoSinRol(true)}
                  >
                    O elimine de todas formas, sin reasignar a un rol real
                  </button>
                )}
              </div>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <Button variant="destructive" disabled={!puedeConfirmar || isPending} onClick={confirmar}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                Eliminar
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
