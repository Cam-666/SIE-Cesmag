/** Minutos entre "HH:mm" y "HH:mm" — igual cálculo que hace el backend real a partir del bloque de agenda. */
export function duracionDeBloque(horaInicio: string, horaFin: string): number {
  const [hIni, mIni] = horaInicio.split(":").map(Number)
  const [hFin, mFin] = horaFin.split(":").map(Number)
  return hFin * 60 + mFin - (hIni * 60 + mIni)
}
