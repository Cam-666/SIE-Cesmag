import { useNavigate, useSearchParams } from "react-router-dom"
import { CalendarioAsesorias } from "@/components/shared/CalendarioAsesorias"
import { useMisAsesoriasComoAsesorQuery } from "@/domain/asesoria/queries"
import { useEntregablesComoResponsableQuery } from "@/domain/entregable/queries"

/**
 * Calendario personal del usuario administrativo autenticado: sus propias
 * asesorías como asesor, y los entregables de las etapas donde es
 * responsable — nunca lo de todo el equipo (eso ya lo cubren "Asesorías" y
 * "Entregables", según permisos). Se llega aquí desde "Mi perfil" o desde
 * el centro de notificaciones.
 */
export function CalendarioPage() {
  const { data, isPending } = useMisAsesoriasComoAsesorQuery()
  const entregables = useEntregablesComoResponsableQuery()
  const [searchParams] = useSearchParams()
  const idAsesoria = searchParams.get("idAsesoria")
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-primary-900">Mi calendario</h1>
        <p className="text-sm text-muted-foreground">
          Vista mensual de sus propias asesorías como asesor y entregables donde es responsable.
        </p>
      </div>

      <CalendarioAsesorias
        data={data}
        isPending={isPending}
        mostrarEmprendimiento
        idAsesoriaEnfocada={idAsesoria ? Number(idAsesoria) : null}
        entregables={entregables.data}
        onVerEntregable={(idEntregable) => navigate(`/admin/entregables?idEntregable=${idEntregable}`)}
      />
    </div>
  )
}
