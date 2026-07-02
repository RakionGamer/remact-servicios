import type { Metadata } from 'next';
import { Inter, Geist } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/components/providers/QueryProvider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from "@/lib/utils";
import PwaRegister from '@/components/PwaRegister';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const inter = Inter({ subsets: ['latin'] });

import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: 'Remact Servicios',
  description: 'Sistema de gestión de servicios y presupuestos',
  icons: {
    icon: '/remact-logo.webp',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn("font-sans", geist.variable)}>
      <body className={inter.className}>
        <PwaRegister />
        <QueryProvider>
          <TooltipProvider>
            {children}
            <Toaster position="top-center" />
          </TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
