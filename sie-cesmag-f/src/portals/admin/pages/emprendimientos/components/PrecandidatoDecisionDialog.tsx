import { useState } from "react"
import { format } from "date-fns"
import { Check, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useDecidirPrecandidatoMutation } from "@/domain/formulario/queries"
import type { PrecandidatoListado } from "@/domain/formulario/types"
import { usePermiso } from "@/hooks/usePermiso"
import { CaracterizacionInfo } from "@/components/shared/CaracterizacionInfo"

interface PrecandidatoDecisionDialogProps {
  precandidato: PrecandidatoListado | null
  onOpenChange: (open: boolean) => void
}

/** Revisar un precandidato y aprobarlo (crea la cuenta) o rechazarlo. */
export function PrecandidatoDecisionDialog({
  precandidato,
  onOpenChange,
}: PrecandidatoDecisionDialogProps) {
  const [confirmando, setConfirmando] = useState<"aprobado" | "rechazado" | null>(null)
  const decidir = useDecidirPrecandidatoMutation()
  const puedeDecidir = usePermiso("emprendimientos", "anadir")

  const onDecidir = async (decision: "aprobado" | "rechazado") => {
    if (!precandidato) return
    try {
      await decidir.mutateAsync({ idFormulario: precandidato.idFormulario, decision })
      toast.success(
        decision === "aprobado"
          ? "Precandidato aprobado. Se creó su cuenta y el emprendimiento."
          : "Precandidato marcado como no aceptado.",
      )
      setConfirmando(null)
      onOpenChange(false)
    } catch {
      toast.error("No se pudo registrar la decisión.")
    }
  }

  return (
    <Dialog open={precandidato !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {precandidato && (
          <>
            <DialogHeader>
              <DialogTitle>Revisión de precandidato</DialogTitle>
            </DialogHeader>

            <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Nombre</p>
                  <p className="font-medium text-foreground">{precandidato.nombre}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Correo</p>
                  <p className="font-medium text-foreground">{precandidato.correo}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Número de identificación</p>
                  <p className="font-medium text-foreground">{precandidato.numeroIdentificacion}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fecha de respuesta</p>
                  <p className="font-medium text-foreground">
                    {format(new Date(precandidato.fechaRespuesta), "d/MM/yyyy")}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Emprendimiento propuesto</p>
                <p className="font-medium text-foreground">
                  {precandidato.nombreEmprendimientoPropuesto ?? "—"}
                </p>
              </div>

              <div className="border-t border-border pt-4">
                <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Respuestas del formulario de caracterización
                </p>
                <CaracterizacionInfo datos={precandidato.caracterizacion} />
              </div>

              {confirmando ? (
                <div className="rounded-lg bg-muted px-3 py-3">
                  <p className="mb-3 text-sm text-foreground">
                    {confirmando === "aprobado"
                      ? "¿Confirma la aprobación? Se creará la cuenta de emprendedor y la persona definirá su contraseña desde el enlace de acceso."
                      : "¿Confirma el rechazo? El precandidato quedará marcado como no aceptado, sin crear cuenta."}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant={confirmando === "aprobado" ? "default" : "destructive"}
                      disabled={decidir.isPending}
                      onClick={() => onDecidir(confirmando)}
                    >
                      {decidir.isPending && <Loader2 className="size-4 animate-spin" />}
                      Sí, confirmar
                    </Button>
                    <Button variant="outline" onClick={() => setConfirmando(null)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : puedeDecidir ? (
                <div className="flex gap-2 border-t border-border pt-4">
                  <Button className="flex-1" onClick={() => setConfirmando("aprobado")}>
                    <Check className="size-4" />
                    Aprobar
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setConfirmando("rechazado")}
                  >
                    <X className="size-4" />
                    Rechazar
                  </Button>
                </div>
              ) : (
                <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                  No tiene permiso para aprobar o rechazar precandidatos.
                </p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
