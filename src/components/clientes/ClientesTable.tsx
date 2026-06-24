'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCliente } from '@/actions/clientes';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2, EyeOff, RotateCcw } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ClienteEditModal } from './ClienteEditModal';
import { SearchInput } from '@/components/ui/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  initialClientes: any[];
  isAdmin?: boolean;
}

export function ClientesTable({ initialClientes, isAdmin = false }: Props) {
  const [clientes, setClientes] = useState<any[]>(initialClientes);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterTipo, setFilterTipo] = useState<'TODOS' | 'JURIDICA' | 'NATURAL'>('TODOS');

  const router = useRouter();

  useEffect(() => { setClientes(initialClientes); }, [initialClientes]);

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
      toast.success('Cliente eliminado permanentemente.');
      setClientes(prev => prev.filter(c => c.id !== deleteId));
      setDeleteId(null);
      setTimeout(() => router.refresh(), 300);
    } else {
      toast.error(result.error || 'No se pudo eliminar el cliente');
    }
    setIsDeleting(false);
  };

  const filteredClientes = clientes.filter(c => filterTipo === 'TODOS' || c.tipo_cliente === filterTipo);

  return (
    <TooltipProvider delayDuration={0}>
      {/* Barra: buscador + botón de desactivados */}
      <div className="flex items-center gap-2 mb-3">
        <SearchInput placeholder="Buscar por RUT o Razón Social..." />
        <Select value={filterTipo} onValueChange={(val: any) => setFilterTipo(val)}>
          <SelectTrigger className="w-[140px] bg-white h-10 shrink-0">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos</SelectItem>
            <SelectItem value="JURIDICA">Empresa</SelectItem>
            <SelectItem value="NATURAL">Natural</SelectItem>
          </SelectContent>
        </Select>

      </div>

      {/* Tabla principal */}
      <div className="bg-white rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Razón Social</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClientes.length > 0 ? (
              filteredClientes.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell>{cliente.razon_social}</TableCell>
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
                      {isAdmin && (
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
                      )}
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


    </TooltipProvider>
  );
}
