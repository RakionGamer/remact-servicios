'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Trash2, Loader2 } from 'lucide-react';
import { ServicioEditModal } from './ServicioEditModal';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { deleteServicio } from '@/actions/servicios';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function ServiciosTable({
  initialServicios,
  searchElement,
  headerAction
}: {
  initialServicios: any[];
  searchElement?: React.ReactNode;
  headerAction?: React.ReactNode;
}) {
  const [servicios, setServicios] = useState<any[]>(initialServicios);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>('all');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setServicios(initialServicios);
    setCurrentPage(1); // Reset page on data change
  }, [initialServicios]);

  /** Aplica el cambio de forma optimista antes de recibir respuesta del servidor */
  const handleOptimisticUpdate = (id: number, data: any) => {
    setServicios(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  };

  /** Revierte al estado anterior si el servidor devuelve error */
  const handleRevert = (id: number, original: any) => {
    setServicios(prev => prev.map(s => s.id === id ? original : s));
  };

  /** Una vez cerrado el modal, sincroniza con el servidor silenciosamente */
  const handleSuccess = () => {
    setTimeout(() => router.refresh(), 300);
  };

  const handleConfirmDelete = async () => {
    if (deleteId === null) return;
    setIsDeleting(true);
    const result = await deleteServicio(deleteId);
    if (result.success) {
      toast.success('Servicio eliminado correctamente');
      setServicios(prev => prev.filter(s => s.id !== deleteId));
      setDeleteId(null);
      setTimeout(() => router.refresh(), 300);
    } else {
      toast.error(result.error || 'No se pudo eliminar el servicio');
    }
    setIsDeleting(false);
  };

  const totalItems = servicios.length;
  const isAll = pageSize === 'all';
  const totalPages = isAll ? 1 : Math.ceil(totalItems / (pageSize as number));
  const startIndex = isAll ? 0 : (currentPage - 1) * (pageSize as number);
  const endIndex = isAll ? totalItems : startIndex + (pageSize as number);
  const currentServicios = servicios.slice(startIndex, endIndex);

  const handlePageSizeChange = (val: string) => {
    if (val === 'all') {
      setPageSize('all');
    } else {
      setPageSize(Number(val));
    }
    setCurrentPage(1);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-4 justify-between w-full sm:w-auto sm:justify-start">
              <h1 className="text-2xl font-bold tracking-tight">Catálogo de Servicios</h1>
              <div className="flex sm:hidden items-center space-x-2 text-sm text-muted-foreground">
                <span className="hidden sm:inline">Mostrar</span>
                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={pageSize.toString()} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="all">Todos</SelectItem>
                  </SelectContent>
                </Select>
                <span className="hidden sm:inline">registros</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-end">
            {headerAction}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
          <div className="w-full sm:w-[300px]">
            {searchElement}
          </div>
          
          <div className="hidden sm:flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span className="hidden sm:inline">Mostrar</span>
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder={pageSize.toString()} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
              <span className="hidden sm:inline">registros</span>
            </div>
          </div>
        </div>

      {/* Vista Móvil (Tarjetas) */}
      <div className="md:hidden space-y-4 mt-4">
        {currentServicios.length > 0 ? (
          currentServicios.map((servicio: any) => (
            <div key={servicio.id} className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5 space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-zinc-500 font-medium">#{servicio.id}</div>
                  <div className="font-bold text-base text-zinc-900 leading-tight">{servicio.item}</div>
                </div>
                <div className="shrink-0 text-right">
                    {servicio.caracteristica ? (
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                        servicio.caracteristica === 'Particular'
                          ? 'bg-red-600 text-white dark:bg-red-500'
                          : 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                      }`}>
                        {servicio.caracteristica}
                      </span>
                    ) : '-'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-zinc-500 text-xs block mb-0.5">Zona</span>
                  <span className="font-medium text-zinc-800">{servicio.zona || '-'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-xs block mb-0.5">Unidad</span>
                  <span className="px-2 py-1 rounded-md text-[10px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">{servicio.unidad_medida}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-zinc-100 flex justify-between items-center">
                <div className="font-bold text-emerald-700 text-lg">
                  {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(servicio.valor_unitario)}
                </div>
                <div className="flex items-center gap-1 bg-zinc-50 rounded-lg p-1 border border-zinc-100">
                  <ServicioEditModal
                    servicio={servicio}
                    onOptimisticUpdate={handleOptimisticUpdate}
                    onRevert={handleRevert}
                    onSuccess={handleSuccess}
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(servicio.id)} className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Eliminar servicio</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl border p-8 text-center text-muted-foreground shadow-sm">
            No hay servicios registrados en el catálogo.
          </div>
        )}
      </div>

      {/* Vista Desktop (Tabla) */}
      <div className="hidden md:block bg-white rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Ítem / Servicio</TableHead>
              <TableHead>Característica</TableHead>
              <TableHead>Zona</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead className="text-right">Valor Unitario</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentServicios.length > 0 ? (
              currentServicios.map((servicio) => (
                <TableRow key={servicio.id}>
                  <TableCell className="font-medium text-muted-foreground">{servicio.id}</TableCell>
                  <TableCell className="font-medium">{servicio.item}</TableCell>
                  <TableCell>
                    {servicio.caracteristica ? (
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                        servicio.caracteristica === 'Particular'
                          ? 'bg-red-600 text-white dark:bg-red-500'
                          : 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                      }`}>
                        {servicio.caracteristica}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>{servicio.zona || '-'}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-md text-xs font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                      {servicio.unidad_medida}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium text-emerald-700">
                    {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(servicio.valor_unitario)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-1">
                      <ServicioEditModal
                        servicio={servicio}
                        onOptimisticUpdate={handleOptimisticUpdate}
                        onRevert={handleRevert}
                        onSuccess={handleSuccess}
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteId(servicio.id)} className="px-2 text-zinc-500 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Eliminar servicio</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No hay servicios registrados en el catálogo.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end px-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center text-sm font-medium">
            Página {currentPage} de {totalPages || 1}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage <= 1}
            >
              <span className="sr-only">Anterior</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage >= totalPages || isAll}
            >
              <span className="sr-only">Siguiente</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={deleteId !== null} onOpenChange={(open) => !open && !isDeleting && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este servicio del catálogo? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-3 sm:gap-2 mt-4 sm:mt-0 w-full">
            <Button size="lg" type="button" variant="outline" onClick={() => setDeleteId(null)} disabled={isDeleting} className="flex-1 sm:flex-none">
              Cancelar
            </Button>
            <Button size="lg" type="button" variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting} className="flex-1 sm:flex-none">
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
