import { getInformes } from '@/actions/informes';
import { InformesTable } from '@/components/informes/InformesTable';
import { getSession } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getConfiguraciones } from '@/actions/configuracion';

export const dynamic = 'force-dynamic';

export default async function InformesPage() {
  const session = await getSession();
  const isAdmin = session?.rol === 'ADMIN';

  const res = await getInformes();
  const informes = res.success && res.data ? res.data : [];

  const configRes = await getConfiguraciones();
  const configs = configRes.success && configRes.data ? configRes.data : {};

  // For the PDF we might need the logo URL, usually served from public folder
  const logoUrl = '/remact-logo.webp'; // It will be converted to absolute URL inside the PDF if needed, but react-pdf usually handles relative or we'll pass base URL

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Informes de Trabajo</h1>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
          <Link href="/dashboard/informes/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Informe
          </Link>
        </Button>
      </div>

      <InformesTable 
        initialInformes={informes} 
        isAdmin={isAdmin} 
        configs={configs}
        logoUrl={logoUrl}
      />
    </div>
  );
}
