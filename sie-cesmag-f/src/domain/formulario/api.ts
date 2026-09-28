import { apiClient } from "@/lib/api-client"
import type {
  DecisionPrecandidatoPayload,
  DecisionPrecandidatoResultado,
  PrecandidatoListado,
} from "@/domain/formulario/types"

/** Precandidatos pendientes de aprobación. */
export async function listarPrecandidatos(): Promise<PrecandidatoListado[]> {
  const { data } = await apiClient.get<PrecandidatoListado[]>("/precandidatos")
  return data
}

/**
 * Al aprobar, el backend crea la cuenta de emprendedor (y su emprendimiento)
 * y envía el correo de activación; al rechazar, solo se marca la decisión,
 * sin crear cuenta.
 */
export async function decidirPrecandidato(
  payload: DecisionPrecandidatoPayload,
): Promise<DecisionPrecandidatoResultado> {
  const { data } = await apiClient.post<DecisionPrecandidatoResultado>(
    `/precandidatos/${payload.idFormulario}/decision`,
    payload,
  )
  return data
}
