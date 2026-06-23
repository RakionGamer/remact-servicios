import { getUsuarios } from '@/actions/usuarios';
import { UsuarioFormModal } from '@/components/usuarios/UsuarioFormModal';
import { UsuariosTable } from '@/components/usuarios/UsuariosTable';
import { SearchInput } from '@/components/ui/search-input';

export const dynamic = 'force-dynamic';

export default async function UsuariosPage({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams;
  const query = params?.q?.toLowerCase() || '';
  const result = await getUsuarios();
  let usuarios = result.success && result.data ? result.data : [];

  if (query) {
    usuarios = usuarios.filter((u: any) => 
      u.nombre?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query)
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Gestión de Usuarios</h1>
        <UsuarioFormModal />
      </div>

      <div className="flex items-center">
        <SearchInput placeholder="Buscar por nombre o email..." />
      </div>

      <UsuariosTable initialUsuarios={usuarios} />
    </div>
  );
}
