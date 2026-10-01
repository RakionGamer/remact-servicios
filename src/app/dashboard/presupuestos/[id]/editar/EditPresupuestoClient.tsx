'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { io as ClientIO } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getServicios } from '@/actions/servicios';
import { getClientes, getClienteById } from '@/actions/clientes';
import { updatePresupuesto } from '@/actions/presupuestos';
import { Loader2, Trash2, Calendar as CalendarIcon, Search, Building2, Save, Pencil, ArrowLeft } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { ServiciosSelectionModal } from '@/components/presupuestos/ServiciosSelectionModal';
import { ClienteSelectionModal } from '@/components/presupuestos/ClienteSelectionModal';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function EditPresupuestoClient({ initialData, userRole }: { initialData: any, userRole?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [clientes, setClientes] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);

  // Form Header State
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any | null>({
    id: initialData.cliente_id,
    razon_social: initialData.cliente_nombre,
    identificador_fiscal: initialData.cliente_rut
  });
  const [clienteId, setClienteId] = useState(initialData.cliente_id?.toString() || '');
  const [direccionSeleccionada, setDireccionSeleccionada] = useState(initialData.cliente_direccion || '');
  const [solicitadoPor, setSolicitadoPor] = useState(initialData.solicitado_por || '');
  const [fecha, setFecha] = useState<Date | undefined>(new Date(initialData.fecha_emision));
  const [motivo, setMotivo] = useState(initialData.motivo_servicio || '');
  const [isMotivoEditable, setIsMotivoEditable] = useState(false);
  const [isSolicitadoEditable, setIsSolicitadoEditable] = useState(false);
  const tipoDocumento = 'FACTURA';
  const [condiciones, setCondiciones] = useState(initialData.condiciones || '');
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState<string>(initialData.descuento_porcentaje ? initialData.descuento_porcentaje.toString() : '');

  // Form Details State
  const [detalles, setDetalles] = useState<any[]>(initialData.detalles.map((d: any) => ({
    id: d.id,
    servicio_id: d.servicio_id ? d.servicio_id.toString() : '',
    servicio_nombre: d.servicio_nombre,
    cantidad: Number(d.cantidad) || 0,
    precio_unitario: Number(d.precio_unitario_historico) || 0,
    total_linea: Number(d.total_linea) || 0,
    unidad_medida: d.unidad_medida
  })));

  useEffect(() => {
    getClientes().then(res => { if (res.success) setClientes(res.data || []) });
    getServicios().then(res => { if (res.success) setServicios(res.data || []) });

    if (initialData.cliente_id) {
      getClienteById(initialData.cliente_id).then(res => {
        if (res.success && res.data) {
          setClienteSeleccionado(res.data);
          if (!initialData.cliente_direccion && res.data.direcciones && res.data.direcciones.length > 0) {
            setDireccionSeleccionada(res.data.direcciones[0]);
          }
        }
      });
    }
  }, [initialData.cliente_id, initialData.cliente_direccion]);

  const handleSelectCliente = async (cliente: any) => {
    setClienteSeleccionado(cliente);
    setClienteId(cliente.id.toString());
    setDireccionSeleccionada('');

    const res = await getClienteById(cliente.id);
    if (res.success && res.data) {
      setClienteSeleccionado(res.data);
    }
  };

  const handleUpdateServicios = (selectedServicios: any[]) => {
    const nextDetalles = [];
    const selectedIds = new Set(selectedServicios.map(s => s.id.toString()));

    for (const d of detalles) {
      if (selectedIds.has(d.servicio_id)) {
        nextDetalles.push(d);
      }
    }

    const existingIds = new Set(nextDetalles.map(d => d.servicio_id));
    for (const s of selectedServicios) {
      if (!existingIds.has(s.id.toString())) {
        nextDetalles.push({
          id: Date.now() + Math.random(),
          servicio_id: s.id.toString(),
          servicio_nombre: s.item,
          cantidad: 1,
          precio_unitario: parseFloat(s.valor_unitario || 0),
          total_linea: parseFloat(s.valor_unitario || 0) * 1,
          unidad_medida: s.unidad_medida
        });
      }
    }

    setDetalles(nextDetalles);
  };

  const removeDetalle = (id: number) => {
    setDetalles(detalles.filter(d => d.id !== id));
  };

  const updateDetalle = (id: number, field: string, value: any) => {
    setDetalles(detalles.map(d => {
      if (d.id === id) {
        const updated = { ...d, [field]: value };
        updated.total_linea = Number(updated.cantidad) * Number(updated.precio_unitario);
        return updated;
      }
      return d;
    }));
  };

  const subtotal1 = Math.round(detalles.reduce((acc, d) => acc + d.total_linea, 0));
  const parsedDescuento = Number(descuentoPorcentaje) || 0;
  const descuentoValor = Math.round(subtotal1 * (parsedDescuento / 100));
  const subtotal = subtotal1 - descuentoValor;
  const iva = tipoDocumento === 'FACTURA' ? 0.19 : 0;
  const impuestoTotal = Math.round(subtotal * iva);
  const total = subtotal + impuestoTotal;

  const handleSubmit = async () => {
    if (!clienteSeleccionado) {
      setError('Debes seleccionar un cliente de la base de datos.');
      return;
    }
    if (detalles.length === 0) {
      setError('Debes agregar al menos un servicio al presupuesto.');
      return;
    }

    setLoading(true);
    setError('');

    const data = {
      cliente_id: parseInt(clienteId),
      direccion_historica: direccionSeleccionada,
      solicitado_por: solicitadoPor || '',
      fecha_emision: fecha ? format(fecha, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      motivo_servicio: motivo,
      tipo_documento: tipoDocumento,
      subtotal,
      descuento_porcentaje: parsedDescuento,
      descuento_valor: descuentoValor,
      iva,
      impuesto_total: impuestoTotal,
      total,
      condiciones,
      detalles: detalles.map(d => ({
        servicio_id: d.servicio_id ? parseInt(d.servicio_id) : null,
        servicio_nombre: d.servicio_nombre,
        cantidad: Number(d.cantidad),
        precio_unitario: Number(d.precio_unitario),
        total_linea: Number(d.total_linea)
      }))
    };

    const res = await updatePresupuesto(initialData.id, data);
    if (res.success) {
      toast.success('Presupuesto guardado correctamente');
      
      queryClient.invalidateQueries({ queryKey: ['presupuesto', initialData.id] });

      const socket = ClientIO(process.env.NEXT_PUBLIC_SITE_URL || undefined, {
        path: '/api/socket/io',
        addTrailingSlash: false,
        transports: ['websocket'],
      });
      socket.on('connect', () => {
        socket.emit('presupuesto-updated', { roomId: `presupuesto-${initialData.id}`, action: 'details_updated' });
        setTimeout(() => {
          socket.disconnect();
          router.push(`/dashboard/presupuestos/${initialData.id}`);
          router.refresh();
        }, 100);
      });
    } else {
      toast.error(res.error || 'Error al actualizar el presupuesto');
      setError(res.error || 'Error al actualizar el presupuesto');
      setLoading(false);
    }
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="shrink-0">
            <Link href={`/dashboard/presupuestos/${initialData.id}`}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight line-clamp-1">Editar Pre-venta #{initialData.id}</h1>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200 font-medium">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-800">Cliente <span className="text-red-500">*</span></label>
            <ClienteSelectionModal
              clientes={clientes}
              onSelectCliente={handleSelectCliente}
              triggerButton={
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-white h-10 border-zinc-200 shadow-sm truncate",
                    !clienteSeleccionado && "text-zinc-500"
                  )}
                >
                  <Search className="w-4 h-4 mr-2 opacity-50 shrink-0" />
                  {clienteSeleccionado ? (
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-zinc-900 font-semibold text-sm truncate">{clienteSeleccionado.razon_social}</span>
                      {clienteSeleccionado.identificador_fiscal && (
                        <>
                          <span className="text-zinc-400 hidden sm:inline">-</span>
                          <span className="text-xs text-zinc-500 font-normal truncate">
                            RUT: {clienteSeleccionado.identificador_fiscal}
                          </span>
                        </>
                      )}
                    </div>
                  ) : (
                    <span>Seleccionar cliente...</span>
                  )}
                </Button>
              }
            />
          </div>

          <div className="space-y-1.5 flex flex-col justify-end">
            <label className="text-sm font-semibold text-zinc-800">Dirección a asociar <span className="text-red-500">*</span></label>
            <Input 
              value={direccionSeleccionada}
              onChange={e => setDireccionSeleccionada(e.target.value)}
              placeholder="Escribe la dirección..."
              className="h-10 bg-white"
            />
            {clienteSeleccionado?.direcciones && clienteSeleccionado.direcciones.length > 0 && (
              <div className="text-xs text-zinc-500 flex flex-wrap items-center gap-2 mt-1">
                <span 
                  onClick={() => setDireccionSeleccionada(clienteSeleccionado.direcciones[0])} 
                  className="cursor-pointer hover:text-blue-600 underline truncate max-w-[200px] sm:max-w-[300px]"
                  title={clienteSeleccionado.direcciones[0]}
                >
                  {clienteSeleccionado.direcciones[0]} (Principal)
                </span>
                {clienteSeleccionado.direcciones.length > 1 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="inline-flex items-center justify-center rounded-full bg-zinc-900 text-white w-6 h-6 text-xs font-bold hover:bg-zinc-800 transition-colors" title="Ver más direcciones">
                        +
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2" align="start">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-zinc-500 px-2 pb-1">Otras direcciones</p>
                        {clienteSeleccionado.direcciones.slice(1).map((dir: string, i: number) => (
                          <div 
                            key={i} 
                            onClick={() => setDireccionSeleccionada(dir)} 
                            className="cursor-pointer text-sm p-2 hover:bg-zinc-100 rounded-md transition-colors"
                          >
                            {dir}
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-800">Nombre del Solicitante</label>
            <div className="relative">
              <Input disabled={!isSolicitadoEditable} value={solicitadoPor} onChange={e => setSolicitadoPor(e.target.value)} placeholder="Ej: Juan Carlos" className="h-10 bg-white pr-10 disabled:opacity-70 disabled:cursor-not-allowed" />
              <button
                type="button"
                onClick={() => setIsSolicitadoEditable(!isSolicitadoEditable)}
                className={cn(
                  "absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-colors",
                  isSolicitadoEditable ? "bg-blue-100 text-blue-700" : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
                )}
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-1.5 flex flex-col justify-end">
            <label className="text-sm font-semibold text-zinc-800">Fecha de Emisión <span className="text-red-500">*</span></label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal bg-white h-10 shadow-sm",
                    !fecha && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fecha ? format(fecha, "PPP", { locale: es }) : <span>Elegir una fecha</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={fecha}
                  onSelect={setFecha}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5 col-span-1">
            <label className="text-sm font-semibold text-zinc-800">Motivo del Servicio u Obra</label>
            <div className="relative">
              <Input disabled={!isMotivoEditable} value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Ej: Remodelación Oficina Central" className="h-10 bg-white pr-10 disabled:opacity-70 disabled:cursor-not-allowed" />
              <button
                type="button"
                onClick={() => setIsMotivoEditable(!isMotivoEditable)}
                className={cn(
                  "absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-colors",
                  isMotivoEditable ? "bg-blue-100 text-blue-700" : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
                )}
                title="Editar motivo"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="space-y-1.5 col-span-1">
            <label className="text-sm font-semibold text-zinc-800">Descuento (%)</label>
            <Input 
              type="number" 
              step="any"
              min="0" 
              max="100" 
              value={descuentoPorcentaje} 
              onChange={e => setDescuentoPorcentaje(e.target.value)} 
              className="h-10 bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
            />
          </div>
        </div>

        <hr className="border-zinc-200" />

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight">Ítems a Cotizar</h2>
            <ServiciosSelectionModal
              servicios={servicios}
              initialSelectedIds={detalles.map(d => d.servicio_id)}
              onAddServicios={handleUpdateServicios}
            />
          </div>

          <div className="border border-zinc-200 rounded-md bg-white shadow-sm overflow-hidden">
            {/* Vista Móvil (Tarjetas) */}
            <div className="md:hidden divide-y divide-zinc-200">
              {detalles.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-sm">
                  Aún no has agregado servicios a este presupuesto.
                </div>
              ) : (
                detalles.map((d) => (
                  <div key={d.id} className="p-4 space-y-4 bg-white">
                    <div className="flex justify-between items-start gap-4">
                      <div className="font-bold text-zinc-900 text-sm leading-tight">{d.servicio_nombre}</div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                        onClick={() => removeDetalle(d.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Cantidad</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={d.cantidad}
                          onChange={e => updateDetalle(d.id, 'cantidad', e.target.value)}
                          className="h-9 w-full text-center font-medium shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block text-right">Precio Unit.</label>
                        <Input
                          type="text"
                          value={new Intl.NumberFormat('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(d.precio_unitario))}
                          disabled
                          className="h-9 w-full text-right disabled:opacity-70 disabled:bg-zinc-100 disabled:text-zinc-500 shadow-sm font-medium"
                        />
                      </div>
                    </div>
                    
                    <div className="pt-3 flex justify-between items-center border-t border-zinc-100">
                      <span className="text-sm font-semibold text-zinc-600">Subtotal Línea</span>
                      <span className="font-bold text-emerald-700 text-lg">{d.unidad_medida === 'UF' ? new Intl.NumberFormat('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(d.total_linea) : formatMoney(d.total_linea)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Vista Desktop (Tabla) */}
            <div className="hidden md:block">
              <Table>
              <TableHeader className="bg-zinc-50/80">
                <TableRow>
                  <TableHead className="w-full">Servicio / Ítem</TableHead>
                  <TableHead className="w-[120px] text-center">Cantidad</TableHead>
                  <TableHead className="w-[150px] text-right">Precio Unit.</TableHead>
                  <TableHead className="w-[150px] text-right">Subtotal</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detalles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-zinc-500">
                      Aún no has agregado servicios a este presupuesto.
                    </TableCell>
                  </TableRow>
                ) : (
                  detalles.map((d) => (
                    <TableRow key={d.id} className="group">
                      <TableCell className="font-medium text-zinc-800">
                        {d.servicio_nombre}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={d.cantidad}
                          onChange={e => updateDetalle(d.id, 'cantidad', e.target.value)}
                          className="h-9 w-[100px] mx-auto text-center font-medium shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="text"
                          value={new Intl.NumberFormat('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(d.precio_unitario))}
                          disabled
                          className="h-9 w-[120px] ml-auto text-right disabled:opacity-70 disabled:bg-zinc-100 disabled:text-zinc-500 disabled:cursor-not-allowed shadow-sm font-medium"
                        />
                      </TableCell>
                      <TableCell className="text-right font-semibold text-zinc-800">
                        {d.unidad_medida === 'UF' ? new Intl.NumberFormat('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(d.total_linea) : formatMoney(d.total_linea)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600 hover:bg-red-50"
                          onClick={() => removeDetalle(d.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          </div>
        </div>

        <hr className="border-zinc-200" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-800">Condiciones Comerciales</label>
            <Textarea
              value={condiciones}
              onChange={e => setCondiciones(e.target.value)}
              className="h-32 resize-none text-sm bg-white"
              placeholder="Escribe términos y condiciones..."
            />
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs bg-zinc-50 hover:bg-zinc-100 h-auto py-1.5 px-3 text-zinc-600"
                onClick={() => setCondiciones((prev: string) => prev + (prev ? '\n\n' : '') + 'Este presupuesto tiene una vigencia de 07 días continuos')}
              >
                + Vigencia 7 días
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs bg-zinc-50 hover:bg-zinc-100 h-auto py-1.5 px-3 text-zinc-600 text-left"
                onClick={() => setCondiciones((prev: string) => prev + (prev ? '\n\n' : '') + 'Validez de la oferta: 15 días hábiles.\nForma de pago: 50% anticipo, 50% al finalizar.')}
              >
                + Condiciones estándar
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs bg-zinc-50 hover:bg-zinc-100 h-auto py-1.5 px-3 text-zinc-600 text-left max-w-full"
                onClick={() => setCondiciones((prev: string) => prev + (prev ? '\n\n' : '') + 'NOTA: El gabinete base de meson fabricado en melamina (se fabricará lo más similar parecido al color del existente) 18mm de espesor, con cantos PVC termofusionados 1.5mm de espesor, repisas interiores')}
              >
                + Nota Gabinete Melamina
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 flex-1 flex flex-col justify-center space-y-3 bg-zinc-50/80">
              {parsedDescuento > 0 ? (
                <>
                  <div className="flex justify-between items-center text-zinc-600 text-sm">
                    <span className="font-medium">Subtotal</span>
                    <span className="font-semibold text-zinc-900">{formatMoney(subtotal1)}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-600 text-sm">
                    <span className="font-medium">Descuento ({parsedDescuento}%)</span>
                    <span className="font-semibold">- {formatMoney(descuentoValor)}</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-600 text-sm border-t border-zinc-200 pt-2">
                    <span className="font-medium">Subtotal con Descuento</span>
                    <span className="font-semibold text-zinc-900">{formatMoney(subtotal)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center text-zinc-600 text-sm">
                  <span className="font-medium">Subtotal</span>
                  <span className="font-semibold text-zinc-900">{formatMoney(subtotal)}</span>
                </div>
              )}

              {tipoDocumento === 'FACTURA' && (
                <div className="flex justify-between items-center text-zinc-600 text-sm">
                  <span className="font-medium">IVA (19%)</span>
                  <span className="font-semibold text-zinc-900">{formatMoney(impuestoTotal)}</span>
                </div>
              )}
            </div>

            <div className="bg-zinc-900 px-6 py-5 flex justify-between items-center text-white">
              <span className="font-semibold tracking-wider uppercase text-md text-zinc-300">Total a Pagar</span>
              <span className="font-bold text-3xl tracking-tight text-white-400">{formatMoney(total)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-row justify-end gap-3 sm:gap-4 pt-4 w-full">
          <Button variant="outline" size="lg" onClick={() => router.push(`/dashboard/presupuestos/${initialData.id}`)} className="flex-1 sm:flex-none border-zinc-300 text-zinc-900 hover:bg-zinc-100">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading} size="lg" className="flex-1 sm:flex-none px-4 sm:px-8 bg-zinc-900 hover:bg-zinc-800 text-white">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}
