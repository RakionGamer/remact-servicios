'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCliente, reactivarCliente, deleteClientePermanente } from '@/actions/clientes';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetHeader,
  SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2, EyeOff, RotateCcw } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ClienteEditModal } from './ClienteEditModal';
import { SearchInput } from '@/components/ui/search-input';

interface Props {
  initialClientes: any[];
  initialInactivos: any[];
}

type InactivoAction = { type: 'reactivar' | 'eliminar'; cliente: any } | null;

export function ClientesTable({ initialClientes, initialInactivos }: Props) {
  const [clientes, setClientes] = useState<any[]>(initialClientes);
  const [inactivos, setInactivos] = useState<any[]>(initialInactivos);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showInactivos, setShowInactivos] = useState(false);

  /** Acción pendiente sobre un inactivo: reactivar o eliminar permanente */
  const [inactivoAction, setInactivoAction] = useState<InactivoAction>(null);
  const [isInactivoLoading, setIsInactivoLoading] = useState(false);

  const router = useRouter();

  useEffect(() => { setClientes(initialClientes); }, [initialClientes]);
  useEffect(() => { setInactivos(initialInactivos); }, [initialInactivos]);

  /** Aplica el cambio de forma optimista antes de recibir respuesta del servidor */
  const handleOptimisticUpdate = (id: number, data: any) => {
    setClientes(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  /** Revierte al estado anterior si el servidor devuelve error */
  const handleRevert = (id: number, original: any) => {
    setClientes(prev => prev.map(c => c.id === id ? original : c));
  };

  /** Una vez cerrado el modal, sincroniza con el servidor silenciosamente */
  const handleSuccess = () => { setTimeout(() => router.refresh(), 300); };

  /* ── Eliminar activo ─────────────────────────────────────────────── */
  const handleConfirmDelete = async () => {
    if (deleteId === null) return;
    setIsDeleting(true);
    const result = await deleteCliente(deleteId);
    if (result.success) {
      if (result.deleted === 'hard') {
        toast.success('Cliente eliminado permanentemente.');
      } else {
        const clienteDesactivado = clientes.find(c => c.id === deleteId);
        if (clienteDesactivado) {
          setInactivos(prev => [{ ...clienteDesactivado, activo: 0 }, ...prev]);
        }
        toast.success('El cliente tiene presupuestos vinculados y fue desactivado.');
      }
      setClientes(prev => prev.filter(c => c.id !== deleteId));
      setDeleteId(null);
      setTimeout(() => router.refresh(), 300);
    } else {
      toast.error(result.error || 'No se pudo eliminar el cliente');
    }
    setIsDeleting(false);
  };

  /* ── Confirmar acción sobre inactivo ─────────────────────────────── */
  const handleConfirmInactivoAction = async () => {
    if (!inactivoAction) return;
    setIsInactivoLoading(true);
    const { type, cliente } = inactivoAction;

    if (type === 'reactivar') {
      const result = await reactivarCliente(cliente.id);
      if (result.success) {
        setInactivos(prev => prev.filter(c => c.id !== cliente.id));
        setClientes(prev => [{ ...cliente, activo: 1 }, ...prev]);
        toast.success(`"${cliente.razon_social}" fue reactivado.`);
        setTimeout(() => router.refresh(), 300);
      } else {
        toast.error(result.error || 'No se pudo reactivar el cliente');
      }
    } else {
      const result = await deleteClientePermanente(cliente.id);
      if (result.success) {
        setInactivos(prev => prev.filter(c => c.id !== cliente.id));
        toast.success(`"${cliente.razon_social}" y sus presupuestos fueron eliminados.`);
        setTimeout(() => router.refresh(), 300);
      } else {
        toast.error(result.error || 'No se pudo eliminar el cliente');
      }
    }

    setInactivoAction(null);
    setIsInactivoLoading(false);
  };

  return (
    <TooltipProvider delayDuration={0}>
      {/* Barra: buscador + botón de desactivados */}
      <div className="flex items-center gap-2 mb-3">
        <SearchInput placeholder="Buscar por RUT o Razón Social..." />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInactivos(true)}
              className="flex items-center gap-2 h-10 text-zinc-600 border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 shrink-0"
            >
              <EyeOff className="w-4 h-4" />
              <span>Desactivados</span>
              {inactivos.length > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center px-1.5 py-0 text-xs font-semibold bg-zinc-200 text-zinc-700 rounded-full min-w-[18px]">
                  {inactivos.length}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ver clientes desactivados</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Tabla principal */}
      <div className="bg-white rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Razón Social</TableHead>
              <TableHead>RUT</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.length > 0 ? (
              clientes.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell>{cliente.razon_social}</TableCell>
                  <TableCell>{cliente.identificador_fiscal}</TableCell>
                  <TableCell>
                    {cliente.tipo_cliente === 'JURIDICA' ? 'Empresa' :
                      cliente.tipo_cliente === 'NATURAL' ? 'Natural' :
                        cliente.tipo_cliente}
                  </TableCell>
                  <TableCell>{cliente.telefono || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-1">
                      <ClienteEditModal
                        cliente={cliente}
                        onOptimisticUpdate={handleOptimisticUpdate}
                        onRevert={handleRevert}
                        onSuccess={handleSuccess}
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => setDeleteId(cliente.id)}
                            className="px-2 text-zinc-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Eliminar cliente</p></TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No hay clientes registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Diálogo: confirmar eliminación de activo */}
        <Dialog open={deleteId !== null} onOpenChange={(open) => !open && !isDeleting && setDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setDeleteId(null)} disabled={isDeleting}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sheet lateral: clientes desactivados */}
      <Sheet open={showInactivos} onOpenChange={setShowInactivos}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-zinc-500" />
              Clientes desactivados
              {inactivos.length > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0 text-xs font-semibold bg-zinc-200 text-zinc-700 rounded-full min-w-[18px]">
                  {inactivos.length}
                </span>
              )}
            </SheetTitle>
            <SheetDescription>
              Clientes con presupuestos vinculados. Puedes reactivarlos o eliminarlos permanentemente junto con sus presupuestos.
            </SheetDescription>
          </SheetHeader>

          {inactivos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              No hay clientes desactivados.
            </p>
          ) : (
            <div className="space-y-2">
              {inactivos.map((cliente) => (
                <div
                  key={cliente.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-zinc-100 bg-zinc-50 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-800 truncate">{cliente.razon_social}</p>
                    <p className="text-xs text-zinc-500">{cliente.identificador_fiscal} · {cliente.tipo_cliente === 'JURIDICA' ? 'Empresa' : 'Natural'}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => setInactivoAction({ type: 'reactivar', cliente })}
                          className="px-2 text-zinc-500 hover:text-emerald-700 hover:bg-emerald-50"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Reactivar cliente</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => setInactivoAction({ type: 'eliminar', cliente })}
                          className="px-2 text-zinc-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Eliminar permanentemente</p></TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Diálogo: confirmar acción sobre inactivo */}
      <Dialog
        open={inactivoAction !== null}
        onOpenChange={(open) => !open && !isInactivoLoading && setInactivoAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {inactivoAction?.type === 'reactivar' ? 'Reactivar cliente' : 'Eliminar permanentemente'}
            </DialogTitle>
            <DialogDescription>
              {inactivoAction?.type === 'reactivar'
                ? <>¿Deseas reactivar a <strong>{inactivoAction.cliente.razon_social}</strong>? Volverá a aparecer en la lista de clientes activos.</>
                : <>¿Deseas eliminar permanentemente a <strong>{inactivoAction?.cliente.razon_social}</strong>? Se eliminarán también <strong>todos sus presupuestos</strong>. Esta acción no se puede deshacer.</>
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setInactivoAction(null)}
              disabled={isInactivoLoading}
            >
              Cancelar
            </Button>
            {inactivoAction?.type === 'reactivar' ? (
              <Button
                onClick={handleConfirmInactivoAction}
                disabled={isInactivoLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isInactivoLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                Reactivar
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={handleConfirmInactivoAction}
                disabled={isInactivoLoading}
              >
                {isInactivoLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Eliminar todo
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
