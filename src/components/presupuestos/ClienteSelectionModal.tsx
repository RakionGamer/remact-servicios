'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Cliente {
  id: number;
  razon_social: string;
  identificador_fiscal: string;
  correo: string;
  tipo_cliente?: string;
}

interface ClienteSelectionModalProps {
  clientes: Cliente[];
  onSelectCliente: (cliente: Cliente) => void;
  triggerButton?: React.ReactNode;
}

export function ClienteSelectionModal({ clientes, onSelectCliente, triggerButton }: ClienteSelectionModalProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filterTipo, setFilterTipo] = useState<'Todas' | 'Empresa' | 'Natural'>('Todas');

  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0, opacity: 0 });

  useEffect(() => {
    const updateSlider = () => {
      const container = containerRef.current;
      if (!container) return;
      const btn = container.querySelector(`button[data-value="${filterTipo}"]`) as HTMLButtonElement;
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
  }, [filterTipo, open]);

  const filteredClientes = useMemo(() => {
    let result = clientes;
    if (filterTipo === 'Empresa') {
      result = result.filter(c => c.tipo_cliente === 'JURIDICA');
    } else if (filterTipo === 'Natural') {
      result = result.filter(c => c.tipo_cliente === 'NATURAL');
    }

    if (query) {
      const lowerQuery = query.toLowerCase();
      result = result.filter(c =>
        c.razon_social?.toLowerCase().includes(lowerQuery) ||
        c.identificador_fiscal?.toLowerCase().includes(lowerQuery) ||
        c.correo?.toLowerCase().includes(lowerQuery)
      );
    }
    return result;
  }, [clientes, query, filterTipo]);

  const handleSelect = (cliente: Cliente) => {
    onSelectCliente(cliente);
    setOpen(false);
    setTimeout(() => setQuery(''), 200);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) setTimeout(() => setQuery(''), 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button type="button" variant="outline" className="w-full justify-start text-left font-normal bg-white">
            <Search className="w-4 h-4 mr-2 text-zinc-400" />
            <span className="text-zinc-500">Seleccionar cliente...</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-6 pb-4 border-b shrink-0">
          <DialogHeader>
            <DialogTitle className="text-xl">Seleccionar Cliente</DialogTitle>
            <DialogDescription>
              Busca y selecciona la empresa/cliente que solicita el presupuesto.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row items-center gap-3 mt-4">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Buscar por empresa, RUT o correo..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 h-10 w-full"
                autoFocus
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
                onClick={() => setFilterTipo('Todas')}
                className={`relative px-4 h-8 flex items-center justify-center text-sm font-medium rounded-md transition-colors duration-200 ${
                  filterTipo === 'Todas'
                    ? 'text-white dark:text-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                data-value="Empresa"
                onClick={() => setFilterTipo('Empresa')}
                className={`relative px-4 h-8 flex items-center justify-center text-sm font-medium rounded-md transition-colors duration-200 ${
                  filterTipo === 'Empresa'
                    ? 'text-white dark:text-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                Empresa
              </button>
              <button
                type="button"
                data-value="Natural"
                onClick={() => setFilterTipo('Natural')}
                className={`relative px-4 h-8 flex items-center justify-center text-sm font-medium rounded-md transition-colors duration-200 ${
                  filterTipo === 'Natural'
                    ? 'text-white dark:text-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                Natural
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 bg-zinc-50/50 min-h-0">
          {filteredClientes.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              {clientes.length === 0
                ? 'No hay clientes registrados en la base de datos.'
                : 'No se encontraron clientes que coincidan con la búsqueda.'}
            </div>
          ) : (
            <div className="space-y-1 p-4">
              {filteredClientes.map(c => (
                <div
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className="flex items-start gap-3 p-4 rounded-lg border bg-white border-zinc-200 cursor-pointer transition-colors hover:border-gray-300 hover:bg-gray-50/30"
                >
                  <div className="pt-0.5">
                    <div className="p-2 border-gray-100 border-2 text-gray-600 rounded-full">
                      <Building2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col items-start gap-1">
                    <p className="font-bold text-sm text-zinc-900 truncate w-full">{c.razon_social}</p>
                    {c.tipo_cliente && (
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium shrink-0",
                        c.tipo_cliente === 'JURIDICA' ? "bg-zinc-900 text-white" : 
                        c.tipo_cliente === 'NATURAL' ? "bg-red-700 text-white" : 
                        "bg-blue-50 text-blue-700"
                      )}>
                        {c.tipo_cliente === 'JURIDICA' ? 'Empresa' : c.tipo_cliente === 'NATURAL' ? 'Natural' : c.tipo_cliente}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
