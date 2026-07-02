'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, BriefcaseBusiness } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData);

    if (result.success) {
      router.push('/dashboard');
    } else {
      toast.error(result.error || 'Ocurrió un error');
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 relative">

      {/* Logo Esquina Izquierda */}
      <div className="absolute top-4 left-4 lg:top-4 lg:left-6 z-20">
        <Image
          src="/remact-logo.webp"
          alt="Remact Logo"
          width={120}
          height={40}
          className="object-contain"
          priority
        />
      </div>

      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 w-full min-h-screen lg:min-h-0 relative">
        {/* Decoración sutil de fondo */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-200/50 via-zinc-50 to-zinc-50 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-950 -z-10"></div>

        <div className="w-full max-w-[420px] space-y-8 relative z-10 mt-12 lg:mt-0">

          <div className="flex flex-col space-y-2 text-center lg:text-left">
            <h1 className="text-3xl text-center font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Bienvenido de nuevo
            </h1>
            <p className="text-sm text-center text-muted-foreground">
              Ingresa tus credenciales administrativas para acceder al sistema.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 sm:p-10 rounded-2xl shadow-xl shadow-zinc-200/50 dark:shadow-none border border-zinc-100 dark:border-zinc-800 transition-all">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-semibold text-zinc-900 dark:text-zinc-200 leading-none">
                    Correo electrónico
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="admin@remact.cl"
                    className="h-11 bg-zinc-50/50 dark:bg-zinc-950/50 transition-colors focus-visible:bg-white dark:focus-visible:bg-zinc-900"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-semibold text-zinc-900 dark:text-zinc-200 leading-none">
                      Contraseña
                    </label>
                    <a href="#" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
                      ¿Olvidaste tu clave?
                    </a>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    className="h-11 bg-zinc-50/50 dark:bg-zinc-950/50 transition-colors focus-visible:bg-white dark:focus-visible:bg-zinc-900"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-medium shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  'Ingresar al Panel'
                )}
              </Button>
            </form>
          </div>
          {/*}
          <p className="px-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Al continuar, aceptas nuestros{" "}
            <a href="#" className="underline underline-offset-4 hover:text-zinc-900 dark:hover:text-white transition-colors">
              Términos de servicio
            </a>{" "}
            y{" "}
            <a href="#" className="underline underline-offset-4 hover:text-zinc-900 dark:hover:text-white transition-colors">
              Políticas de privacidad
            </a>.
          </p>¨*/}
        </div>
      </div>
    </div>
  );
}
