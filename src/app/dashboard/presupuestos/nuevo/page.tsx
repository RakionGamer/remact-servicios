'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getClientes, getClienteById } from '@/actions/clientes';
import { getServicios } from '@/actions/servicios';
import { createPresupuesto } from '@/actions/presupuestos';
import { Loader2, Trash2, Calendar as CalendarIcon, Search, Building2, Save } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { ServiciosSelectionModal } from '@/components/presupuestos/ServiciosSelectionModal';
import { ClienteSelectionModal } from '@/components/presupuestos/ClienteSelectionModal';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function NuevoPresupuestoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);


  const [clientes, setClientes] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);

  // Form Header State
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any | null>(null);
  const [clienteId, setClienteId] = useState('');
  const [direccionSeleccionada, setDireccionSeleccionada] = useState('');
  const [solicitadoPor, setSolicitadoPor] = useState('');
  const [fecha, setFecha] = useState<Date | undefined>();
  const [motivo, setMotivo] = useState('');
  const tipoDocumento = 'FACTURA';
  const [condiciones, setCondiciones] = useState('');

  // Form Details State
  const [detalles, setDetalles] = useState<any[]>([]);

  useEffect(() => {
    setFecha(new Date());
    getClientes().then(res => { if (res.success) setClientes(res.data || []) });
    getServicios().then(res => { if (res.success) setServicios(res.data || []) });
  }, []);

  const handleSelectCliente = async (cliente: any) => {
    setClienteSeleccionado(cliente);
    setClienteId(cliente.id.toString());
    setDireccionSeleccionada(cliente.direccion || '');

    const res = await getClienteById(cliente.id);
    if (res.success && res.data) {
      setClienteSeleccionado(res.data);
      if (res.data.direcciones && res.data.direcciones.length > 0) {
        setDireccionSeleccionada(res.data.direcciones[0]);
      }
    }
  };

  const handleUpdateServicios = (selectedServicios: any[]) => {
    const nextDetalles = [];
    const selectedIds = new Set(selectedServicios.map(s => s.id.toString()));

    // 1. Keep existing details that are still selected (preserves user edits to quantity/price)
    for (const d of detalles) {
      if (selectedIds.has(d.servicio_id)) {
        nextDetalles.push(d);
      }
    }

    // 2. Add new details for newly selected services
    const existingIds = new Set(nextDetalles.map(d => d.servicio_id));
    for (const s of selectedServicios) {
      if (!existingIds.has(s.id.toString())) {
        nextDetalles.push({
          id: Date.now() + Math.random(),
          servicio_id: s.id.toString(),
          servicio_nombre: s.item,
          cantidad: 1,
          precio_unitario: parseFloat(s.valor_unitario || 0),
          total_linea: parseFloat(s.valor_unitario || 0) * 1
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

        // Recalculate line total
        updated.total_linea = Number(updated.cantidad) * Number(updated.precio_unitario);
        return updated;
      }
      return d;
    }));
  };

  // Calculations
  const subtotal = detalles.reduce((acc, d) => acc + d.total_linea, 0);
  const iva = tipoDocumento === 'FACTURA' ? 0.19 : 0;
  const impuestoTotal = subtotal * iva;
  const total = subtotal + impuestoTotal;

  const handleSubmit = async () => {
    if (!clienteSeleccionado) {
      toast.error('Debes seleccionar un cliente de la base de datos.');
      return;
    }
    if (detalles.length === 0) {
      toast.error('Debes agregar al menos un servicio al presupuesto.');
      return;
    }

    setLoading(true);

    const data = {
      cliente_id: parseInt(clienteId),
      direccion_historica: direccionSeleccionada,
      solicitado_por: solicitadoPor || '',
      fecha_emision: fecha ? format(fecha, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      motivo_servicio: motivo,
      tipo_documento: tipoDocumento,
      subtotal,
      iva,
      impuesto_total: impuestoTotal,
      total,
      condiciones,
      detalles: detalles.map(d => ({
        servicio_id: parseInt(d.servicio_id),
        cantidad: Number(d.cantidad),
        precio_unitario: Number(d.precio_unitario),
        total_linea: Number(d.total_linea)
      }))
    };

    const res = await createPresupuesto(data);
    if (res.success) {
      router.push(`/dashboard/presupuestos/${res.insertId}`);
    } else {
      toast.error(res.error || 'Error al guardar el presupuesto');
      setLoading(false);
    }
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Nueva Pre-venta</h1>
      </div>



      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 space-y-8">

        {/* Cabecera del Documento */}
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

          <div className="space-y-1.5 col-span-1 md:col-span-2 lg:col-span-1">
            <label className="text-sm font-semibold text-zinc-800">Dirección a asociar <span className="text-red-500">*</span></label>
            <Select 
              value={direccionSeleccionada}
              onValueChange={setDireccionSeleccionada}
              disabled={!clienteSeleccionado || !clienteSeleccionado.direcciones || clienteSeleccionado.direcciones.length <= 1}
            >
              <SelectTrigger className="w-full bg-white h-10 shadow-sm border-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed">
                <SelectValue placeholder={!clienteSeleccionado ? "Selecciona un cliente primero" : "Selecciona una dirección"} />
              </SelectTrigger>
              <SelectContent position="popper" side="bottom">
                {clienteSeleccionado?.direcciones?.map((dir: string, i: number) => (
                  <SelectItem key={i} value={dir}>{dir} {i === 0 ? '(Principal)' : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-800">Nombre del Solicitante</label>
            <Input value={solicitadoPor} onChange={e => setSolicitadoPor(e.target.value)} placeholder="Ej: Juan Carlos" className="h-10 bg-white" />
          </div>

          <div className="space-y-1.5">
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

          <div className="space-y-1.5 col-span-1 md:col-span-2">
            <label className="text-sm font-semibold text-zinc-800">Motivo del Servicio u Obra</label>
            <Input value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Ej: Remodelación Oficina Central" className="h-10 bg-white" />
          </div>


        </div>

        <hr className="border-zinc-200" />

        {/* Detalles / Ítems */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Ítems a Cotizar</h2>
            <ServiciosSelectionModal
              servicios={servicios}
              initialSelectedIds={detalles.map(d => d.servicio_id)}
              onAddServicios={handleUpdateServicios}
            />
          </div>

          <div className="border border-zinc-200 rounded-md bg-white shadow-sm overflow-hidden">
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
                          value={new Intl.NumberFormat('es-CL').format(Number(d.precio_unitario))}
                          disabled
                          className="h-9 w-[120px] ml-auto text-right disabled:opacity-70 disabled:bg-zinc-100 disabled:text-zinc-500 disabled:cursor-not-allowed shadow-sm font-medium"
                        />
                      </TableCell>
                      <TableCell className="text-right font-semibold text-zinc-800">
                        {formatMoney(d.total_linea)}
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

        <hr className="border-zinc-200" />

        {/* Resumen Total y Condiciones */}
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
                onClick={() => setCondiciones(prev => prev + (prev ? '\n\n' : '') + 'Este presupuesto tiene una vigencia de 07 días continuos')}
              >
                + Vigencia 7 días
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs bg-zinc-50 hover:bg-zinc-100 h-auto py-1.5 px-3 text-zinc-600 text-left"
                onClick={() => setCondiciones(prev => prev + (prev ? '\n\n' : '') + 'Validez de la oferta: 15 días hábiles.\nForma de pago: 50% anticipo, 50% al finalizar.')}
              >
                + Condiciones estándar
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs bg-zinc-50 hover:bg-zinc-100 h-auto py-1.5 px-3 text-zinc-600 text-left max-w-full"
                onClick={() => setCondiciones(prev => prev + (prev ? '\n\n' : '') + 'El gabinete base de meson fabricado en melamina (se fabricará lo más similar parecido al color del existente) 18mm de espesor, con cantos PVC termofusionados 1.5mm de espesor, repisas interiores')}
              >
                + Gabinete Melamina
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 flex-1 flex flex-col justify-center space-y-3 bg-zinc-50/80">
              <div className="flex justify-between items-center text-zinc-600 text-sm">
                <span className="font-medium">Subtotal</span>
                <span className="font-semibold text-zinc-900">{formatMoney(subtotal)}</span>
              </div>

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

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-4 pt-4">
          <Button variant="ghost" onClick={() => router.push('/dashboard/presupuestos')} className="w-full sm:w-auto">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading} size="lg" className="w-full sm:w-auto px-8 bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar Pre-venta
          </Button>
        </div>

      </div>
    </div>
  );
}
