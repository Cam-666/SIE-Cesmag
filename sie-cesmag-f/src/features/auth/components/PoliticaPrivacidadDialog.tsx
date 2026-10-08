import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

/**
 * Aviso de privacidad (RNF-05): resumen breve de cómo se tratan los datos
 * personales de estudiantes y egresados registrados en el SIE, conforme a la
 * Ley 1581 de 2012. El formulario de caracterización de Google Forms debe
 * llevar el mismo aviso en su propia portada — eso se administra aparte,
 * directamente en el formulario.
 */
export function PoliticaPrivacidadDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="underline decoration-white/40 underline-offset-2 hover:decoration-white">
          Política de tratamiento de datos
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tratamiento de datos personales</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>
            La Universidad CESMAG, a través de la Coordinación de Emprendimiento, recolecta y trata los
            datos personales registrados en esta plataforma (datos de identificación, contacto e
            información del proceso de acompañamiento) conforme a la Ley 1581 de 2012 y sus decretos
            reglamentarios sobre protección de datos personales en Colombia.
          </p>
          <p>
            Esta información se usa exclusivamente para gestionar el acompañamiento a emprendimientos y
            proyectos de innovación de la Unidad, y no se comparte con terceros ajenos a este proceso.
          </p>
          <p>
            Como titular de sus datos, puede solicitar en cualquier momento a la Coordinación de
            Emprendimiento el acceso, la corrección o la eliminación de su información.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
