import { SidebarTrigger } from '@/components/ui/sidebar';

export function ClientHeader({ userName }: { userName: string }) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4 shadow-sm">
      <SidebarTrigger className="-ml-1" />
      <span className="font-bold text-lg tracking-tight ml-2">Panel del Cliente</span>
      <div className="flex-1"></div>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-600 font-medium">{userName}</span>
      </div>
    </header>
  );
}
