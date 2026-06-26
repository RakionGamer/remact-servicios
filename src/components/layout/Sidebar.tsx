import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Home, Users, Briefcase, FileText, Shield, Settings, Calculator } from 'lucide-react';
import { getSession } from '@/actions/auth';
import { LogoutButton } from './LogoutButton';

const items = [
  { title: 'Inicio', url: '/dashboard', icon: Home },
  { title: 'Usuarios', url: '/dashboard/usuarios', icon: Shield },
  { title: 'Clientes', url: '/dashboard/clientes', icon: Users },
  { title: 'Servicios', url: '/dashboard/servicios', icon: Briefcase },
  { title: 'Presupuestos', url: '/dashboard/presupuestos', icon: Calculator },
  { title: 'Informes', url: '/dashboard/informes', icon: FileText },
  { title: 'Configuración', url: '/dashboard/configuracion', icon: Settings },
];

export async function AppSidebar() {
  const session = await getSession();
  const isAdmin = session?.rol === 'ADMIN';

  const filteredItems = items.filter(item => {
    if (isAdmin) return true;
    return ['Inicio', 'Clientes', 'Presupuestos', 'Informes', 'Configuración'].includes(item.title);
  });

  return (
    <Sidebar>
      <SidebarHeader className="h-28 flex items-center justify-center border-b p-2">
        <img src="/remact-logo.png" alt="Remact Logo" className="h-full object-contain" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t flex flex-col gap-2">
        <LogoutButton variant="ghost" className="w-full text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 justify-start h-10 px-3 font-medium">
          Cerrar sesión
        </LogoutButton>
      </SidebarFooter>
    </Sidebar>
  );
}
