'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Building2 } from 'lucide-react';

interface Cliente {
  id: number;
  razon_social: string;
  identificador_fiscal: string;
  correo: string;
}

interface ClienteSelectionModalProps {
  clientes: Cliente[];
  onSelectCliente: (cliente: Cliente) => void;
  triggerButton?: React.ReactNode;
}

export function ClienteSelectionModal({ clientes, onSelectCliente, triggerButton }: ClienteSelectionModalProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filteredClientes = useMemo(() => {
    if (!query) return clientes;
    const lowerQuery = query.toLowerCase();
    return clientes.filter(c =>
      c.razon_social?.toLowerCase().includes(lowerQuery) ||
      c.identificador_fiscal?.toLowerCase().includes(lowerQuery) ||
      c.correo?.toLowerCase().includes(lowerQuery)
    );
  }, [clientes, query]);

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

          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Buscar por empresa, RUT o correo..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
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
                  <div className="flex-1">
                    <p className="font-bold text-sm text-zinc-900">{c.razon_social}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{c.identificador_fiscal}</p>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <p className="text-xs font-medium text-zinc-600">{c.correo || 'Sin correo'}</p>
                    </div>
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
