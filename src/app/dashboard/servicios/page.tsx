import { getServicios } from '@/actions/servicios';
import { ServicioFormModal } from '@/components/servicios/ServicioFormModal';
import { ServiciosTable } from '@/components/servicios/ServiciosTable';
import { SearchInput } from '@/components/ui/search-input';

export const dynamic = 'force-dynamic';

export default async function ServiciosPage({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams;
  const query = params?.q?.toLowerCase() || '';
  const result = await getServicios();
  let servicios = result.success && result.data ? result.data : [];

  if (query) {
    servicios = servicios.filter((s: any) => 
      s.item?.toLowerCase().includes(query) ||
      s.zona?.toLowerCase().includes(query)
    );
  }

  return (
    <div className="space-y-6">
      <ServiciosTable 
        initialServicios={servicios} 
        searchElement={<SearchInput placeholder="Buscar por ítem o zona..." />}
        headerAction={<ServicioFormModal />}
      />
    </div>
  );
}
