import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Banknote,
  Building2,
  GraduationCap,
  Lightbulb,
  ListChecks,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react"
import { CARACTERIZACION_GRUPOS } from "@/domain/emprendimiento/display"
import type { CaracterizacionEmprendimiento } from "@/domain/emprendimiento/types"

const ICONO_GRUPO: Record<string, LucideIcon> = {
  "Perfil del estudiante": GraduationCap,
  "Caracterización del emprendimiento": Building2,
  "Validación y tracción": TrendingUp,
  "Madurez financiera": Banknote,
  "Estructura y operación": Users,
  "Innovación y escalabilidad": Lightbulb,
  "Necesidades estratégicas": ListChecks,
}

function CamposGrupo({ campos, datos }: { campos: typeof CARACTERIZACION_GRUPOS[number]["campos"]; datos: CaracterizacionEmprendimiento }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {campos.map(({ campo, label }) => (
        <div key={campo}>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm text-foreground">{datos[campo] ?? "—"}</p>
        </div>
      ))}
    </div>
  )
}

interface CaracterizacionInfoProps {
  datos: CaracterizacionEmprendimiento
  /** "plano": todos los bloques visibles a la vez (revisión de precandidato/admin). "acordeon": colapsables, más ordenado para una lectura pausada. */
  variante?: "plano" | "acordeon"
}

/**
 * Vista de solo lectura de la caracterización del emprendimiento (documento
 * CARACTERIZACION_EMPRENDIMIENTOS), agrupada por bloque del formulario.
 * Compartida entre "Información adicional" (detalle del emprendimiento),
 * "Mi emprendimiento" (portal del emprendedor) y la revisión de un
 * precandidato antes de aprobarlo.
 */
export function CaracterizacionInfo({ datos, variante = "plano" }: CaracterizacionInfoProps) {
  if (variante === "acordeon") {
    return (
      <Accordion type="multiple" defaultValue={["Caracterización del emprendimiento"]}>
        {CARACTERIZACION_GRUPOS.map((grupo) => {
          const Icono = ICONO_GRUPO[grupo.titulo]
          return (
            <AccordionItem key={grupo.titulo} value={grupo.titulo}>
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  {Icono && <Icono className="size-4 text-primary-700" />}
                  {grupo.titulo}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <CamposGrupo campos={grupo.campos} datos={datos} />
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {CARACTERIZACION_GRUPOS.map((grupo) => (
        <div key={grupo.titulo}>
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {grupo.titulo}
          </p>
          <CamposGrupo campos={grupo.campos} datos={datos} />
        </div>
      ))}
    </div>
  )
}
