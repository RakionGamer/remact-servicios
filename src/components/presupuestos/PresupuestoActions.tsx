'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { updatePresupuestoEstado } from '@/actions/presupuestos';
import { Loader2, CheckCircle2, XCircle, Send, Edit, Clock } from 'lucide-react';
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

  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full flex-wrap">

      {/* Mantenemos retrocompatibilidad para estados antiguos si existen */}
      {(estado === 'SOLICITADO') && (userRole === 'VENDEDOR' || userRole === 'ADMIN') && (
        <Button onClick={() => router.push(`/dashboard/presupuestos/${presupuestoId}/editar`)} className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm h-10 font-medium flex-1">
          <Edit className="w-4 h-4 mr-2" /> Tomar Solicitud y Cotizar
        </Button>
      )}

      {(estado === 'BORRADOR' || estado === 'RECHAZADO' || estado === 'EN_REVISION') && (userRole === 'VENDEDOR' || userRole === 'ADMIN') && (
        <>
          <Button variant="outline" onClick={() => router.push(`/dashboard/presupuestos/${presupuestoId}/editar`)} className="h-10 font-medium border-zinc-300 flex-1">
            <Edit className="w-4 h-4 mr-2" /> Editar Pre-venta
          </Button>
          {(estado === 'BORRADOR' || estado === 'RECHAZADO' || estado === 'EN_REVISION') && (
            userRole === 'ADMIN' ? (
              <Button onClick={() => setConfirmAction('APROBADO')} disabled={loading} className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm h-10 font-medium flex-1">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Autorizar Pre-venta
              </Button>
            ) : (
              <Button onClick={() => setConfirmAction('ESPERANDO_APROBACION')} disabled={loading} className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm h-10 font-medium flex-1">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Enviar a Administración para Autorizar
              </Button>
            )
          )}
        </>
      )}

      {(estado === 'ESPERANDO_APROBACION' || estado === 'ACEPTADO_CLIENTE') && userRole === 'ADMIN' && (
        <>
          <Button onClick={() => setConfirmAction('RECHAZADO')} disabled={loading} variant="outline" className="h-10 font-medium border-zinc-300 flex-1">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
            Rechazar Pre-venta
          </Button>
          <Button onClick={() => setConfirmAction('APROBADO')} disabled={loading} className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm h-10 font-medium flex-1">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Autorizar Presupuesto
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
          <DialogFooter className="sm:space-x-2 mt-2 flex-col sm:flex-row gap-3 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setConfirmAction(null)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="button" className="bg-zinc-900 text-white" onClick={handleAction} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
