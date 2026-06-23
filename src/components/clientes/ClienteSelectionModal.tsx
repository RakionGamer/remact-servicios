'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Building2, UserCircle2 } from 'lucide-react';

interface ClienteSelectionModalProps {
  clientes: any[];
  onSelectCliente: (clienteId: string) => void;
  triggerButton?: React.ReactNode;
}

export function ClienteSelectionModal({ clientes, onSelectCliente, triggerButton }: ClienteSelectionModalProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  // Filter clients based on search query
  const filteredClientes = useMemo(() => {
    if (!query) return clientes;
    const lowerQuery = query.toLowerCase();
    return clientes.filter(c =>
      c.razon_social?.toLowerCase().includes(lowerQuery) ||
      c.identificador_fiscal?.toLowerCase().includes(lowerQuery) ||
      c.nombre_contacto?.toLowerCase().includes(lowerQuery)
    );
  }, [clientes, query]);

  const handleSelect = (id: number) => {
    onSelectCliente(id.toString());
    setOpen(false);
    setTimeout(() => {
      setQuery('');
    }, 200);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setTimeout(() => {
        setQuery('');
      }, 200);
    }
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
              Busca y selecciona el cliente al cual se emitirá el presupuesto.
            </DialogDescription>
          </DialogHeader>

          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Buscar por RUT, Razón Social/Nombre completo"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 bg-zinc-50/50 min-h-0">
          {filteredClientes.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              No se encontraron clientes que coincidan con la búsqueda.
            </div>
          ) : (
            <div className="space-y-1 p-4">
              {filteredClientes.map(c => (
                <div
                  key={c.id}
                  onClick={() => handleSelect(c.id)}
                  className="flex items-start gap-3 p-4 rounded-lg border bg-white border-zinc-200 cursor-pointer transition-colors hover:border-blue-300 hover:bg-blue-50/30"
                >
                  <div className="pt-0.5">
                    {c.tipo_cliente === 'EMPRESA' ? (
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                        <Building2 className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full">
                        <UserCircle2 className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-zinc-900">{c.razon_social}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                      <p className="text-xs text-zinc-500"><span className="font-medium text-zinc-700">RUT:</span> {c.identificador_fiscal}</p>
                      {c.nombre_contacto && (
                        <p className="text-xs text-zinc-500"><span className="font-medium text-zinc-700">Contacto:</span> {c.nombre_contacto}</p>
                      )}
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
