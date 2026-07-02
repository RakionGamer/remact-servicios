import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'remact-super-secret-key-2026');

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_session')?.value;
  const { pathname } = request.nextUrl;

  // 1. Proteger rutas privadas
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    try {
      await jwtVerify(token, JWT_SECRET);
    } catch (err) {
      // Token expirado o inválido -> Forzar login
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete('auth_session');
      return response;
    }
  }

  // 2. Prevenir que usuarios logueados vean la página de login
  if (pathname === '/' && token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch (err) {
      // Si falla, permitimos que vea el login para que inicie sesión de nuevo
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/'],
};
