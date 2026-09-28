import { useState } from "react"
import { AlertTriangle, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/shared/EmptyState"
import { ConfirmarEliminarDialog } from "@/components/shared/ConfirmarEliminarDialog"
import {
  useEliminarResponsableMutation,
  useEliminarRolMutation,
  useEliminarUsuarioMutation,
  useResponsablesPorEtapaQuery,
  useRolesQuery,
  useUsuariosQuery,
} from "@/domain/usuario/queries"
import { IDS_ROL_PROTEGIDO, MODULO_ADMIN_LABEL, NOMBRE_ROL_SIN_ROL } from "@/domain/usuario/display"
import type { Usuario } from "@/domain/usuario/types"
import { ETAPAS } from "@/domain/ruta/catalogo"
import { NuevoUsuarioDialog } from "@/portals/admin/pages/usuarios-roles/components/NuevoUsuarioDialog"
import { EditarUsuarioDialog } from "@/portals/admin/pages/usuarios-roles/components/EditarUsuarioDialog"
import { RolDialog } from "@/portals/admin/pages/usuarios-roles/components/RolDialog"
import { EliminarRolDialog } from "@/portals/admin/pages/usuarios-roles/components/EliminarRolDialog"
import { AsignarResponsableDialog } from "@/portals/admin/pages/usuarios-roles/components/AsignarResponsableDialog"
import { usePermiso } from "@/hooks/usePermiso"
import { useAuthStore } from "@/stores/auth-store"

/** Usuarios administrativos, roles/permisos y responsables por etapa. */
export function UsuariosRolesPage() {
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null)
  const usuarios = useUsuariosQuery()
  const roles = useRolesQuery()
  const responsables = useResponsablesPorEtapaQuery()
  const eliminarUsuario = useEliminarUsuarioMutation()
  const eliminarRol = useEliminarRolMutation()
  const eliminarResponsable = useEliminarResponsableMutation()
  const idUsuarioActual = useAuthStore((state) => state.sesion?.idUsuario)
  const puedeAnadir = usePermiso("usuarios-roles", "anadir")
  const puedeEditar = usePermiso("usuarios-roles", "editar")
  const puedeEliminar = usePermiso("usuarios-roles", "eliminar")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-primary-900">Usuarios y Roles</h1>
        <p className="text-sm text-muted-foreground">
          Usuarios administrativos, roles con sus permisos y responsables por etapa.
        </p>
      </div>

      <Tabs defaultValue="usuarios">
        <TabsList>
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          <TabsTrigger value="roles">Roles y permisos</TabsTrigger>
          <TabsTrigger value="responsables">Responsables por etapa</TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="flex flex-col gap-4">
          <div className="flex justify-end">
            {puedeAnadir && <NuevoUsuarioDialog />}
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Rol asignado</TableHead>
                  <TableHead>Estado</TableHead>
                  {puedeEliminar && <TableHead className="text-right">Acción</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.isPending &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: puedeEliminar ? 5 : 4 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}

                {!usuarios.isPending &&
                  usuarios.data?.map((usuario) => (
                    <TableRow
                      key={usuario.idUsuario}
                      className={puedeEditar ? "cursor-pointer" : ""}
                      onClick={() => puedeEditar && setUsuarioSeleccionado(usuario)}
                    >
                      <TableCell className="font-medium text-foreground">{usuario.nombre}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{usuario.correo}</TableCell>
                      <TableCell className="text-sm text-foreground">{usuario.rol?.nombre}</TableCell>
                      <TableCell>
                        <Badge variant={usuario.activo ? "default" : "secondary"}>
                          {usuario.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      {puedeEliminar && (
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          {String(usuario.idUsuario) !== idUsuarioActual &&
                            !IDS_ROL_PROTEGIDO.includes(usuario.idRol) && (
                              <ConfirmarEliminarDialog
                                titulo="Eliminar usuario"
                                descripcion={`¿Confirma eliminar a ${usuario.nombre} del sistema? Esta acción no se puede deshacer.`}
                                onConfirmar={() =>
                                  eliminarUsuario.mutate(usuario.idUsuario, {
                                    onSuccess: () => toast.success("Usuario eliminado."),
                                    onError: () => toast.error("No se pudo eliminar el usuario."),
                                  })
                                }
                                trigger={
                                  <button
                                    type="button"
                                    aria-label="Eliminar usuario"
                                    className="rounded p-1.5 text-destructive-700 hover:bg-destructive-700/10"
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                }
                              />
                            )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>

            {usuarios.isError && (
              <div className="p-6">
                <EmptyState icon={AlertTriangle} title="No se pudo cargar el listado de usuarios" />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="roles" className="flex flex-col gap-4">
          <div className="flex justify-end">
            {puedeAnadir && <RolDialog />}
          </div>

          {roles.isPending && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          )}

          {roles.isError && (
            <EmptyState icon={AlertTriangle} title="No se pudo cargar el listado de roles" />
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {roles.data?.map((rol) => {
              const modulosConAcceso = rol.permisos.filter((p) => p.acciones.length > 0)
              const rolProtegido =
                IDS_ROL_PROTEGIDO.includes(rol.idRol) || rol.nombre === NOMBRE_ROL_SIN_ROL
              return (
                <Card key={rol.idRol}>
                  <CardHeader className="flex flex-row items-start justify-between gap-2">
                    <div>
                      <CardTitle>{rol.nombre}</CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">{rol.descripcion}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {puedeEditar && !rolProtegido && <RolDialog rol={rol} />}
                      {puedeEliminar &&
                        (rolProtegido ? (
                          <span
                            className="rounded p-1.5 text-muted-foreground/40"
                            title="Este rol es base del sistema y no se puede eliminar ni editar"
                          >
                            <Trash2 className="size-4" />
                          </span>
                        ) : (
                          <EliminarRolDialog
                            rol={rol}
                            cantidadUsuarios={
                              usuarios.data?.filter((u) => u.idRol === rol.idRol).length ?? 0
                            }
                            rolesDisponibles={
                              roles.data?.filter(
                                (r) =>
                                  r.idRol !== rol.idRol &&
                                  r.ambito === rol.ambito &&
                                  r.nombre !== NOMBRE_ROL_SIN_ROL,
                              ) ?? []
                            }
                            rolSinRol={roles.data?.find(
                              (r) => r.nombre === NOMBRE_ROL_SIN_ROL && r.ambito === rol.ambito,
                            )}
                            isPending={eliminarRol.isPending}
                            onConfirmar={(idRolReemplazo) =>
                              eliminarRol.mutate(
                                { idRol: rol.idRol, idRolReemplazo },
                                {
                                  onSuccess: () => toast.success("Rol eliminado."),
                                  onError: () => toast.error("No se pudo eliminar el rol."),
                                },
                              )
                            }
                          />
                        ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {modulosConAcceso.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sin permisos asignados.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {modulosConAcceso.map((p) => (
                          <Badge key={p.modulo} variant="outline">
                            {MODULO_ADMIN_LABEL[p.modulo]} · {p.acciones.length}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="responsables">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responsables.isPending &&
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 3 }).map((__, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}

                  {!responsables.isPending &&
                    ETAPAS.map((etapa) => {
                      const asignacion = responsables.data?.find((r) => r.idEtapa === etapa.idEtapa)
                      return (
                        <TableRow key={etapa.idEtapa}>
                          <TableCell className="font-medium text-foreground">
                            Etapa {etapa.numero} · {etapa.nombre}
                          </TableCell>
                          <TableCell className="text-sm text-foreground">
                            {asignacion?.usuario ? (
                              asignacion.usuario.nombre
                            ) : (
                              <span className="text-muted-foreground">Sin responsable asignado</span>
                            )}
                          </TableCell>
                          <TableCell className="flex justify-end gap-1 text-right">
                            {puedeEditar ? (
                              <AsignarResponsableDialog
                                etapa={etapa}
                                idUsuarioActual={asignacion?.idUsuario ?? null}
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                            {puedeEliminar && asignacion?.usuario && (
                              <ConfirmarEliminarDialog
                                titulo="Quitar responsable"
                                descripcion={`¿Confirma quitar a ${asignacion.usuario.nombre} como responsable de la etapa ${etapa.numero}?`}
                                textoConfirmar="Quitar"
                                onConfirmar={() =>
                                  eliminarResponsable.mutate(etapa.idEtapa, {
                                    onSuccess: () => toast.success("Responsable de etapa eliminado."),
                                    onError: () => toast.error("No se pudo quitar el responsable."),
                                  })
                                }
                                trigger={
                                  <button
                                    type="button"
                                    aria-label="Quitar responsable"
                                    className="rounded p-1.5 text-destructive-700 hover:bg-destructive-700/10"
                                  >
                                    <Trash2 className="size-4" />
                                  </button>
                                }
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>

              {responsables.isError && (
                <div className="p-6">
                  <EmptyState icon={AlertTriangle} title="No se pudo cargar la asignación de responsables" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EditarUsuarioDialog
        usuario={usuarioSeleccionado}
        onOpenChange={(open) => !open && setUsuarioSeleccionado(null)}
      />
    </div>
  )
}
