'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getServicios() {
  try {
    const [rows] = await pool.query('SELECT * FROM servicios WHERE activo = 1 ORDER BY id DESC');
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    console.error('Error fetching servicios:', error);
    return { success: false, error: error.message };
  }
}

export async function createServicio(data: any) {
  try {
    const { item, caracteristica, zona, unidad_medida, valor_unitario } = data;
    const [result] = await pool.query(
      `INSERT INTO servicios (item, caracteristica, zona, unidad_medida, valor_unitario) 
       VALUES (?, ?, ?, ?, ?)`,
      [item, caracteristica, zona, unidad_medida, valor_unitario]
    );
    revalidatePath('/dashboard/servicios');
    return { success: true, insertId: (result as any).insertId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateServicio(id: number, data: any) {
  try {
    const { item, caracteristica, zona, unidad_medida, valor_unitario } = data;
    await pool.query(
      `UPDATE servicios 
       SET item = ?, caracteristica = ?, zona = ?, unidad_medida = ?, valor_unitario = ?
       WHERE id = ?`,
      [item, caracteristica, zona, unidad_medida, valor_unitario, id]
    );
    // No revalidatePath aquí — el cliente llama router.refresh() después de cerrar el modal
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteServicio(id: number) {
  try {
    await pool.query('UPDATE servicios SET activo = 0 WHERE id = ?', [id]);
    revalidatePath('/dashboard/servicios');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
