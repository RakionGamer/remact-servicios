'use server';

import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'remact-super-secret-key-2026');

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Email y contraseña requeridos' };
  }

  try {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ? AND eliminado = 0 LIMIT 1', [email]);
    const usuarios = rows as any[];
    
    if (usuarios.length === 0) {
      return { success: false, error: 'Credenciales inválidas' };
    }

    const usuario = usuarios[0];
    

    const isValid = await bcrypt.compare(password, usuario.password_hash);
    
    if (!isValid) {
      return { success: false, error: 'Credenciales inválidas' };
    }

    const payload = { 
      id: usuario.id, 
      nombre: usuario.nombre, 
      rol: usuario.rol, 
      email: usuario.email,
      cliente_id: usuario.cliente_id
    };
    
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h') // Expira en 24 horas
      .sign(JWT_SECRET);

    // 2. Guardar en Cookie segura
    const cookieStore = await cookies();
    cookieStore.set('auth_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 1 día en segundos
    });

    return { 
      success: true, 
      user: payload 
    };

  } catch (error: any) {
    console.error('Login error:', error);
    return { success: false, error: 'Error del servidor' };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_session');
  return { success: true };
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_session')?.value;
  
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (err) {
    return null;
  }
}
