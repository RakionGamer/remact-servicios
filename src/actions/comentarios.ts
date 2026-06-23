'use server';

import pool from '@/lib/db';
import { getSession } from '@/actions/auth';
import { revalidatePath } from 'next/cache';

export async function getComentarios(presupuesto_id: number) {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, u.nombre as usuario_nombre, u.rol as usuario_rol
      FROM presupuestos_comentarios c
      JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.presupuesto_id = ?
      ORDER BY c.fecha_creacion ASC
    `, [presupuesto_id]);
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createComentario(presupuesto_id: number, mensaje: string) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: 'No autorizado' };
    }

    const [result] = await pool.query(
      'INSERT INTO presupuestos_comentarios (presupuesto_id, usuario_id, mensaje) VALUES (?, ?, ?)',
      [presupuesto_id, session.id, mensaje]
    );

    const insertId = (result as any).insertId;

    // Obtener el comentario insertado
    const [rows] = await pool.query(`
      SELECT c.*, u.nombre as usuario_nombre, u.rol as usuario_rol
      FROM presupuestos_comentarios c
      JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.id = ?
    `, [insertId]);

    const newComment = (rows as any[])[0];

    revalidatePath(`/dashboard/presupuestos/${presupuesto_id}`);
    revalidatePath(`/portal/presupuestos/${presupuesto_id}`);

    return { success: true, data: newComment };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
