'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateCliente } from '@/actions/clientes';
import { Loader2, Pencil } from 'lucide-react';
import { formatRUT } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface ClienteEditModalProps {
  cliente: any;
  onOptimisticUpdate: (id: number, data: any) => void;
  onRevert: (id: number, original: any) => void;
  onSuccess: () => void;
}

export function ClienteEditModal({ cliente, onOptimisticUpdate, onRevert, onSuccess }: ClienteEditModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [tipoCliente, setTipoCliente] = useState(cliente.tipo_cliente || 'NATURAL');
  const [rutValue, setRutValue] = useState(cliente.identificador_fiscal || '');
  const [nombreValue, setNombreValue] = useState(cliente.razon_social || '');

  // Extraer el teléfono limpio del cliente (sin +56) para el estado inicial
  const initTelefonoRaw = (cliente.telefono || '').replace(/\D/g, '');
  let initTelefono = initTelefonoRaw;
  if (initTelefono.startsWith('569')) {
    initTelefono = initTelefono.substring(2);
  } else if (initTelefono.startsWith('56')) {
    initTelefono = initTelefono.substring(2);
  }
  const [telefonoValue, setTelefonoValue] = useState(initTelefono.slice(0, 9));

  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.startsWith('569')) {
      val = val.substring(2);
    } else if (val.startsWith('56')) {
      val = val.substring(2);
    }

    if (val.length > 0 && !val.startsWith('9')) {
      return;
    }
    setTelefonoValue(val.slice(0, 9));
  };

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRutValue(formatRUT(e.target.value));
  };

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (tipoCliente === 'NATURAL') {
      setNombreValue(e.target.value.replace(/[0-9]/g, ''));
    } else {
      setNombreValue(e.target.value);
    }
  };

  const handleTipoClienteChange = (value: string) => {
    setTipoCliente(value);
    if (value === 'NATURAL') {
      setNombreValue(nombreValue.replace(/[0-9]/g, ''));
    }
  };

  const handleOpen = () => {
    // Sincronizar estado local con los props al abrir
    setTipoCliente(cliente.tipo_cliente || 'NATURAL');
    setRutValue(cliente.identificador_fiscal || '');
    setNombreValue(cliente.razon_social || '');

    let t = (cliente.telefono || '').replace(/\D/g, '');
    if (t.startsWith('569')) t = t.substring(2);
    else if (t.startsWith('56')) t = t.substring(2);
    setTelefonoValue(t.slice(0, 9));

    setOpen(true);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const newData = {
      tipo_cliente: tipoCliente,
      identificador_fiscal: rutValue,
      razon_social: nombreValue,
      nombre_contacto: null,
      giro: null,
      direccion: formData.get('direccion'),
      telefono: '+56' + telefonoValue,
      correo: formData.get('correo'),
    };

    // 1. Aplicar el cambio optimistamente en la tabla
    onOptimisticUpdate(cliente.id, newData);

    // 2. Llamar al servidor
    const result = await updateCliente(cliente.id, newData);

    if (result.success) {
      // 3a. Éxito: cerrar modal y sincronizar con el servidor
      setOpen(false);
      toast.success('Cliente actualizado correctamente');
      onSuccess();
      setTimeout(() => setLoading(false), 500);
    } else {
      // 3b. Error: revertir cambios optimistas
      onRevert(cliente.id, cliente);
      if (result.error?.includes('Duplicate entry')) {
        toast.error('Ya existe otro cliente registrado con este RUT.');
      } else {
        toast.error(result.error || 'Hubo un error al actualizar el cliente');
      }
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setOpen(false); }}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" onClick={handleOpen} className="px-2 text-zinc-500 hover:text-zinc-800">
              <Pencil className="w-4 h-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Editar cliente</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-[650px] p-6" onCloseAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl">Editar Cliente</DialogTitle>
          <DialogDescription>
            Modifica los datos del cliente. Los campos con (<span className="text-red-500 font-bold">*</span>) son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-x-5 gap-y-5">

            {/* Fila 1 */}
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Tipo de Cliente <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-2 h-10">
                <Button
                  type="button"
                  variant={tipoCliente === 'NATURAL' ? 'default' : 'outline'}
                  onClick={() => handleTipoClienteChange('NATURAL')}
                  className="w-full h-full"
                >
                  Natural
                </Button>
                <Button
                  type="button"
                  variant={tipoCliente === 'JURIDICA' ? 'default' : 'outline'}
                  onClick={() => handleTipoClienteChange('JURIDICA')}
                  className="w-full h-full"
                >
                  Empresa
                </Button>
              </div>
            </div>

            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">RUT / RUN <span className="text-red-500">*</span></label>
              <Input
                name="identificador_fiscal"
                value={rutValue}
                onChange={handleRutChange}
                maxLength={12}
                minLength={9}
                required
                placeholder="Ej: 12.345.678-9"
                className="h-10"
              />
            </div>

            {/* Fila 2 */}
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {tipoCliente === 'NATURAL' ? 'Nombre Completo ' : 'Razón Social '}
                <span className="text-red-500">*</span>
              </label>
              <Input
                name="razon_social"
                value={nombreValue}
                onChange={handleNombreChange}
                required
                placeholder={tipoCliente === 'NATURAL' ? "Nombres y Apellidos" : "Nombre de la Empresa"}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Dirección <span className="text-red-500">*</span></label>
              <Input name="direccion" defaultValue={cliente.direccion} required placeholder="Calle, Número, Región" className="h-10" />
            </div>

            {/* Fila 3 */}
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Teléfono <span className="text-red-500">*</span></label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm font-medium">
                  +56
                </span>
                <Input
                  value={telefonoValue}
                  onChange={handleTelefonoChange}
                  required
                  placeholder="912345678"
                  className="h-10 rounded-l-none"
                />
              </div>
            </div>

            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Correo Electrónico</label>
              <Input name="correo" defaultValue={cliente.correo} type="email" placeholder="correo@ejemplo.cl" className="h-10" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Actualizar Cliente
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
