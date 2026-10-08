import { useState, type KeyboardEvent } from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

interface TagsInputProps {
  id?: string
  /** Igual que el resto de campos de caracterización: varios valores como texto separado por comas. */
  value: string | null | undefined
  onChange: (value: string | null) => void
  placeholder?: string
}

/**
 * Selección múltiple de valores de texto libre (no hay un catálogo fijo de
 * opciones: las respuestas vienen del formulario de Google, texto exacto de
 * cada casilla). Escriba y presione Enter o coma para agregar cada valor.
 */
export function TagsInput({ id, value, onChange, placeholder }: TagsInputProps) {
  const [borrador, setBorrador] = useState("")
  const valores = value ? value.split(",").map((v) => v.trim()).filter(Boolean) : []

  const agregar = (texto: string) => {
    const limpio = texto.trim()
    if (!limpio || valores.includes(limpio)) return
    onChange([...valores, limpio].join(", "))
  }

  const quitar = (texto: string) => {
    const restantes = valores.filter((v) => v !== texto)
    onChange(restantes.length ? restantes.join(", ") : null)
  }

  const alPresionarTecla = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      agregar(borrador)
      setBorrador("")
    } else if (e.key === "Backspace" && borrador === "" && valores.length > 0) {
      quitar(valores[valores.length - 1])
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {valores.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {valores.map((v) => (
            <Badge key={v} variant="outline" className="gap-1 py-1">
              {v}
              <button
                type="button"
                onClick={() => quitar(v)}
                aria-label={`Quitar ${v}`}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <Input
        id={id}
        value={borrador}
        onChange={(e) => setBorrador(e.target.value)}
        onKeyDown={alPresionarTecla}
        onBlur={() => {
          if (borrador.trim()) {
            agregar(borrador)
            setBorrador("")
          }
        }}
        placeholder={placeholder ?? "Escriba un valor y presione Enter"}
      />
    </div>
  )
}
