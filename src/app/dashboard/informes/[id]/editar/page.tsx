import { getInformeById } from '@/actions/informes';
import { notFound } from 'next/navigation';
import { EditarInformeClient } from './EditarInformeClient';
import { getClientes } from '@/actions/clientes';

export const dynamic = 'force-dynamic';

export default async function EditarInformePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);

  if (isNaN(id)) return notFound();

  const [informeRes, clientesRes] = await Promise.all([
    getInformeById(id),
    getClientes()
  ]);

  if (!informeRes.success || !informeRes.data) {
    return notFound();
  }

  const clientes = clientesRes.success && clientesRes.data ? clientesRes.data : [];

  return <EditarInformeClient informe={informeRes.data} clientes={clientes} />;
}
