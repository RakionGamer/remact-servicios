'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createServicio } from '@/actions/servicios';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ServicioFormModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [caracteristica, setCaracteristica] = useState<'Empresa' | 'Particular' | ''>('');
  const [valorUnitario, setValorUnitario] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0, opacity: 0 });

  useEffect(() => {
    if (!caracteristica) {
      setSliderStyle(prev => ({ ...prev, opacity: 0 }));
      return;
    }
    const container = containerRef.current;
    if (!container) return;
    const btn = container.querySelector(`button[data-value="${caracteristica}"]`) as HTMLButtonElement;
    if (btn) {
      setSliderStyle({
        left: btn.offsetLeft,
        width: btn.offsetWidth,
        opacity: 1
      });
    }
  }, [caracteristica]);

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) {
      setValorUnitario('');
      return;
    }
    const formatted = new Intl.NumberFormat('es-CL').format(parseInt(rawValue, 10));
    setValorUnitario(formatted);
  };

  async function action(formData: FormData) {
    setLoading(true);
    setError('');

    const rawValor = formData.get('valor_unitario') as string;
    const numericValor = rawValor.replace(/\./g, '');

    const data = {
      item: formData.get('item'),
      caracteristica: formData.get('caracteristica') || null,
      zona: formData.get('zona'),
      unidad_medida: formData.get('unidad_medida'),
      valor_unitario: parseInt(numericValor, 10),
    };

    const result = await createServicio(data);

    if (result.success) {
      setOpen(false);
      setValorUnitario('');
      setCaracteristica('');
      toast.success('Servicio creado correctamente');
      setTimeout(() => setLoading(false), 500);
    } else {
      toast.error(result.error || 'Hubo un error al crear el servicio');
      setError(result.error || 'Hubo un error al crear el servicio');
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) setError(''); }}>
      <DialogTrigger asChild>
        <Button>Nuevo Servicio</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl">Crear Servicio</DialogTitle>
          <DialogDescription>
            Agrega un nuevo ítem al catálogo de presupuestos.
          </DialogDescription>
        </DialogHeader>
        
        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Nombre del Servicio / Ítem <span className="text-red-500">*</span></label>
            <Input name="item" required placeholder="Ej: Pintura de Muro" className="h-10" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Característica <span className="text-muted-foreground font-normal">(Opcional)</span></label>
            <input type="hidden" name="caracteristica" value={caracteristica} />
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
                onClick={() => setCaracteristica(caracteristica === 'Empresa' ? '' : 'Empresa')}
                className={`relative px-4 h-8 flex items-center justify-center text-sm font-medium rounded-md transition-colors duration-200 ${
                  caracteristica === 'Empresa'
                    ? 'text-white dark:text-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                Empresa
              </button>
              <button
                type="button"
                data-value="Particular"
                onClick={() => setCaracteristica(caracteristica === 'Particular' ? '' : 'Particular')}
                className={`relative px-4 h-8 flex items-center justify-center text-sm font-medium rounded-md transition-colors duration-200 ${
                  caracteristica === 'Particular'
                    ? 'text-white dark:text-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                Particular
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Zona</label>
              <Input name="zona" placeholder="Ej: Oeste, Este, etc." className="h-10" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Unidad de Medida <span className="text-red-500">*</span></label>
              <Input name="unidad_medida" required placeholder="Ej: m2, UNID., ml" className="h-10" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Valor Unitario (CLP) <span className="text-red-500">*</span></label>
            <Input 
              name="valor_unitario" 
              type="text" 
              required 
              placeholder="4.800" 
              className="h-10" 
              value={valorUnitario}
              onChange={handleValorChange}
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
              Guardar Servicio
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
