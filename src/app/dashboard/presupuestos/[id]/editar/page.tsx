import { getPresupuestoById } from '@/actions/presupuestos';
import { redirect } from 'next/navigation';
import EditPresupuestoClient from './EditPresupuestoClient';
import { getSession } from '@/actions/auth';

export default async function EditarPresupuestoPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id, 10);
  if (isNaN(id)) {
    redirect('/dashboard/presupuestos');
  }

  const result = await getPresupuestoById(id);
  if (!result.success) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-md border border-red-200">
        Error: {result.error || 'Presupuesto no encontrado'}
      </div>
    );
  }

  const presupuesto = result.data;
  if (presupuesto.estado && !['BORRADOR', 'SOLICITADO', 'RECHAZADO', 'EN_REVISION'].includes(presupuesto.estado)) {
    return (
      <div className="p-8 text-center text-amber-600 bg-amber-50 rounded-md border border-amber-200">
        No puedes editar un presupuesto que ya ha sido {presupuesto.estado.toLowerCase()}.
      </div>
    );
  }

  const session = await getSession();

  return <EditPresupuestoClient initialData={presupuesto} userRole={session?.rol as string | undefined} />;
}
