import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PrintButton } from '@/components/presupuestos/PrintButton';
import { DoubleScrollContainer } from '@/components/presupuestos/DoubleScrollContainer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPresupuestoById } from '@/actions/presupuestos';
import { getConfiguraciones } from '@/actions/configuracion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSession } from '@/actions/auth';
import { getComentarios } from '@/actions/comentarios';
import { ChatPresupuesto } from '@/components/presupuestos/ChatPresupuesto';
import { PresupuestoActions } from '@/components/presupuestos/PresupuestoActions';
import { PresupuestoDetalleDinamico } from '@/components/presupuestos/PresupuestoDetalleDinamico';

export const dynamic = 'force-dynamic';

export default async function PresupuestoViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);

  if (isNaN(id)) return notFound();

  const result = await getPresupuestoById(id);
  if (!result.success || !result.data) {
    return notFound();
  }

  const p = result.data;

  const session = await getSession();
  const resComentarios = await getComentarios(id);
  const comentarios = resComentarios.success && resComentarios.data ? resComentarios.data : [];

  const resConfigs = await getConfiguraciones();
  const configs = resConfigs.success && resConfigs.data ? resConfigs.data : {};

  const formatMoney = (val: number) => new Intl.NumberFormat('es-CL', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val);

  const emptyRowsCount = Math.max(0, 20 - (p.detalles?.length || 0));
  const emptyRows = Array.from({ length: emptyRowsCount });

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'APROBADO': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Presupuesto Aprobado</span>;
      case 'RECHAZADO': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">Pre-venta Rechazada</span>;
      case 'ESPERANDO_APROBACION': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">En Autorización</span>;
      case 'ACEPTADO_CLIENTE': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">Aceptado por Cliente</span>;
      case 'EN_REVISION':
      case 'SOLICITADO': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">Solicitud Histórica</span>;
      default: return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 border border-zinc-300">Pre-venta Borrador</span>;
    }
  };

  return (
    <div className="space-y-4 pb-20 print:pb-0 print:bg-transparent min-h-screen print:min-h-0 p-4 sm:p-8 print:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print max-w-[210mm] mx-auto">
        <div className="flex gap-2 items-center flex-wrap">
          <Button variant="outline" asChild>
            <Link href="/dashboard/presupuestos">
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver
            </Link>
          </Button>
        </div>
        <div className="flex gap-2">
          <PrintButton presupuestoId={p.id} clienteNombre={p.cliente_nombre} clienteCorreo={p.cliente_correo} estado={p.estado} presupuestoObj={p} configs={configs} />
        </div>
      </div>

      <DoubleScrollContainer>
        <div className="bg-white mx-auto shadow-xl min-w-[210mm] max-w-[210mm] print:min-w-0 print:max-w-none print:shadow-none print:bg-transparent">
          <div
            id="print-area"
            style={{
              fontFamily: 'Arial, Helvetica, sans-serif',
              '--theme-color': p.estado === 'APROBADO' ? '#ed0e2c' : '#2563eb'
            } as React.CSSProperties}
            className="p-4 sm:p-8 print:p-0 w-full h-full text-xs flex flex-col text-black bg-white relative"
          >

            {/* Top Box */}
            <div className="border-[1.5px] mb-2" style={{ borderColor: 'var(--theme-color)' }}>
              {/* Top Row */}
              <div className="flex border-b-[1.5px]" style={{ borderColor: 'var(--theme-color)' }}>
                <div className="flex-1 flex items-center justify-center">
                  <h1 className="text-xl font-bold underline tracking-wide" style={{ color: 'var(--theme-color)' }}>
                    {p.estado === 'APROBADO' ? 'COTIZACIÓN DE PRESUPUESTO' : 'PREVENTA'}
                  </h1>
                </div>
                <div className="border-l-[1.5px] flex items-center px-4 py-1 whitespace-nowrap" style={{ borderColor: 'var(--theme-color)' }}>
                  <span className="font-bold text-xl whitespace-nowrap" style={{ color: 'var(--theme-color)' }}>N: {p.id.toString()}</span>
                </div>
              </div>
              {/* Bottom Row */}
              <div className="flex p-2 items-center">
                <div className="flex-[1.2] text-[10px] font-bold leading-tight whitespace-pre-line">
                  {configs['DATOS_FACTURACION']}
                </div>
                <div className="flex-[0.8] flex justify-center items-center">
                  <img src="/remact-logo.png" alt="Remact Logo" className="w-28 object-contain" />
                </div>
                <div className="flex-1 flex flex-col items-end gap-1">
                  <table className="w-40 border-collapse text-center text-[10px] border-[1.5px]" style={{ borderColor: 'var(--theme-color)' }}>
                    <tbody>
                      <tr><th className="text-white p-0.5 border-[1.5px]" style={{ backgroundColor: 'var(--theme-color)', borderColor: 'var(--theme-color)' }}>FECHA EMISIÓN</th></tr>
                      <tr><td className="p-0.5 font-bold border-[1.5px]" style={{ borderColor: 'var(--theme-color)' }}>{new Date(p.fecha_emision).toLocaleDateString('es-CL')}</td></tr>
                    </tbody>
                  </table>
                  <table className="w-40 border-collapse text-center text-[10px] border-[1.5px]" style={{ borderColor: 'var(--theme-color)' }}>
                    <tbody>
                      <tr><th className="text-white p-0.5 border-[1.5px]" style={{ backgroundColor: 'var(--theme-color)', borderColor: 'var(--theme-color)' }}>TÉRMINOS</th></tr>
                      <tr><td className="p-0.5 font-bold border-[1.5px]" style={{ borderColor: 'var(--theme-color)' }}>TRANSFERENCIA</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Solicitante / Remitente */}
            <div className="flex gap-2 mb-2">
              <div className="flex-1 border-[1.5px]" style={{ borderColor: 'var(--theme-color)' }}>
                <div className="text-white text-center font-bold text-[10px] py-0.5 border-b-[1.5px]" style={{ backgroundColor: 'var(--theme-color)', borderColor: 'var(--theme-color)' }}>SOLICITANTE:</div>
                <div className="p-1.5 text-[10px] font-bold leading-tight space-y-0.5">
                  <div>SOLICITADO POR: {p.solicitado_por || p.cliente_nombre}</div>
                  <div>NOMBRE EMPRESA: {p.cliente_nombre}</div>
                  <div>DIRECCION: {p.cliente_direccion || ''}</div>
                  <div>TELÉFONO: {p.cliente_telefono || ''}</div>
                </div>
              </div>
              <div className="flex-1 border-[1.5px]" style={{ borderColor: 'var(--theme-color)' }}>
                <div className="text-white text-center font-bold text-[10px] py-0.5 border-b-[1.5px]" style={{ backgroundColor: 'var(--theme-color)', borderColor: 'var(--theme-color)' }}>REMITENTE:</div>
                <div className="p-1.5 text-[10px] font-bold leading-tight whitespace-pre-line">
                  {configs['DATOS_PAGO']}
                </div>
              </div>
            </div>

            {/* Motivo & Table */}
            <div className="border-[1.5px] border-b-0 p-1 text-[10px] font-bold" style={{ borderColor: 'var(--theme-color)' }}>
              MOTIVO: {p.motivo_servicio || ''}
            </div>
            <table className="w-full border-collapse border-[1.5px] text-[10px]" style={{ borderColor: 'var(--theme-color)' }}>
              <thead>
                <tr className="text-white" style={{ backgroundColor: 'var(--theme-color)' }}>
                  <th className="border-[1.5px] p-1 font-bold text-center" style={{ borderColor: 'var(--theme-color)' }}>DESCRIPCIÓN</th>
                  <th className="border-[1.5px] p-1 font-bold text-center w-12" style={{ borderColor: 'var(--theme-color)' }}>CANT.</th>
                  <th className="border-[1.5px] p-1 font-bold text-center w-12" style={{ borderColor: 'var(--theme-color)' }}>UNID.</th>
                  <th className="border-[1.5px] p-1 font-bold text-center w-32" style={{ borderColor: 'var(--theme-color)' }}>PRECIO UNITARIO</th>
                  <th className="border-[1.5px] p-1 font-bold text-center w-24" style={{ borderColor: 'var(--theme-color)' }}>IMPORTE</th>
                </tr>
              </thead>
              <tbody>
                {p.detalles?.map((item: any, i: number) => (
                  <tr key={i}>
                    <td className="border-[1.5px] px-1 py-0.5 font-normal" style={{ borderColor: 'var(--theme-color)' }}>{item.servicio_nombre}</td>
                    <td className="border-[1.5px] px-1 py-0.5 text-center font-normal text-black" style={{ borderColor: 'var(--theme-color)' }}>{Math.round(Number(item.cantidad))}</td>
                    <td className="border-[1.5px] px-1 py-0.5 text-center font-normal" style={{ borderColor: 'var(--theme-color)' }}>{item.unidad_medida || 'UNID.'}</td>
                    <td className="border-[1.5px] px-1 py-0.5 text-right font-normal" style={{ borderColor: 'var(--theme-color)' }}>
                      <span className="float-left">$</span> {formatMoney(Number(item.precio_unitario_historico))}
                    </td>
                    <td className="border-[1.5px] px-1 py-0.5 text-right font-normal" style={{ borderColor: 'var(--theme-color)' }}>
                      <span className="float-left">$</span> {formatMoney(Number(item.total_linea))}
                    </td>
                  </tr>
                ))}
                {/* Espaciado visual */}
                <tr>
                  <td className="border-[1.5px] px-1 py-1 h-6" style={{ borderColor: 'var(--theme-color)' }}></td>
                  <td className="border-[1.5px] px-1 py-1" style={{ borderColor: 'var(--theme-color)' }}></td>
                  <td className="border-[1.5px] px-1 py-1" style={{ borderColor: 'var(--theme-color)' }}></td>
                  <td className="border-[1.5px] px-1 py-1" style={{ borderColor: 'var(--theme-color)' }}></td>
                  <td className="border-[1.5px] px-1 py-1" style={{ borderColor: 'var(--theme-color)' }}></td>
                </tr>
                <tr>
                  <td className="border-[1.5px] px-1 py-1 h-6" style={{ borderColor: 'var(--theme-color)' }}></td>
                  <td className="border-[1.5px] px-1 py-1" style={{ borderColor: 'var(--theme-color)' }}></td>
                  <td className="border-[1.5px] px-1 py-1" style={{ borderColor: 'var(--theme-color)' }}></td>
                  <td className="border-[1.5px] px-1 py-1" style={{ borderColor: 'var(--theme-color)' }}></td>
                  <td className="border-[1.5px] px-1 py-1" style={{ borderColor: 'var(--theme-color)' }}></td>
                </tr>
                <tr>
                  <td className="border-[1.5px] px-1 py-1 text-[9px] align-top font-medium whitespace-pre-line" colSpan={1} rowSpan={p.tipo_documento === 'FACTURA' ? 3 : 2} style={{ borderColor: 'var(--theme-color)' }}>
                    {p.condiciones ? `Nota: ${p.condiciones}` : ''}
                  </td>
                  <td className="border-[1.5px] px-1 py-1 bg-[#dce6f1] font-bold" colSpan={3} style={{ borderColor: 'var(--theme-color)' }}>SUBTOTAL</td>
                  <td className="border-[1.5px] px-1 py-1 text-right font-normal bg-[#ebf1f8]" style={{ borderColor: 'var(--theme-color)' }}><span className="float-left">$</span> {formatMoney(Number(p.subtotal))}</td>
                </tr>
                {p.tipo_documento === 'FACTURA' && (
                  <tr>
                    <td className="border-[1.5px] px-1 py-1 bg-[#dce6f1] font-bold" colSpan={3} style={{ borderColor: 'var(--theme-color)' }}>IMPUESTOS IVA 19%</td>
                    <td className="border-[1.5px] px-1 py-1 text-right font-normal bg-[#ebf1f8]" style={{ borderColor: 'var(--theme-color)' }}><span className="float-left">$</span> {formatMoney(Number(p.impuesto_total))}</td>
                  </tr>
                )}
                <tr>
                  <td className="border-[1.5px] px-1 py-1 bg-[#dce6f1] font-bold" colSpan={3} style={{ borderColor: 'var(--theme-color)' }}>TOTAL</td>
                  <td className="border-[1.5px] px-1 py-1 text-right font-bold bg-[#ebf1f8]" style={{ borderColor: 'var(--theme-color)' }}><span className="float-left">$</span> {formatMoney(Number(p.total))}</td>
                </tr>
              </tbody>
            </table>

            {p.estado !== 'APROBADO' && (
              <div className="mt-6 text-center text-[11px] font-bold uppercase px-2" style={{ color: 'var(--theme-color)' }}>
                Este presupuesto está sujeto a cambios hasta ser aprobado por el cliente y la administración de Remactservicios
              </div>
            )}

          </div>
        </div>
      </DoubleScrollContainer>

      {/* Caja de Acciones al final */}
      <div className="max-w-[210mm] mx-auto no-print mt-4">
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="space-y-1.5">
              <CardTitle>Acciones de Gestión</CardTitle>
              <CardDescription>
                Opciones disponibles según el estado actual del presupuesto.
              </CardDescription>
            </div>
            <div className="mt-0">
              {getStatusBadge(p.estado || 'BORRADOR')}
            </div>
          </CardHeader>
          <CardContent>
            <PresupuestoActions presupuestoId={p.id} estado={p.estado} userRole={session?.rol as string | undefined} />
          </CardContent>
        </Card>
      </div>

      <div className="max-w-[210mm] mx-auto pb-8 mt-6">
        <ChatPresupuesto presupuestoId={p.id} initialComments={comentarios} currentUser={session} />
      </div>
    </div>
  );
}
