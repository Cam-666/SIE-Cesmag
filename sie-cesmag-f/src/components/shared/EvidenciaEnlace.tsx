import { useState } from "react"
import { Download, ExternalLink, Loader2, Paperclip } from "lucide-react"
import { toast } from "sonner"
import { obtenerUrlEvidencia } from "@/domain/entregable/api"

interface EvidenciaEnlaceProps {
  idEntregable: number
  rutaEvidencia: string
  nombreArchivo: string
  className?: string
}

/**
 * Enlace a la evidencia de un intento de entrega, compartido entre la
 * revisión del coordinador y el historial del emprendedor. El archivo vive
 * en un bucket privado de Supabase Storage (`rutaEvidencia` es la ruta del
 * objeto, no una URL abrible directamente): se pide una URL firmada justo
 * al hacer clic, que vence a los pocos minutos. Los enlaces de datos de
 * ejemplo (URLs externas fijas) y los archivos de una sesión mock (`blob:`)
 * se abren directo, sin pasar por el backend.
 */
export function EvidenciaEnlace({
  idEntregable,
  rutaEvidencia,
  nombreArchivo,
  className = "",
}: EvidenciaEnlaceProps) {
  const [cargando, setCargando] = useState(false)
  const esArchivoDeLaSesion = rutaEvidencia.startsWith("blob:")
  const esEnlaceExterno = rutaEvidencia.startsWith("http:") || rutaEvidencia.startsWith("https:")

  if (esArchivoDeLaSesion || esEnlaceExterno) {
    return (
      <a
        href={rutaEvidencia}
        {...(esArchivoDeLaSesion ? { download: nombreArchivo } : { target: "_blank", rel: "noreferrer" })}
        className={`flex min-w-0 max-w-full items-center gap-1 font-medium text-primary-700 hover:underline ${className}`}
      >
        <Paperclip className="size-3 shrink-0" />
        <span className="min-w-0 truncate">{nombreArchivo}</span>
        {esArchivoDeLaSesion ? (
          <Download className="size-3 shrink-0" />
        ) : (
          <ExternalLink className="size-3 shrink-0" />
        )}
      </a>
    )
  }

  const abrir = async () => {
    setCargando(true)
    try {
      const url = await obtenerUrlEvidencia(idEntregable)
      window.open(url, "_blank", "noopener,noreferrer")
    } catch {
      toast.error("No se pudo abrir el archivo.")
    } finally {
      setCargando(false)
    }
  }

  return (
    <button
      type="button"
      onClick={abrir}
      disabled={cargando}
      className={`flex min-w-0 max-w-full items-center gap-1 font-medium text-primary-700 hover:underline disabled:opacity-60 ${className}`}
    >
      <Paperclip className="size-3 shrink-0" />
      <span className="min-w-0 truncate">{nombreArchivo}</span>
      {cargando ? (
        <Loader2 className="size-3 shrink-0 animate-spin" />
      ) : (
        <ExternalLink className="size-3 shrink-0" />
      )}
    </button>
  )
}
