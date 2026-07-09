import { getPresupuestos } from '@/actions/presupuestos';
import { SearchInput } from '@/components/ui/search-input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PresupuestosTable } from '@/components/presupuestos/PresupuestosTable';
import { FolderArchive } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PresupuestosPage({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams;
  const query = params?.q?.toLowerCase() || '';
  const showPapelera = params?.papelera === 'true';

  const result = await getPresupuestos();
  let presupuestos = result.success && result.data ? result.data : [];

  const totalEnPapelera = presupuestos.filter((p: any) => p.en_papelera === 1).length;

  // Filter based on trash view
  if (showPapelera) {
    presupuestos = presupuestos.filter((p: any) => p.en_papelera === 1);
  } else {
    presupuestos = presupuestos.filter((p: any) => p.en_papelera !== 1);
  }

  if (query) {
    presupuestos = presupuestos.filter((p: any) =>
      p.cliente_nombre?.toLowerCase().includes(query) ||
      p.cliente_rut?.toLowerCase().includes(query) ||
      p.motivo_servicio?.toLowerCase().includes(query) ||
      p.id?.toString().includes(query)
    );
  }

  const trashLinkUrl = `/dashboard/presupuestos?papelera=${showPapelera ? 'false' : 'true'}${query ? `&q=${query}` : ''}`;

  return (
    <div className="space-y-6">
      <PresupuestosTable
        initialPresupuestos={presupuestos}
        searchElement={
          <div className="flex gap-2 w-full items-center">
            <div className="flex-1">
              <SearchInput placeholder="Buscar por N°, cliente, RUT o motivo..." />
            </div>
            <Button
              variant={showPapelera ? "default" : "outline"}
              className={showPapelera ? "bg-amber-600 hover:bg-amber-700 text-white" : "text-zinc-500"}
              asChild
            >
              <Link href={trashLinkUrl}>
                <FolderArchive className="w-4 h-4 mr-2" />
                Papelera ({totalEnPapelera})
              </Link>
            </Button>
          </div>
        }
        headerAction={
          <Button asChild className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm font-medium w-full sm:w-auto h-auto py-3 sm:py-2">
            <Link href="/dashboard/presupuestos/nuevo">
              Nueva Pre-venta
            </Link>
          </Button>
        }
      />
    </div>
  );
}
