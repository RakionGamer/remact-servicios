"use client"

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PresupuestoDeleteButton } from '@/components/presupuestos/PresupuestoDeleteButton';
import { Pencil, ChevronLeft, ChevronRight, Eye, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { io as ClientIO } from 'socket.io-client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from "react-day-picker";
import { deletePresupuesto, duplicatePresupuesto } from '@/actions/presupuestos';
import { toast } from 'sonner';
import { Loader2, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function PresupuestosTable({
  initialPresupuestos,
  searchElement,
  headerAction
}: {
  initialPresupuestos: any[];
  searchElement?: React.ReactNode;
  headerAction?: React.ReactNode;
}) {
  const [presupuestos, setPresupuestos] = useState<any[]>(initialPresupuestos);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(10);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState<number | null>(null);
  const [socket, setSocket] = useState<any>(null);
  const router = useRouter();

  // Date filter initialized from 1st of month to today
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: firstDayOfMonth,
    to: today,
  });

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'APROBADO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Aprobado
          </span>
        );
      case 'RECHAZADO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Rechazado
          </span>
        );
      case 'EN_REVISION':
      case 'SOLICITADO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            Solicitud Histórica
          </span>
        );
      case 'ESPERANDO_APROBACION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            En Autorización
          </span>
        );
      case 'ACEPTADO_CLIENTE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Aceptado por Cliente
          </span>
        );
      default: // BORRADOR
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 border border-zinc-300">
            Pre-venta Borrador
          </span>
        );
    }
  };

  useEffect(() => {
    setPresupuestos(initialPresupuestos);
    setCurrentPage(1);
  }, [initialPresupuestos]);

  useEffect(() => {
    const socketInstance = ClientIO(process.env.NEXT_PUBLIC_SITE_URL || undefined, {
      path: '/api/socket/io',
      addTrailingSlash: false,
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      socketInstance.emit('join-room', 'presupuestos-list');
    });

    socketInstance.on('presupuesto-updated-broadcast', (data: any) => {
      if (data?.action === 'list_updated') {
        router.refresh();
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [router]);

  const handlePageSizeChange = (val: string) => {
    if (val === 'all') {
      setPageSize('all');
    } else {
      setPageSize(Number(val));
    }
    setCurrentPage(1);
  };

  // Filter by date
  const filteredPresupuestos = presupuestos.filter(p => {
    if (!dateRange?.from) return true;
    if (!p.fecha_emision) return true;
    const isoStr = new Date(p.fecha_emision).toISOString();
    const dateStr = isoStr.split('T')[0];
    const [year, month, day] = dateStr.split('-');
    const pDate = new Date(Number(year), Number(month) - 1, Number(day));
    pDate.setHours(0, 0, 0, 0);

    const fromDate = new Date(dateRange.from);
    fromDate.setHours(0, 0, 0, 0);

    if (dateRange.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      return pDate >= fromDate && pDate <= toDate;
    }
    return pDate >= fromDate;
  });

  const totalItems = filteredPresupuestos.length;
  const isAll = pageSize === 'all';
  const totalPages = isAll ? 1 : Math.ceil(totalItems / (pageSize as number));
  const startIndex = isAll ? 0 : (currentPage - 1) * (pageSize as number);
  const endIndex = isAll ? totalItems : startIndex + (pageSize as number);
  const currentPresupuestos = filteredPresupuestos.slice(startIndex, endIndex);

  const formatDate = (dateValue: any) => {
    if (!dateValue) return '';
    const isoStr = new Date(dateValue).toISOString();
    const dateStr = isoStr.split('T')[0];
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  };

  const handleConfirmDelete = async () => {
    if (deleteId === null) return;
    setIsDeleting(true);
    const result = await deletePresupuesto(deleteId);
    if (!result.success) {
      toast.error(result.error || 'Ocurrió un error al eliminar el presupuesto.');
    } else {
      toast.success('Presupuesto eliminado correctamente.');
      // Dejamos que el revalidatePath recargue los datos, pero cerramos el modal
      setDeleteId(null);
    }
    setIsDeleting(false);
  };

  const handleDuplicate = async (id: number) => {
    setIsDuplicating(id);
    const result = await duplicatePresupuesto(id);
    if (!result.success) {
      toast.error(result.error || 'Ocurrió un error al duplicar el presupuesto.');
    } else {
      toast.success('Presupuesto duplicado correctamente.');
      if (socket) {
        socket.emit('presupuesto-updated', { roomId: 'presupuestos-list', action: 'list_updated' });
      }
    }
    setIsDuplicating(null);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Presupuestos</h1>
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
        </div>
        {headerAction}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div className="w-full sm:w-[300px]">
          {searchElement}
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 w-full sm:w-auto">
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

      <div className="bg-white rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N°</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentPresupuestos.length > 0 ? (
              currentPresupuestos.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-muted-foreground">#{p.id}</TableCell>
                  <TableCell>{formatDate(p.fecha_emision)}</TableCell>
                  <TableCell className="font-medium">{p.cliente_nombre}</TableCell>
                  <TableCell>{p.motivo_servicio || <span className="text-zinc-400 italic">No especificado</span>}</TableCell>
                  <TableCell>
                    {getStatusBadge(p.estado || 'BORRADOR')}
                  </TableCell>
                  <TableCell className="text-right font-medium text-emerald-700">
                    {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(p.total)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" asChild className="px-2 text-zinc-500 hover:text-blue-600 hover:bg-blue-50">
                            <Link href={`/dashboard/presupuestos/${p.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ver detalle</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="px-2 text-zinc-500 hover:text-amber-600 hover:bg-amber-50"
                            onClick={() => handleDuplicate(p.id)}
                            disabled={isDuplicating === p.id}
                          >
                            {isDuplicating === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Duplicar presupuesto</p>
                        </TooltipContent>
                      </Tooltip>

                      {(!p.estado || p.estado === 'BORRADOR' || p.estado === 'RECHAZADO' || p.estado === 'SOLICITADO' || p.estado === 'EN_REVISION') && (
                        <>


                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2"
                                onClick={() => setDeleteId(p.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Eliminar presupuesto</p>
                            </TooltipContent>
                          </Tooltip>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No hay presupuestos para estos filtros.
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar Presupuesto</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el presupuesto #{deleteId}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
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
