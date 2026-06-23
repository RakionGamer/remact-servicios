import { getPresupuestos } from '@/actions/presupuestos';
import { SearchInput } from '@/components/ui/search-input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PresupuestosTable } from '@/components/presupuestos/PresupuestosTable';

export const dynamic = 'force-dynamic';

export default async function PresupuestosPage({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams;
  const query = params?.q?.toLowerCase() || '';

  const result = await getPresupuestos();
  let presupuestos = result.success && result.data ? result.data : [];

  if (query) {
    presupuestos = presupuestos.filter((p: any) =>
      p.cliente_nombre?.toLowerCase().includes(query) ||
      p.cliente_rut?.toLowerCase().includes(query) ||
      p.motivo_servicio?.toLowerCase().includes(query)
    );
  }



  return (
    <div className="space-y-6">
      <PresupuestosTable
        initialPresupuestos={presupuestos}
        searchElement={<SearchInput placeholder="Buscar por cliente, RUT o motivo..." />}
        headerAction={
          <Button asChild className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm font-medium">
            <Link href="/dashboard/presupuestos/nuevo">
              Nueva Pre-venta
            </Link>
          </Button>
        }
      />
    </div>
  );
}
