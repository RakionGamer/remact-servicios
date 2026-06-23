'use client';

import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition, useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

export function SearchInput({ placeholder = "Buscar..." }: { placeholder?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(searchParams?.get('q') || '');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    setValue('');
    inputRef.current?.focus();
  };

  // Efecto de Debounce para no saturar con re-renders por cada tecla
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentQ = searchParams?.get('q') || '';
      
      // Solo hacer el replace si el texto realmente cambió, evitando el bucle infinito
      if (value !== currentQ) {
        const params = new URLSearchParams(searchParams?.toString() || '');
        if (value) {
          params.set('q', value);
        } else {
          params.delete('q');
        }
        startTransition(() => {
          router.replace(`?${params.toString()}`);
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value, searchParams, router]);

  return (
    <div className="relative w-full sm:w-80">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        ref={inputRef}
        type="search"
        placeholder={placeholder}
        // Ocultamos la X nativa con la pseudo-clase de webkit
        className="pl-9 pr-9 h-10 bg-white [&::-webkit-search-cancel-button]:appearance-none"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      {/* Botón X personalizado de Lucide */}
      {value && (
        <button
          onClick={handleClear}
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-800 transition-colors"
          aria-label="Borrar búsqueda"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
