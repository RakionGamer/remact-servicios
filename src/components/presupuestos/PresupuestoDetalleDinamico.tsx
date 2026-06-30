'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPresupuestoById } from '@/actions/presupuestos';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { io as ClientIO } from 'socket.io-client';
import { AlertCircle } from 'lucide-react';

interface Props {
  presupuestoId: number;
  initialData: any;
  isPortal?: boolean;
  showClientDetails?: boolean;
  approvalActions?: React.ReactNode;
  description?: string;
}

export function PresupuestoDetalleDinamico({ presupuestoId, initialData, isPortal, showClientDetails, approvalActions, description }: Props) {
  const queryClient = useQueryClient();
  const [hasChanged, setHasChanged] = useState(false);

  const { data: result } = useQuery({
    queryKey: ['presupuesto', presupuestoId],
    queryFn: async () => {
      const res = await getPresupuestoById(presupuestoId);
      if (!res.success) throw new Error(res.error);
      return res;
    },
    initialData: { success: true, data: initialData },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    const socketInstance = ClientIO(process.env.NEXT_PUBLIC_SITE_URL || undefined, {
      path: '/api/socket/io',
      addTrailingSlash: false,
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      socketInstance.emit('join-room', `presupuesto-${presupuestoId}`);
    });

    socketInstance.on('presupuesto-updated-broadcast', (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['presupuesto', presupuestoId] });
      if (data?.action === 'details_updated') {
        setHasChanged(true);
      }
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [presupuestoId, queryClient]);

  const p = result?.data || initialData;
  const formatMoney = (val: number) => new Intl.NumberFormat('es-CL', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val);

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Detalle del Presupuesto</CardTitle>
          <CardDescription>{description || 'Revisa los servicios y precios propuestos por el vendedor.'}</CardDescription>
        </CardHeader>
        <CardContent>
          {showClientDetails && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Datos Cliente / Empresa */}
              <div className="flex flex-col gap-1 p-4 rounded-lg border shadow-sm border-zinc-100 text-sm">
                <span className="font-semibold text-zinc-900 mb-1">
                  {p.tipo_cliente === 'JURIDICA' ? 'Datos de la Empresa' : 'Datos del Cliente'}
                </span>
                <p className="text-zinc-600 font-medium">{p.cliente_nombre}</p>
                <p className="text-zinc-600">RUT: {p.cliente_rut}</p>
                {p.cliente_direccion && (
                  <p className="text-zinc-600 leading-relaxed">{p.cliente_direccion}</p>
                )}
              </div>

              {/* Detalles Solicitud */}
              <div className="flex flex-col gap-1 p-4 rounded-lg shadow-sm border border-zinc-100 text-sm">
                <span className="font-semibold text-zinc-900 mb-1">Detalles de la Solicitud</span>
                <p className="text-zinc-600">
                  <span className="font-medium">Solicitado por:</span> {p.solicitado_por || p.cliente_nombre}
                </p>
                {p.motivo_servicio && (
                  <p className="text-zinc-600 mt-1">
                    <span className="font-medium">Motivo:</span> {p.motivo_servicio}
                  </p>
                )}
              </div>
            </div>
          )}
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-50">
                <TableRow>
                  <TableHead>Servicio</TableHead>
                  <TableHead className="text-center">Cant.</TableHead>
                  <TableHead className="text-right">Precio Unit.</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {p.detalles?.map((item: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{item.servicio_nombre}</TableCell>
                    <TableCell className="text-center">{Math.round(Number(item.cantidad))}</TableCell>
                    <TableCell className="text-right">${formatMoney(Number(item.precio_unitario_historico))}</TableCell>
                    <TableCell className="text-right font-semibold">${formatMoney(Number(item.total_linea))}</TableCell>
                  </TableRow>
                ))}
                {(!p.detalles || p.detalles.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-zinc-500">No hay servicios en esta propuesta.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 flex flex-col items-end gap-2 text-sm">
            <div className="flex justify-between w-48 text-zinc-600">
              <span>Subtotal:</span>
              <span>${formatMoney(Number(p.subtotal))}</span>
            </div>
            {p.tipo_documento === 'FACTURA' && (
              <div className="flex justify-between w-48 text-zinc-600">
                <span>IVA (19%):</span>
                <span>${formatMoney(Number(p.impuesto_total))}</span>
              </div>
            )}
            <div className="flex justify-between w-48 text-lg font-bold text-zinc-900 border-t pt-2 mt-1">
              <span>Total:</span>
              <span className="text-emerald-700">${formatMoney(Number(p.total))}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {isPortal && (p.estado === 'EN_REVISION' || p.estado === 'ACEPTADO_CLIENTE' || p.estado === 'RECHAZADO') && (
        <Card className="mt-4 border-zinc-200 shadow-sm relative overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle>{p.estado === 'EN_REVISION' ? 'Decisión Pendiente' : p.estado === 'ACEPTADO_CLIENTE' ? 'Propuesta Aceptada' : 'Propuesta Rechazada'}</CardTitle>
            <CardDescription>
              {p.estado === 'EN_REVISION' ? 'Si estás de acuerdo con los montos y servicios detallados, puedes proceder a aprobar el presupuesto.' : 
               p.estado === 'ACEPTADO_CLIENTE' ? 'Has aceptado esta propuesta. El vendedor está gestionando la autorización final con administración.' :
               'Has rechazado este presupuesto. Si hubo un error, comunícate en el chat o con administración.'}
            </CardDescription>
          </CardHeader>
          {p.estado === 'EN_REVISION' && (
            <CardContent>
              {hasChanged && (
                <div className="mb-4 p-4 rounded-md bg-red-50 border border-red-200 flex gap-3 items-start text-red-800 shadow-sm animate-in fade-in zoom-in-95 duration-300">
                  <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm">¡Advertencia!</h4>
                    <p className="text-sm mt-1">Los detalles de la propuesta se han cambiado recientemente, revisalos nuevamente antes de aceptar la preventa.</p>
                  </div>
                </div>
              )}
              {approvalActions && approvalActions}
            </CardContent>
          )}
        </Card>
      )}
    </>
  );
}
