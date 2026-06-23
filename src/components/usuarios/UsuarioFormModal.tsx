'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createUsuario } from '@/actions/usuarios';
import { Loader2 } from 'lucide-react';

export function UsuarioFormModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [rol, setRol] = useState('ADMIN');
  // Cargar clientes ya no es necesario ya que el rol CLIENTE no existe

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      nombre: formData.get('nombre'),
      email: formData.get('email'),
      password: formData.get('password'),
      rol: rol,
      cliente_id: null,
    };

    const result = await createUsuario(data);

    if (result.success) {
      setOpen(false);
      setRol('ADMIN');
    } else {
      if (result.error?.includes('Duplicate entry')) {
        setError('Ya existe un usuario con este correo electrónico.');
      } else {
        setError(result.error || 'Hubo un error al crear el usuario');
      }
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nuevo Usuario</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl">Crear Usuario</DialogTitle>
          <DialogDescription>
            Agrega un nuevo usuario y defínele sus permisos.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Rol de Acceso <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-2 h-10">
              <Button 
                type="button" 
                variant={rol === 'ADMIN' ? 'default' : 'outline'} 
                onClick={() => setRol('ADMIN')}
                className="w-full h-full"
              >
                Administrador
              </Button>
              <Button 
                type="button" 
                variant={rol === 'VENDEDOR' ? 'default' : 'outline'} 
                onClick={() => setRol('VENDEDOR')}
                className="w-full h-full"
              >
                Vendedor
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Nombre del Usuario <span className="text-red-500">*</span></label>
            <Input name="nombre" required placeholder="Ej: Juan Pérez" className="h-10" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Correo Electrónico <span className="text-red-500">*</span></label>
            <Input name="email" type="email" required placeholder="correo@empresa.cl" className="h-10" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Contraseña Temporal <span className="text-red-500">*</span></label>
            <Input name="password" type="password" required placeholder="********" className="h-10" minLength={6} />
          </div>



          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Usuario
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
