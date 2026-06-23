import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getSession } from '@/actions/auth';

export async function Header() {
  const session = await getSession();

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4 shadow-sm">
      <SidebarTrigger className="-ml-1" />
      <span className="font-bold text-lg tracking-tight ml-2">Dashboard</span>
      <div className="flex-1"></div>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-600 font-medium">
          {session ? `${session.nombre}` : 'Cargando...'}
        </span>
      </div>
    </header>
  );
}
