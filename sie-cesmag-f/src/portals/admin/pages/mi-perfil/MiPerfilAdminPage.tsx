import { AlertTriangle, CalendarDays, ChevronRight } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { useMiPerfilAdminQuery } from "@/domain/usuario/queries"
import { EditarPerfilAdminDialog } from "@/portals/admin/pages/mi-perfil/components/EditarPerfilAdminDialog"

function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")
}

/** Consulta y edición de los datos personales del usuario administrativo autenticado. */
export function MiPerfilAdminPage() {
  const { data, isPending, isError } = useMiPerfilAdminQuery()
  const navigate = useNavigate()

  if (isPending) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No se pudo cargar su perfil"
        description="Intente nuevamente en unos momentos."
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-primary-900">Mi perfil</h1>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-700 text-lg font-semibold text-white">
            {iniciales(data.nombre)}
          </span>
          <div>
            <p className="text-base font-semibold text-foreground">{data.nombre}</p>
            <p className="text-sm text-muted-foreground">{data.rol?.nombre} · Universidad CESMAG</p>
          </div>
        </CardContent>
      </Card>

      <button
        type="button"
        onClick={() => navigate("/admin/calendario")}
        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-left shadow-xs ring-1 ring-foreground/10 transition-colors hover:bg-muted"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-700/10 text-primary-700">
            <CalendarDays className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">Mi calendario</p>
            <p className="text-xs text-muted-foreground">Vista mensual de sus propias asesorías como asesor.</p>
          </div>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </button>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Información personal</CardTitle>
          <EditarPerfilAdminDialog perfil={data} />
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Nombre completo</p>
            <p className="text-sm text-foreground">{data.nombre}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Correo institucional</p>
            <p className="text-sm text-foreground">{data.correo}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Rol</p>
            <p className="text-sm text-foreground">{data.rol?.nombre}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Estado</p>
            <Badge variant={data.activo ? "default" : "secondary"}>
              {data.activo ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-muted-foreground">Teléfono</p>
            <p className="text-sm text-foreground">{data.telefono || "—"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
