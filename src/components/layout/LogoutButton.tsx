'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { logoutAction } from '@/actions/auth';

interface LogoutButtonProps {
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  children?: React.ReactNode;
}

export function LogoutButton({ className, variant = "outline", children }: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutAction();
    router.push('/login');
    router.refresh();
  };

  return (
    <Button 
      variant={variant} 
      className={className} 
      onClick={handleLogout}
    >
      <LogOut className="w-4 h-4 mr-2" />
      {children || "Cerrar Sesión"}
    </Button>
  );
}
