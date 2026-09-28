import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  agregarIntegrante,
  cambiarEstadoEmprendimiento,
  crearEmprendimiento,
  editarCaracterizacion,
  editarIntegrante,
  eliminarIntegrante,
  listarEmprendimientos,
  obtenerEmprendimiento,
  obtenerMiEmprendimiento,
  registrarDiagnosticoInicial,
  registrarReingreso,
} from "@/domain/emprendimiento/api"
import type { FiltrosEmprendimientos } from "@/domain/emprendimiento/types"

export function useEmprendimientosQuery(filtros: FiltrosEmprendimientos) {
  return useQuery({
    queryKey: ["emprendimientos", filtros],
    queryFn: () => listarEmprendimientos(filtros),
    placeholderData: (data) => data,
  })
}

export function useEmprendimientoQuery(idEmprendimiento: number | undefined) {
  return useQuery({
    queryKey: ["emprendimientos", idEmprendimiento],
    queryFn: () => obtenerEmprendimiento(idEmprendimiento as number),
    enabled: idEmprendimiento !== undefined,
  })
}

/** Emprendimiento del emprendedor autenticado (solo lectura). */
export function useMiEmprendimientoQuery() {
  return useQuery({ queryKey: ["mi-emprendimiento"], queryFn: obtenerMiEmprendimiento })
}

/** Crea un emprendimiento directamente desde el panel admin. */
export function useCrearEmprendimientoMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: crearEmprendimiento,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["emprendimientos"] }),
  })
}

function useInvalidarEmprendimiento(idEmprendimiento: number) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ["emprendimientos", idEmprendimiento] })
}

/** Agrega un integrante al emprendimiento. */
export function useAgregarIntegranteMutation(idEmprendimiento: number) {
  const invalidar = useInvalidarEmprendimiento(idEmprendimiento)
  return useMutation({
    mutationFn: (numeroIdentificacion: string) =>
      agregarIntegrante(idEmprendimiento, numeroIdentificacion),
    onSuccess: invalidar,
  })
}

/** Corrige el nombre de un integrante. */
export function useEditarIntegranteMutation(idEmprendimiento: number) {
  const invalidar = useInvalidarEmprendimiento(idEmprendimiento)
  return useMutation({
    mutationFn: ({ idUsuario, nombre }: { idUsuario: string; nombre: string }) =>
      editarIntegrante(idEmprendimiento, idUsuario, nombre),
    onSuccess: invalidar,
  })
}

/** Quita un integrante del emprendimiento. */
export function useEliminarIntegranteMutation(idEmprendimiento: number) {
  const invalidar = useInvalidarEmprendimiento(idEmprendimiento)
  return useMutation({
    mutationFn: (idUsuario: string) => eliminarIntegrante(idEmprendimiento, idUsuario),
    onSuccess: invalidar,
  })
}

/** Cambia el estado del emprendimiento. */
export function useCambiarEstadoMutation(idEmprendimiento: number) {
  const invalidar = useInvalidarEmprendimiento(idEmprendimiento)
  return useMutation({
    mutationFn: cambiarEstadoEmprendimiento,
    onSuccess: invalidar,
  })
}

/** Registra el reingreso de un emprendimiento inactivo. */
export function useRegistrarReingresoMutation(idEmprendimiento: number) {
  const invalidar = useInvalidarEmprendimiento(idEmprendimiento)
  return useMutation({
    mutationFn: registrarReingreso,
    onSuccess: invalidar,
  })
}

/** Registra el diagnóstico inicial y la etapa de ingreso. */
export function useRegistrarDiagnosticoInicialMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: registrarDiagnosticoInicial,
    // Invalida tanto el detalle (idEmprendimiento) como el listado general,
    // que también debe reflejar la nueva etapa/fase de ingreso.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["emprendimientos"] }),
  })
}

/** Edita la caracterización del negocio. */
export function useEditarCaracterizacionMutation(idEmprendimiento: number) {
  const invalidar = useInvalidarEmprendimiento(idEmprendimiento)
  return useMutation({
    mutationFn: (payload: Parameters<typeof editarCaracterizacion>[1]) =>
      editarCaracterizacion(idEmprendimiento, payload),
    onSuccess: invalidar,
  })
}
