'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createCliente } from '@/actions/clientes';
import { Loader2, X } from 'lucide-react';
import { formatRUT } from '@/lib/utils';
import { toast } from 'sonner';

export function ClienteFormModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [tipoCliente, setTipoCliente] = useState('NATURAL');
  const [rutValue, setRutValue] = useState('');
  const [nombreValue, setNombreValue] = useState('');
  const [telefonoValue, setTelefonoValue] = useState('');
  const [direcciones, setDirecciones] = useState<string[]>(['']);

  const handleDireccionChange = (index: number, value: string) => {
    const newDirs = [...direcciones];
    newDirs[index] = value;
    setDirecciones(newDirs);
  };

  const addDireccion = () => setDirecciones([...direcciones, '']);
  const removeDireccion = (index: number) => {
    if (direcciones.length > 1) {
      setDirecciones(direcciones.filter((_, i) => i !== index));
    }
  };

  const handleOpenChange = (v: boolean) => {
    if (v) {
      // Resetear campos al abrir
      setTipoCliente('NATURAL');
      setRutValue('');
      setNombreValue('');
      setTelefonoValue('');
      setDirecciones(['']);
    }
    setOpen(v);
  };

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
    // Si es persona natural, no permitir números. Si es empresa, sí (Ej: Empresa 360 SpA)
    if (tipoCliente === 'NATURAL') {
      setNombreValue(e.target.value.replace(/[0-9]/g, ''));
    } else {
      setNombreValue(e.target.value);
    }
  };

  // Al cambiar el tipo de cliente, limpiar o mantener el nombre según convenga (opcional)
  const handleTipoClienteChange = (value: string) => {
    setTipoCliente(value);
    if (value === 'NATURAL') {
      setNombreValue(nombreValue.replace(/[0-9]/g, ''));
    }
  };

  async function action(formData: FormData) {
    setLoading(true);

    const data = {
      tipo_cliente: tipoCliente,
      identificador_fiscal: rutValue,
      razon_social: nombreValue,
      nombre_contacto: null,
      giro: null,
      direcciones: direcciones.filter(d => d.trim() !== ''),
      telefono: '+56' + telefonoValue,
      correo: formData.get('correo'),
    };

    const result = await createCliente(data);

    if (result.success) {
      setOpen(false);
      toast.success('Cliente creado correctamente');
      setTimeout(() => setLoading(false), 500);
    } else {
      if (result.error?.includes('Duplicate entry')) {
        toast.error('Ya existe un cliente registrado con este RUT.');
      } else {
        toast.error(result.error || 'Hubo un error al crear el cliente');
      }
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Nuevo Cliente</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px] p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl">Agregar Nuevo Cliente</DialogTitle>
          <DialogDescription>
            Ingresa los datos del cliente. Los campos con (<span className="text-red-500 font-bold">*</span>) son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form action={action} key={open ? 'open' : 'closed'} className="space-y-6">
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
              <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">RUT</label>
              <Input
                name="identificador_fiscal"
                value={rutValue}
                onChange={handleRutChange}
                maxLength={12}
                placeholder="Ej: 12.345.678-9 (Opcional)"
                className="h-10"
              />
            </div>

            {/* Fila 2 */}
            <div className="space-y-1.5 col-span-2">
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

            <div className="space-y-1.5 col-span-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Direcciones <span className="text-red-500">*</span></label>
                <Button type="button" variant="ghost" size="sm" onClick={addDireccion} className="h-6 px-2 text-xs">
                  + Agregar otra dirección
                </Button>
              </div>
              <div className="space-y-2">
                {direcciones.map((dir, index) => (
                  <div key={index} className="flex gap-2">
                    <Input 
                      value={dir}
                      onChange={(e) => handleDireccionChange(index, e.target.value)}
                      required={index === 0} 
                      placeholder={index === 0 ? "Dirección Principal (Calle, Número, Región)" : "Otra dirección (Opcional)"} 
                      className="h-10 flex-1" 
                    />
                    {index > 0 && (
                      <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100" onClick={() => removeDireccion(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
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
              <Input name="correo" type="email" placeholder="correo@ejemplo.cl" className="h-10" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cliente
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
