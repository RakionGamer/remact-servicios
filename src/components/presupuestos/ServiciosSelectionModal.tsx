'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiciosSelectionModalProps {
  servicios: any[];
  initialSelectedIds: string[];
  onAddServicios: (selectedServicios: any[]) => void;
  hidePrices?: boolean;
}

export function ServiciosSelectionModal({ servicios, initialSelectedIds, onAddServicios, hidePrices = false }: ServiciosSelectionModalProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filterCaracteristica, setFilterCaracteristica] = useState<'Todas' | 'Empresa' | 'Particular'>('Todas');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0, opacity: 0 });

  useEffect(() => {
    const updateSlider = () => {
      const container = containerRef.current;
      if (!container) return;
      const btn = container.querySelector(`button[data-value="${filterCaracteristica}"]`) as HTMLButtonElement;
      if (btn && btn.offsetWidth > 0) {
        setSliderStyle({
          left: btn.offsetLeft,
          width: btn.offsetWidth,
          opacity: 1
        });
      }
    };
    if (open) {
      setTimeout(updateSlider, 50);
    }
  }, [filterCaracteristica, open]);

  // Filter services based on search query and characteristic
  const filteredServicios = useMemo(() => {
    let result = servicios;
    if (filterCaracteristica !== 'Todas') {
      result = result.filter(s => s.caracteristica === filterCaracteristica);
    }
    if (query) {
      const lowerQuery = query.toLowerCase();
      result = result.filter(s =>
        s.item?.toLowerCase().includes(lowerQuery) ||
        s.categoria?.toLowerCase().includes(lowerQuery)
      );
    }
    return result;
  }, [servicios, query, filterCaracteristica]);

  // Calculate totals
  const selectedServicios = useMemo(() => {
    return servicios.filter(s => selectedIds.has(s.id));
  }, [servicios, selectedIds]);

  const totalMonto = selectedServicios.reduce((acc, curr) => acc + parseFloat(curr.valor_unitario || 0), 0);

  const toggleSelection = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setSelectedIds(new Set(initialSelectedIds.map(id => parseInt(id))));
    } else {
      setTimeout(() => {
        setQuery('');
        setSelectedIds(new Set());
      }, 200);
    }
  };

  const handleConfirm = () => {
    setOpen(false);
    setTimeout(() => {
      onAddServicios(selectedServicios);
      setQuery('');
      setSelectedIds(new Set());
    }, 300); // Wait for Dialog to close and restore scroll before updating the background DOM
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <Plus className="w-4 h-4 mr-2" /> {initialSelectedIds.length > 0 ? 'Editar Selección de Servicios' : 'Buscar y Agregar Servicios'}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden flex flex-col max-h-[85vh]">

        {/* 1. HEADER: Añadido 'shrink-0' */}
        <div className="p-6 pb-4 border-b shrink-0">
          <DialogHeader>
            <DialogTitle className="text-xl">Seleccionar Servicios</DialogTitle>

          </DialogHeader>

          <div className="flex flex-col sm:flex-row items-center gap-3 mt-4">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Buscar por nombre o categoría..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 h-10 w-full"
              />
            </div>
            <div ref={containerRef} className="relative inline-flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg shrink-0 h-10">
              <div
                className="absolute top-1 bottom-1 bg-zinc-900 dark:bg-zinc-100 rounded-md shadow-sm transition-all duration-300 ease-out"
                style={{
                  left: `${sliderStyle.left}px`,
                  width: `${sliderStyle.width}px`,
                  opacity: sliderStyle.opacity,
                  transform: sliderStyle.opacity ? 'scale(1)' : 'scale(0.95)'
                }}
              />
              <button
                type="button"
                data-value="Todas"
                onClick={() => setFilterCaracteristica('Todas')}
                className={`relative px-4 h-8 flex items-center justify-center text-sm font-medium rounded-md transition-colors duration-200 ${
                  filterCaracteristica === 'Todas'
                    ? 'text-white dark:text-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                data-value="Empresa"
                onClick={() => setFilterCaracteristica('Empresa')}
                className={`relative px-4 h-8 flex items-center justify-center text-sm font-medium rounded-md transition-colors duration-200 ${
                  filterCaracteristica === 'Empresa'
                    ? 'text-white dark:text-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                Empresa
              </button>
              <button
                type="button"
                data-value="Particular"
                onClick={() => setFilterCaracteristica('Particular')}
                className={`relative px-4 h-8 flex items-center justify-center text-sm font-medium rounded-md transition-colors duration-200 ${
                  filterCaracteristica === 'Particular'
                    ? 'text-white dark:text-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                Particular
              </button>
            </div>
          </div>
        </div>

        {/* 2. BODY/LISTA: Añadido 'min-h-0' y eliminado el min-h-[300px] problemático */}
        <div className="flex-1 overflow-y-auto p-2 bg-zinc-50/50 min-h-0">
          {filteredServicios.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              No se encontraron servicios que coincidan con la búsqueda.
            </div>
          ) : (
            <div className="space-y-1 p-4">
              {filteredServicios.map(s => {
                const isSelected = selectedIds.has(s.id);
                return (
                  <label
                    key={s.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                      isSelected
                        ? "bg-zinc-50 border-zinc-500 shadow-sm"
                        : "bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                    )}
                  >
                    <div className="pt-0.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(s.id)}
                        className="w-4 h-4 mt-0.5 accent-zinc-900 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1 flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-zinc-900">{s.item}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {s.categoria && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600">
                              {s.categoria}
                            </span>
                          )}
                          {s.caracteristica && (
                            <span className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium",
                              s.caracteristica === 'Empresa' ? "bg-zinc-900 text-white" : 
                              s.caracteristica === 'Particular' ? "bg-red-700 text-white" : 
                              "bg-blue-50 text-blue-700"
                            )}>
                              {s.caracteristica}
                            </span>
                          )}
                        </div>
                      </div>
                      {!hidePrices && (
                        <div className="text-right whitespace-nowrap">
                          <p className="font-bold text-sm text-emerald-700">{formatMoney(parseFloat(s.valor_unitario || 0))}</p>
                          <p className="text-[10px] text-zinc-500 font-medium">por {s.unidad_medida || 'UNID.'}</p>
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. FOOTER: Añadido 'shrink-0' */}
        <div className="p-4 bg-white border-t flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
          <div className="flex flex-col">
            {!hidePrices && (
              <span className="text-lg font-bold text-zinc-900">Monto acumulado: <span className="text-emerald-700">{formatMoney(totalMonto)}</span></span>
            )}
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              className="w-full sm:w-auto"
            >
              Confirmar ({selectedIds.size})
            </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}