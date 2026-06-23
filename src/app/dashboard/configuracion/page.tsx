import { getConfiguraciones } from '@/actions/configuracion';
import { getSession } from '@/actions/auth';
import { ConfigClient } from './ConfigClient';

export const dynamic = 'force-dynamic';

export default async function ConfiguracionPage() {
  const session = await getSession();
  const res = await getConfiguraciones();
  const configs = res.success && res.data ? res.data : {};

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Configuración</h1>
        <p className="text-zinc-500 mt-1">Administra tu seguridad y los datos globales de la empresa.</p>
      </div>
      
      <ConfigClient session={session} initialConfigs={configs} />
    </div>
  );
}
