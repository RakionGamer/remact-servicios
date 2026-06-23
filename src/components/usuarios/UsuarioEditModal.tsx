'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateUsuario } from '@/actions/usuarios';
import { Loader2, Pencil } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface UsuarioEditModalProps {
  usuario: any;
  onOptimisticUpdate: (id: number, data: any) => void;
  onRevert: (id: number, original: any) => void;
  onSuccess: () => void;
}

export function UsuarioEditModal({ usuario, onOptimisticUpdate, onRevert, onSuccess }: UsuarioEditModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Inputs controlados
  const [nombreValue, setNombreValue] = useState(usuario.nombre || '');
  const [emailValue, setEmailValue] = useState(usuario.email || '');
  const [rol, setRol] = useState(usuario.rol || 'ADMIN');

  const handleOpen = () => {
    // Sincronizar estado local con los props al abrir
    setNombreValue(usuario.nombre || '');
    setEmailValue(usuario.email || '');
    setRol(usuario.rol || 'ADMIN');
    setError('');
    setOpen(true);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const newData = {
      nombre: nombreValue,
      email: emailValue,
      password: formData.get('password'),
      rol,
      cliente_id: null,
    };

    const optimisticData = {
      nombre: newData.nombre,
      email: newData.email,
      rol: newData.rol,
      cliente_id: null,
      cliente_nombre: null,
    };

    // 1. Aplicar el cambio optimistamente y cerrar el modal de inmediato
    onOptimisticUpdate(usuario.id, optimisticData);
    setOpen(false);

    // 2. Llamar al servidor en segundo plano
    const result = await updateUsuario(usuario.id, newData);

    if (result.success) {
      // 3a. Éxito: sincronizar con el servidor silenciosamente
      onSuccess();
      setLoading(false);
    } else {
      // 3b. Error: revertir y reabrir el modal con el error
      onRevert(usuario.id, usuario);
      if (result.error?.includes('Duplicate entry')) {
        setError('Ya existe otro usuario con este correo electrónico.');
      } else {
        setError(result.error || 'Hubo un error al actualizar el usuario');
      }
      setOpen(true);
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setOpen(false); }}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" onClick={handleOpen} className="px-2 text-zinc-500 hover:text-zinc-800">
              <Pencil className="w-4 h-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Editar usuario</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-[500px] p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl">Editar Usuario</DialogTitle>
          <DialogDescription>
            Modifica la información o permisos. Deja la contraseña en blanco para no alterarla.
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
            <Input
              name="nombre"
              value={nombreValue}
              onChange={(e) => setNombreValue(e.target.value)}
              required
              placeholder="Ej: Juan Pérez"
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Correo Electrónico <span className="text-red-500">*</span></label>
            <Input
              name="email"
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
              type="email"
              required
              placeholder="correo@empresa.cl"
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Nueva Contraseña</label>
            <Input name="password" type="password" placeholder="Opcional. Dejar en blanco para mantener la actual." className="h-10" minLength={6} />
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
              Actualizar Usuario
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
