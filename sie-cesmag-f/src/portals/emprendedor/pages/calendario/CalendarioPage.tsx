import { CalendarioAsesorias } from "@/components/shared/CalendarioAsesorias"
import { useMisAsesoriasQuery } from "@/domain/asesoria/queries"

/** Calendario de asesorías del emprendedor — se llega aquí desde el centro de notificaciones. */
export function CalendarioPage() {
  const { data, isPending } = useMisAsesoriasQuery()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-primary-900">Calendario</h1>
        <p className="text-sm text-muted-foreground">Vista mensual de sus asesorías programadas.</p>
      </div>

      <CalendarioAsesorias data={data} isPending={isPending} />
    </div>
  )
}
