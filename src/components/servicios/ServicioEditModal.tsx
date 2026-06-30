'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateServicio } from '@/actions/servicios';
import { Loader2, Pencil } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface ServicioEditModalProps {
  servicio: any;
  onOptimisticUpdate: (id: number, data: any) => void;
  onRevert: (id: number, original: any) => void;
  onSuccess: () => void;
}

export function ServicioEditModal({ servicio, onOptimisticUpdate, onRevert, onSuccess }: ServicioEditModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Inputs controlados — evitan el flicker cuando el Server Component re-renderiza con nuevos props
  const [itemValue, setItemValue] = useState(servicio.item || '');
  const [caracteristicaValue, setCaracteristicaValue] = useState<'Empresa' | 'Particular' | ''>(servicio.caracteristica || '');
  const [zonaValue, setZonaValue] = useState<'Oeste' | 'Este' | ''>((servicio.zona as any) || '');
  const [unidadValue, setUnidadValue] = useState(servicio.unidad_medida || '');
  const [valorValue, setValorValue] = useState(servicio.valor_unitario ? new Intl.NumberFormat('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(servicio.valor_unitario) : '');

  const containerRef = useRef<HTMLDivElement>(null);
  const zonaRef = useRef<HTMLDivElement>(null);
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const [zonaSliderStyle, setZonaSliderStyle] = useState({ left: 0, width: 0, opacity: 0 });

  useEffect(() => {
    if (!open) return;
    
    if (!caracteristicaValue) {
      setSliderStyle(prev => prev.opacity === 0 ? prev : { ...prev, opacity: 0 });
      return;
    }
    const updateSlider = () => {
      const container = containerRef.current;
      if (!container) return;
      const btn = container.querySelector(`button[data-value="${caracteristicaValue}"]`) as HTMLButtonElement;
      if (btn && btn.offsetWidth > 0) {
        setSliderStyle(prev => {
          if (prev.left === btn.offsetLeft && prev.width === btn.offsetWidth && prev.opacity === 1) return prev;
          return {
            left: btn.offsetLeft,
            width: btn.offsetWidth,
            opacity: 1
          };
        });
      }
    };
    updateSlider();
    const timeout = setTimeout(updateSlider, 100);
    return () => clearTimeout(timeout);
  }, [caracteristicaValue, open]);

  useEffect(() => {
    if (!open) return;

    if (!zonaValue) {
      setZonaSliderStyle(prev => prev.opacity === 0 ? prev : { ...prev, opacity: 0 });
      return;
    }
    const updateSlider = () => {
      const container = zonaRef.current;
      if (!container) return;
      const btn = container.querySelector(`button[data-value="${zonaValue}"]`) as HTMLButtonElement;
      if (btn && btn.offsetWidth > 0) {
        setZonaSliderStyle(prev => {
          if (prev.left === btn.offsetLeft && prev.width === btn.offsetWidth && prev.opacity === 1) return prev;
          return {
            left: btn.offsetLeft,
            width: btn.offsetWidth,
            opacity: 1
          };
        });
      }
    };
    updateSlider();
    const timeout = setTimeout(updateSlider, 100);
    return () => clearTimeout(timeout);
  }, [zonaValue, open]);

  const handleOpen = () => {
    // Sincronizar estado local con los props al abrir
    setItemValue(servicio.item || '');
    setCaracteristicaValue(servicio.caracteristica || '');
    setZonaValue((servicio.zona as any) || '');
    setUnidadValue(servicio.unidad_medida || '');
    setValorValue(servicio.valor_unitario ? new Intl.NumberFormat('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(servicio.valor_unitario) : '');
    setError('');
    setOpen(true);
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value.replace(/[^0-9,]/g, '');
    
    const parts = rawValue.split(',');
    if (parts.length > 2) {
      rawValue = parts[0] + ',' + parts.slice(1).join('');
    }

    if (!rawValue) {
      setValorValue('');
      return;
    }

    if (rawValue.endsWith(',')) {
      const integerPart = rawValue.slice(0, -1);
      if (integerPart) {
        const formatted = new Intl.NumberFormat('es-CL').format(parseInt(integerPart, 10));
        setValorValue(`${formatted},`);
      } else {
        setValorValue('0,');
      }
      return;
    }

    if (rawValue.includes(',')) {
      const [intPart, decPart] = rawValue.split(',');
      const formattedInt = new Intl.NumberFormat('es-CL').format(parseInt(intPart || '0', 10));
      const limitedDec = decPart.slice(0, 2);
      setValorValue(`${formattedInt},${limitedDec}`);
      return;
    }

    const formatted = new Intl.NumberFormat('es-CL').format(parseInt(rawValue, 10));
    setValorValue(formatted);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanStr = valorValue.replace(/\./g, '').replace(',', '.');

    const newData = {
      item: itemValue,
      caracteristica: caracteristicaValue || null,
      zona: zonaValue,
      unidad_medida: unidadValue,
      valor_unitario: parseFloat(cleanStr),
    };

    // 1. Actualizar la tabla instantáneamente (optimistic)
    onOptimisticUpdate(servicio.id, newData);

    // 2. Llamar al servidor
    const result = await updateServicio(servicio.id, newData);

    if (result.success) {
      // 3a. Éxito: cerrar modal y sincronizar con el servidor
      setOpen(false);
      toast.success('Servicio actualizado correctamente');
      onSuccess();
      setTimeout(() => setLoading(false), 500);
    } else {
      // 3b. Error: revertir el cambio optimista
      onRevert(servicio.id, servicio);
      setError(result.error || 'Hubo un error al actualizar el servicio');
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
          <p>Editar servicio</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-[500px] p-6" onCloseAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl">Editar Servicio</DialogTitle>
          <DialogDescription>
            Modifica los detalles o el precio de este ítem.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Nombre del Servicio / Ítem <span className="text-red-500">*</span></label>
            <Input
              name="item"
              value={itemValue}
              onChange={(e) => setItemValue(e.target.value)}
              required
              className="h-10"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Característica <span className="text-muted-foreground font-normal">(Opcional)</span></label>
            <div ref={containerRef} className="relative inline-flex p-1 bg-zinc-100/80 dark:bg-zinc-800/80 rounded-lg">
              <div
                className="absolute top-1 bottom-1 bg-zinc-900 dark:bg-white rounded-md shadow-sm transition-all duration-300 ease-out"
                style={{
                  left: `${sliderStyle.left}px`,
                  width: `${sliderStyle.width}px`,
                  opacity: sliderStyle.opacity,
                  transform: sliderStyle.opacity ? 'scale(1)' : 'scale(0.95)'
                }}
              />
              <button
                type="button"
                data-value="Empresa"
                onClick={() => setCaracteristicaValue(caracteristicaValue === 'Empresa' ? '' : 'Empresa')}
                className={`relative px-4 h-8 flex items-center justify-center text-sm font-medium rounded-md transition-colors duration-200 ${
                  caracteristicaValue === 'Empresa'
                    ? 'text-white dark:text-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                Empresa
              </button>
              <button
                type="button"
                data-value="Particular"
                onClick={() => setCaracteristicaValue(caracteristicaValue === 'Particular' ? '' : 'Particular')}
                className={`relative px-4 h-8 flex items-center justify-center text-sm font-medium rounded-md transition-colors duration-200 ${
                  caracteristicaValue === 'Particular'
                    ? 'text-white dark:text-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                Particular
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col justify-end space-y-2 pb-1">
              <div className="flex items-center justify-between w-full h-[40px]">
                <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Zona <span className="text-muted-foreground font-normal text-xs">(Opcional)</span></label>
                <div ref={zonaRef} className="relative inline-flex p-1 bg-zinc-100/80 dark:bg-zinc-800/80 rounded-lg">
                  <div
                    className="absolute top-1 bottom-1 bg-zinc-900 dark:bg-white rounded-md shadow-sm transition-all duration-300 ease-out"
                    style={{
                      left: `${zonaSliderStyle.left}px`,
                      width: `${zonaSliderStyle.width}px`,
                      opacity: zonaSliderStyle.opacity,
                      transform: zonaSliderStyle.opacity ? 'scale(1)' : 'scale(0.95)'
                    }}
                  />
                  <button
                    type="button"
                    data-value="Oeste"
                    onClick={() => setZonaValue(zonaValue === 'Oeste' ? '' : 'Oeste')}
                    className={`relative px-4 h-8 flex items-center justify-center text-sm font-medium rounded-md transition-colors duration-200 ${
                      zonaValue === 'Oeste'
                        ? 'text-white dark:text-zinc-900'
                        : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    Oeste
                  </button>
                  <button
                    type="button"
                    data-value="Este"
                    onClick={() => setZonaValue(zonaValue === 'Este' ? '' : 'Este')}
                    className={`relative px-4 h-8 flex items-center justify-center text-sm font-medium rounded-md transition-colors duration-200 ${
                      zonaValue === 'Este'
                        ? 'text-white dark:text-zinc-900'
                        : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    Este
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Unidad de Medida <span className="text-red-500">*</span></label>
              <Input
                name="unidad_medida"
                value={unidadValue}
                onChange={(e) => setUnidadValue(e.target.value)}
                required
                className="h-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Valor Unitario (CLP) <span className="text-red-500">*</span></label>
            <Input
              name="valor_unitario"
              value={valorValue}
              onChange={handleValorChange}
              type="text"
              required
              className="h-10"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Actualizar Servicio
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
