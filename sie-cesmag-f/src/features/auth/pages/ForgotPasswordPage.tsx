import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Link } from "react-router-dom"
import { Loader2, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthLayout } from "@/features/auth/components/AuthLayout"
import {
  solicitudRecuperacionSchema,
  type SolicitudRecuperacionFormValues,
} from "@/domain/auth/schemas"
import { useSolicitarRecuperacionMutation } from "@/domain/auth/queries"

/** Solicitud de enlace de restablecimiento de contraseña. */
export function ForgotPasswordPage() {
  const [enviado, setEnviado] = useState(false)
  const { mutateAsync, isPending } = useSolicitarRecuperacionMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SolicitudRecuperacionFormValues>({
    resolver: zodResolver(solicitudRecuperacionSchema),
  })

  const onSubmit = async (values: SolicitudRecuperacionFormValues) => {
    await mutateAsync(values)
    // No se revela si el correo existe o no, para no filtrar información de cuentas.
    setEnviado(true)
  }

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Recuperar acceso</CardTitle>
          <CardDescription>Le enviaremos un enlace para restablecer su contraseña.</CardDescription>
        </CardHeader>
        <CardContent>
          {enviado ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary-700/10 text-primary-700">
                <MailCheck className="size-5" />
              </span>
              <p className="text-sm text-foreground">
                Si el correo está registrado, recibirá un enlace de restablecimiento en unos
                minutos.
              </p>
              <Link to="/login" className="text-sm font-medium text-primary-700 hover:underline">
                Volver a iniciar sesión
              </Link>
            </div>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="correo">Correo registrado</Label>
                <Input
                  id="correo"
                  type="email"
                  autoComplete="email"
                  placeholder="nombre@unicesmag.edu.co"
                  aria-invalid={!!errors.correo}
                  {...register("correo")}
                />
                {errors.correo && (
                  <p className="text-xs text-destructive-700">{errors.correo.message}</p>
                )}
              </div>

              <Button type="submit" className="mt-2 w-full" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Enviando...
                  </>
                ) : (
                  "Enviar enlace de restablecimiento"
                )}
              </Button>

              <Link
                to="/login"
                className="text-center text-sm font-medium text-primary-700 hover:underline"
              >
                Volver a iniciar sesión
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
