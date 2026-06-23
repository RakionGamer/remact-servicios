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
      <div className="bg-white rounded-md border shadow-sm">
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

      <Dialog open={deleteId !== null} onOpenChange={(open) => !open && !isDeleting && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setDeleteId(null)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
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
