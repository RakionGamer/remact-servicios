'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/actions/auth';

export async function getConfiguracion(llave: string) {
  try {
    const [rows] = await pool.query('SELECT valor FROM configuracion WHERE llave = ?', [llave]);
    const configs = rows as any[];
    return { success: true, data: configs.length > 0 ? configs[0].valor : null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getConfiguraciones() {
  try {
    const [rows] = await pool.query('SELECT llave, valor FROM configuracion');
    const dict: Record<string, string> = {};
    (rows as any[]).forEach(row => {
      dict[row.llave] = row.valor;
    });
    return { success: true, data: dict };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateConfiguracion(llave: string, valor: string) {
  try {
    const session = await getSession();
    if (!session || session.rol !== 'ADMIN') {
      return { success: false, error: 'No autorizado' };
    }
    await pool.query(
      'INSERT INTO configuracion (llave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = ?',
      [llave, valor, valor]
    );
    revalidatePath('/dashboard/configuracion');
    revalidatePath('/dashboard/presupuestos/[id]', 'page');
    revalidatePath('/portal/presupuestos/[id]', 'page');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
