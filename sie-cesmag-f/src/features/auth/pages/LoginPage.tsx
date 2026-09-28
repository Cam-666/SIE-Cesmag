import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthLayout } from "@/features/auth/components/AuthLayout"
import { credencialesSchema, type CredencialesFormValues } from "@/domain/auth/schemas"
import { useIniciarSesionMutation } from "@/domain/auth/queries"
import { rutaPortal } from "@/domain/auth/rutas"

/** Acceso al sistema según el rol de cada usuario. */
export function LoginPage() {
  const navigate = useNavigate()
  const [mostrarContrasena, setMostrarContrasena] = useState(false)
  const { mutateAsync, isPending } = useIniciarSesionMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CredencialesFormValues>({
    resolver: zodResolver(credencialesSchema),
  })

  const onSubmit = async (values: CredencialesFormValues) => {
    try {
      const sesion = await mutateAsync(values)
      navigate(rutaPortal(sesion.ambito), { replace: true })
    } catch {
      toast.error("Correo o contraseña incorrectos.")
    }
  }

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Iniciar sesión</CardTitle>
          <CardDescription>Acceda a su cuenta para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="correo">Correo institucional</Label>
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

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="contrasena">Contraseña</Label>
                <Link
                  to="/recuperar-password"
                  className="text-xs font-medium text-primary-700 hover:underline"
                >
                  ¿Olvidó su contraseña?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="contrasena"
                  type={mostrarContrasena ? "text" : "password"}
                  autoComplete="current-password"
                  aria-invalid={!!errors.contrasena}
                  className="pr-9"
                  {...register("contrasena")}
                />
                <button
                  type="button"
                  onClick={() => setMostrarContrasena((v) => !v)}
                  className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                  aria-label={mostrarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {mostrarContrasena ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.contrasena && (
                <p className="text-xs text-destructive-700">{errors.contrasena.message}</p>
              )}
            </div>

            <Button type="submit" className="mt-2 w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Iniciando sesión...
                </>
              ) : (
                "Iniciar sesión →"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
