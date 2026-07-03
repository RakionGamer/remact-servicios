'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { deleteUsuario } from '@/actions/usuarios';
import { UsuarioEditModal } from './UsuarioEditModal';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function UsuariosTable({ initialUsuarios }: { initialUsuarios: any[] }) {
  const [usuarios, setUsuarios] = useState<any[]>(initialUsuarios);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  /** Aplica el cambio de edición de forma optimista */
  const handleOptimisticUpdate = (id: number, data: any) => {
    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
  };

  /** Revierte al estado anterior si el servidor devuelve error */
  const handleRevert = (id: number, original: any) => {
    setUsuarios(prev => prev.map(u => u.id === id ? original : u));
  };

  /** Sincroniza con el servidor silenciosamente después del cierre del modal */
  const handleSuccess = () => {
    setTimeout(() => router.refresh(), 300);
  };


  const handleConfirmDelete = async () => {
    if (deleteId === null) return;
    setIsDeleting(true);
    const result = await deleteUsuario(deleteId);
    if (result.success) {
      toast.success('Usuario eliminado correctamente');
      setUsuarios(prev => prev.filter(u => u.id !== deleteId));
      setDeleteId(null);
      setTimeout(() => router.refresh(), 300);
    } else {
      toast.error(result.error || 'No se pudo eliminar el usuario');
    }
    setIsDeleting(false);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="space-y-4">
        {/* Vista Móvil (Tarjetas) */}
        <div className="md:hidden space-y-4">
          {usuarios.length > 0 ? (
            usuarios.map((usuario) => (
              <div key={usuario.id} className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="text-xs text-zinc-500 font-medium">#{usuario.id}</div>
                    <div className="font-bold text-base text-zinc-900 leading-tight">{usuario.nombre}</div>
                    <div className="text-sm text-zinc-500">{usuario.email}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={
                      usuario.rol === 'ADMIN'
                        ? 'inline-flex items-center rounded-md bg-zinc-900 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm dark:bg-zinc-50 dark:text-zinc-900'
                        : 'inline-flex items-center rounded-md bg-blue-600 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm'
                    }>
                      {usuario.rol === 'ADMIN' ? 'Administrador' : 'Vendedor'}
                    </span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-zinc-100 flex justify-end items-center">
                  <div className="flex items-center gap-1 bg-zinc-50 rounded-lg p-1 border border-zinc-100">
                    <UsuarioEditModal
                      usuario={usuario}
                      onOptimisticUpdate={handleOptimisticUpdate}
                      onRevert={handleRevert}
                      onSuccess={handleSuccess}
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(usuario.id)} className="h-8 w-8 p-0 text-zinc-500 hover:text-red-600 hover:bg-red-100">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Eliminar usuario</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl border p-8 text-center text-muted-foreground shadow-sm">
              No hay usuarios registrados.
            </div>
          )}
        </div>

        {/* Vista Desktop (Tabla) */}
        <div className="hidden md:block bg-white rounded-md border shadow-sm">
          <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usuarios.length > 0 ? (
            usuarios.map((usuario) => (
              <TableRow key={usuario.id}>
                <TableCell className="font-medium">{usuario.id}</TableCell>
                <TableCell>{usuario.nombre}</TableCell>
                <TableCell>{usuario.email}</TableCell>
                <TableCell>
                  <span className={
                    usuario.rol === 'ADMIN'
                      ? 'inline-flex items-center rounded-md bg-zinc-900 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm dark:bg-zinc-50 dark:text-zinc-900'
                      : 'inline-flex items-center rounded-md bg-blue-600 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm'
                  }>
                    {usuario.rol === 'ADMIN' ? 'Administrador' : 'Vendedor'}
                  </span>
                </TableCell>
                <TableCell className="text-right flex justify-end gap-2">
                  <UsuarioEditModal
                    usuario={usuario}
                    onOptimisticUpdate={handleOptimisticUpdate}
                    onRevert={handleRevert}
                    onSuccess={handleSuccess}
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(usuario.id)} className="px-2 text-zinc-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Eliminar usuario</p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                No hay usuarios registrados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>

      <Dialog open={deleteId !== null} onOpenChange={(open) => !open && !isDeleting && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-3 sm:gap-2 mt-4 sm:mt-0 w-full">
            <Button type="button" variant="outline" onClick={() => setDeleteId(null)} disabled={isDeleting} className="flex-1 sm:flex-none h-11 sm:h-10">
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting} className="flex-1 sm:flex-none h-11 sm:h-10">
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}
