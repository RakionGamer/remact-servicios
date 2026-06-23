'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getClientes() {
  try {
    const [rows] = await pool.query('SELECT * FROM clientes WHERE activo = 1 ORDER BY id DESC');
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    console.error('Error fetching clientes:', error);
    return { success: false, error: error.message };
  }
}

export async function getClientesInactivos() {
  try {
    const [rows] = await pool.query('SELECT * FROM clientes WHERE activo = 0 ORDER BY id DESC');
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    console.error('Error fetching clientes inactivos:', error);
    return { success: false, error: error.message };
  }
}

export async function getClienteById(id: number) {
  try {
    const [rows] = await pool.query('SELECT * FROM clientes WHERE id = ?', [id]);
    const data = rows as any[];
    return { success: true, data: data[0] || null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createCliente(data: any) {
  try {
    const { tipo_cliente, identificador_fiscal, razon_social, nombre_contacto, giro, direccion, telefono, correo } = data;
    const [result] = await pool.query(
      `INSERT INTO clientes (tipo_cliente, identificador_fiscal, razon_social, nombre_contacto, giro, direccion, telefono, correo) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tipo_cliente, identificador_fiscal, razon_social, nombre_contacto, giro, direccion, telefono, correo]
    );
    revalidatePath('/dashboard/clientes');
    return { success: true, insertId: (result as any).insertId };
  } catch (error: any) {
    console.error('Error creating cliente:', error);
    return { success: false, error: error.message };
  }
}

export async function updateCliente(id: number, data: any) {
  try {
    const { tipo_cliente, identificador_fiscal, razon_social, nombre_contacto, giro, direccion, telefono, correo } = data;
    await pool.query(
      `UPDATE clientes 
       SET tipo_cliente = ?, identificador_fiscal = ?, razon_social = ?, nombre_contacto = ?, giro = ?, direccion = ?, telefono = ?, correo = ?
       WHERE id = ?`,
      [tipo_cliente, identificador_fiscal, razon_social, nombre_contacto, giro, direccion, telefono, correo, id]
    );
    // No revalidatePath aquí — el cliente llama router.refresh() después de cerrar el modal
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCliente(id: number) {
  try {
    // Verificar si el cliente tiene presupuestos vinculados
    const [rows] = await pool.query(
      'SELECT COUNT(*) as total FROM presupuestos WHERE cliente_id = ?',
      [id]
    );
    const total = (rows as any[])[0]?.total ?? 0;

    if (total > 0) {
      // Tiene presupuestos → soft delete
      await pool.query('UPDATE clientes SET activo = 0 WHERE id = ?', [id]);
      revalidatePath('/dashboard/clientes');
      return { success: true, deleted: 'soft' as const };
    } else {
      // Sin presupuestos → eliminación real
      await pool.query('DELETE FROM clientes WHERE id = ?', [id]);
      revalidatePath('/dashboard/clientes');
      return { success: true, deleted: 'hard' as const };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function reactivarCliente(id: number) {
  try {
    await pool.query('UPDATE clientes SET activo = 1 WHERE id = ?', [id]);
    revalidatePath('/dashboard/clientes');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteClientePermanente(id: number) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Eliminar detalles de todos los presupuestos del cliente
    await connection.query(
      'DELETE pd FROM presupuestos_detalle pd JOIN presupuestos p ON pd.presupuestos_id = p.id WHERE p.cliente_id = ?',
      [id]
    );

    // Eliminar los presupuestos del cliente
    await connection.query('DELETE FROM presupuestos WHERE cliente_id = ?', [id]);

    // Eliminar el cliente
    await connection.query('DELETE FROM clientes WHERE id = ?', [id]);

    await connection.commit();
    revalidatePath('/dashboard/clientes');
    revalidatePath('/dashboard/presupuestos');
    return { success: true };
  } catch (error: any) {
    await connection.rollback();
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}
