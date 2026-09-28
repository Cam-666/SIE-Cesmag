import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { CircleCheck, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthLayout } from "@/features/auth/components/AuthLayout"
import { restablecimientoSchema, type RestablecimientoFormValues } from "@/domain/auth/schemas"
import { useRestablecerContrasenaMutation } from "@/domain/auth/queries"

/** Definición de la nueva contraseña desde el enlace recibido. */
export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const navigate = useNavigate()
  const [completado, setCompletado] = useState(false)
  const { mutateAsync, isPending } = useRestablecerContrasenaMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RestablecimientoFormValues>({
    resolver: zodResolver(restablecimientoSchema),
  })

  const onSubmit = async (values: RestablecimientoFormValues) => {
    if (!token) return
    try {
      await mutateAsync({ token, nuevaContrasena: values.nuevaContrasena })
      setCompletado(true)
    } catch {
      toast.error("El enlace de restablecimiento no es válido o expiró.")
    }
  }

  if (!token) {
    return (
      <AuthLayout>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Enlace no válido</CardTitle>
            <CardDescription>
              El enlace de restablecimiento es incorrecto o ya expiró.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              to="/recuperar-password"
              className="text-sm font-medium text-primary-700 hover:underline"
            >
              Solicitar un nuevo enlace
            </Link>
          </CardContent>
        </Card>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Restablecer contraseña</CardTitle>
          <CardDescription>Defina su nueva contraseña de acceso.</CardDescription>
        </CardHeader>
        <CardContent>
          {completado ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary-700/10 text-primary-700">
                <CircleCheck className="size-5" />
              </span>
              <p className="text-sm text-foreground">Su contraseña se actualizó correctamente.</p>
              <Button onClick={() => navigate("/login", { replace: true })} className="w-full">
                Iniciar sesión
              </Button>
            </div>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="nuevaContrasena">Nueva contraseña</Label>
                <Input
                  id="nuevaContrasena"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={!!errors.nuevaContrasena}
                  {...register("nuevaContrasena")}
                />
                {errors.nuevaContrasena && (
                  <p className="text-xs text-destructive-700">{errors.nuevaContrasena.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirmarContrasena">Confirmar contraseña</Label>
                <Input
                  id="confirmarContrasena"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={!!errors.confirmarContrasena}
                  {...register("confirmarContrasena")}
                />
                {errors.confirmarContrasena && (
                  <p className="text-xs text-destructive-700">
                    {errors.confirmarContrasena.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="mt-2 w-full" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Guardando...
                  </>
                ) : (
                  "Guardar nueva contraseña"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
