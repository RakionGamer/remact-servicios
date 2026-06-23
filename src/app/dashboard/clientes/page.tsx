import { getClientes, getClientesInactivos } from '@/actions/clientes';
import { ClienteFormModal } from '@/components/clientes/ClienteFormModal';
import { ClientesTable } from '@/components/clientes/ClientesTable';

export const dynamic = 'force-dynamic';

export default async function ClientesPage({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams;
  const query = params?.q?.toLowerCase() || '';
  const res = await getClientes();
  let clientes = res.success && res.data ? res.data : [];

  const resInactivos = await getClientesInactivos();
  const inactivos = resInactivos.success && resInactivos.data ? resInactivos.data : [];

  if (query) {
    clientes = clientes.filter((c: any) => 
      c.razon_social?.toLowerCase().includes(query) ||
      c.identificador_fiscal?.toLowerCase().includes(query)
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Gestión de Clientes</h1>
        <ClienteFormModal />
      </div>

      <ClientesTable initialClientes={clientes} initialInactivos={inactivos} />
    </div>
  );
}
