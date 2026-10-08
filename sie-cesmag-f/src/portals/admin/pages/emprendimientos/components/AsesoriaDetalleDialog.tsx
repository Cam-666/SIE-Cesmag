import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Check, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { AsesoriaHistorialItem } from "@/domain/asesoria/types"
import { fechaAsesoriaComoLocal } from "@/lib/fecha-asesoria"

interface AsesoriaDetalleDialogProps {
  asesoria: AsesoriaHistorialItem | null
  onOpenChange: (open: boolean) => void
  nombreEmprendimiento: string
}

/** Detalle de una asesoría del historial (solo lectura). */
export function AsesoriaDetalleDialog({
  asesoria,
  onOpenChange,
  nombreEmprendimiento,
}: AsesoriaDetalleDialogProps) {
  return (
    <Dialog open={asesoria !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {asesoria && (
          <>
            <DialogHeader>
              <DialogTitle>Detalle de asesoría</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Emprendimiento</p>
                <p className="font-medium text-foreground">{nombreEmprendimiento}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
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
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Resumen de la asesoría</p>
                <p className="text-foreground">{asesoria.avance ?? "Sin observaciones registradas."}</p>
              </div>
              <div>
                <p className="mb-2 text-xs text-muted-foreground">Actividades asignadas</p>
                <ul className="flex flex-col gap-2">
                  {asesoria.actividades.map((actividad, i) => (
                    <li key={i} className="flex items-start justify-between gap-3 text-foreground">
                      <span>
                        {actividad.descripcion}{" "}
                        <span className="text-muted-foreground">({actividad.responsable})</span>
                      </span>
                      <Badge variant={actividad.cumplido ? "default" : "outline"} className="shrink-0">
                        {actividad.cumplido ? (
                          <Check className="size-3" />
                        ) : (
                          <X className="size-3" />
                        )}
                        {actividad.cumplido ? "Cumplido" : "Pendiente"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
