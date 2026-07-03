'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { updatePresupuestoEstado, duplicatePresupuesto } from '@/actions/presupuestos';
import { Loader2, CheckCircle2, XCircle, Send, Edit, Clock, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { io as ClientIO } from 'socket.io-client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  presupuestoId: number;
  estado: string;
  userRole?: string;
}

export function PresupuestoActions({ presupuestoId, estado, userRole }: Props) {
  const [loading, setLoading] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const router = useRouter();

  const handleAction = async () => {
    if (!confirmAction) return;
    setLoading(true);
    const nuevoEstado = confirmAction as any;
    const res = await updatePresupuestoEstado(presupuestoId, nuevoEstado);
    if (res.success) {
      let mensajeExito = 'Estado actualizado correctamente';
      if (nuevoEstado === 'EN_REVISION') mensajeExito = 'Enviado a revisión del cliente exitosamente';
      if (nuevoEstado === 'ESPERANDO_APROBACION') mensajeExito = 'Solicitud de aprobación enviada al administrador';
      if (nuevoEstado === 'APROBADO') mensajeExito = 'El presupuesto ha sido aprobado';
      if (nuevoEstado === 'RECHAZADO') mensajeExito = 'El presupuesto ha sido rechazado';

      toast.success(mensajeExito);
      const socket = ClientIO(process.env.NEXT_PUBLIC_SITE_URL || undefined, {
        path: '/api/socket/io',
        addTrailingSlash: false,
        transports: ['websocket'],
      });
      socket.on('connect', () => {
        socket.emit('presupuesto-updated', { roomId: `presupuesto-${presupuestoId}`, action: 'state_changed' });
        setTimeout(() => {
          socket.disconnect();
          router.refresh();
          setLoading(false);
        }, 100);
      });
    } else {
      toast.error('Error al actualizar el estado: ' + res.error);
      setLoading(false);
    }
    setConfirmAction(null);
  };

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    const result = await duplicatePresupuesto(presupuestoId);
    if (!result.success) {
      toast.error(result.error || 'Ocurrió un error al duplicar el presupuesto.');
    } else {
      toast.success('Presupuesto duplicado correctamente.');
      const socket = ClientIO(process.env.NEXT_PUBLIC_SITE_URL || undefined, {
        path: '/api/socket/io',
        addTrailingSlash: false,
        transports: ['websocket'],
      });
      socket.on('connect', () => {
        socket.emit('presupuesto-updated', { roomId: 'presupuestos-list', action: 'list_updated' });
        setTimeout(() => socket.disconnect(), 100);
      });

      window.open(`/dashboard/presupuestos/${result.insertId}`, '_blank');
    }
    setIsDuplicating(false);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full flex-wrap">

      {(userRole === 'VENDEDOR' || userRole === 'ADMIN') && (
        <Button variant="outline" onClick={handleDuplicate} disabled={isDuplicating || loading} className="h-auto py-3 font-medium border-zinc-300 w-full sm:flex-1 whitespace-normal">
          {isDuplicating ? <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" /> : <Copy className="w-4 h-4 mr-2 shrink-0" />}
          <span>Duplicar</span>
        </Button>
      )}

      {(estado === 'SOLICITADO') && (userRole === 'VENDEDOR' || userRole === 'ADMIN') && (
        <Button onClick={() => router.push(`/dashboard/presupuestos/${presupuestoId}/editar`)} className="h-auto py-3 bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm font-medium w-full sm:flex-1 whitespace-normal">
          <Edit className="w-4 h-4 mr-2 shrink-0" /> <span>Tomar Solicitud y Cotizar</span>
        </Button>
      )}

      {(estado === 'BORRADOR' || estado === 'RECHAZADO' || estado === 'EN_REVISION') && (userRole === 'VENDEDOR' || userRole === 'ADMIN') && (
        <>
          <Button variant="outline" onClick={() => router.push(`/dashboard/presupuestos/${presupuestoId}/editar`)} className="h-auto py-3 font-medium border-zinc-300 w-full sm:flex-1 whitespace-normal">
            <Edit className="w-4 h-4 mr-2 shrink-0" /> <span>Editar Pre-venta</span>
          </Button>
          {(estado === 'BORRADOR' || estado === 'RECHAZADO' || estado === 'EN_REVISION') && (
            userRole === 'ADMIN' ? (
              <Button onClick={() => setConfirmAction('APROBADO')} disabled={loading} className="h-auto py-3 bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm font-medium w-full sm:flex-1 whitespace-normal">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" /> : <CheckCircle2 className="w-4 h-4 mr-2 shrink-0" />}
                <span>Autorizar Pre-venta</span>
              </Button>
            ) : (
              <Button onClick={() => setConfirmAction('ESPERANDO_APROBACION')} disabled={loading} className="h-auto py-3 bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm font-medium w-full sm:flex-1 whitespace-normal">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" /> : <Send className="w-4 h-4 mr-2 shrink-0" />}
                <span>Enviar a Administración para Autorizar</span>
              </Button>
            )
          )}
        </>
      )}

      {(estado === 'ESPERANDO_APROBACION' || estado === 'ACEPTADO_CLIENTE') && userRole === 'ADMIN' && (
        <>
          <Button onClick={() => setConfirmAction('RECHAZADO')} disabled={loading} variant="outline" className="h-auto py-3 font-medium border-zinc-300 w-full sm:flex-1 whitespace-normal">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" /> : <XCircle className="w-4 h-4 mr-2 shrink-0" />}
            <span>Rechazar Pre-venta</span>
          </Button>
          <Button onClick={() => setConfirmAction('APROBADO')} disabled={loading} className="h-auto py-3 bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm font-medium w-full sm:flex-1 whitespace-normal">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" /> : <CheckCircle2 className="w-4 h-4 mr-2 shrink-0" />}
            <span>Autorizar Presupuesto</span>
          </Button>
        </>
      )}

      <Dialog open={confirmAction !== null} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmación</DialogTitle>
            <DialogDescription>
              {confirmAction === 'APROBADO'
                ? '¿Estás seguro de autorizar esta pre-venta?'
                : confirmAction === 'ESPERANDO_APROBACION'
                  ? '¿Estás seguro de enviar esta pre-venta?'
                  : confirmAction === 'RECHAZADO'
                    ? '¿Estás seguro de rechazar esta pre-venta?'
                    : '¿Estás seguro de continuar?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-2 mt-4 sm:mt-0 w-full">
            <Button size="lg" type="button" variant="outline" onClick={() => setConfirmAction(null)} disabled={loading} className="flex-1 sm:flex-none">
              Cancelar
            </Button>
            <Button size="lg" type="button" className="flex-1 sm:flex-none bg-zinc-900 text-white" onClick={handleAction} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
