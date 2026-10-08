import { useNavigate, useSearchParams } from "react-router-dom"
import { CalendarioAsesorias } from "@/components/shared/CalendarioAsesorias"
import { useMisAsesoriasQuery } from "@/domain/asesoria/queries"
import { useMisEntregablesQuery } from "@/domain/entregable/queries"

/** Calendario del emprendedor: sus asesorías y entregables — se llega aquí desde "Mi perfil" o el centro de notificaciones. */
export function CalendarioPage() {
  const { data, isPending } = useMisAsesoriasQuery()
  const entregables = useMisEntregablesQuery()
  const [searchParams] = useSearchParams()
  const idAsesoria = searchParams.get("idAsesoria")
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-primary-900">Calendario</h1>
        <p className="text-sm text-muted-foreground">Vista mensual de sus asesorías y entregables.</p>
      </div>

      <CalendarioAsesorias
        data={data}
        isPending={isPending}
        idAsesoriaEnfocada={idAsesoria ? Number(idAsesoria) : null}
        entregables={entregables.data}
        onVerEntregable={(idEntregable) => navigate(`/emprendedor/mis-entregables?idEntregable=${idEntregable}`)}
      />
    </div>
  )
}
