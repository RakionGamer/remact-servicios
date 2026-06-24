'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getClientes() {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, 
        (SELECT direccion FROM direcciones_cliente dc WHERE dc.cliente_id = c.id ORDER BY es_principal DESC LIMIT 1) as direccion
      FROM clientes c ORDER BY id DESC
    `);
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    console.error('Error fetching clientes:', error);
    return { success: false, error: error.message };
  }
}



export async function getClienteById(id: number) {
  try {
    const [rows] = await pool.query('SELECT * FROM clientes WHERE id = ?', [id]);
    const data = rows as any[];
    if (data.length === 0) return { success: true, data: null };
    
    const cliente = data[0];
    const [dirRows] = await pool.query('SELECT direccion, es_principal FROM direcciones_cliente WHERE cliente_id = ? ORDER BY es_principal DESC, id ASC', [id]);
    cliente.direcciones = (dirRows as any[]).map(d => d.direccion);
    
    return { success: true, data: cliente };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createCliente(data: any) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { tipo_cliente, identificador_fiscal, razon_social, nombre_contacto, giro, direcciones, telefono, correo } = data;
    
    const finalRut = identificador_fiscal && identificador_fiscal.trim() !== '' ? identificador_fiscal : null;

    const [result] = await connection.query(
      `INSERT INTO clientes (tipo_cliente, identificador_fiscal, razon_social, nombre_contacto, giro, telefono, correo) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tipo_cliente, finalRut, razon_social, nombre_contacto, giro, telefono, correo]
    );
    const insertId = (result as any).insertId;

    if (direcciones && Array.isArray(direcciones) && direcciones.length > 0) {
      for (let i = 0; i < direcciones.length; i++) {
        const dir = direcciones[i];
        if (dir.trim() !== '') {
          await connection.query(
            `INSERT INTO direcciones_cliente (cliente_id, direccion, es_principal) VALUES (?, ?, ?)`,
            [insertId, dir, i === 0]
          );
        }
      }
    }

    await connection.commit();
    revalidatePath('/dashboard/clientes');
    return { success: true, insertId };
  } catch (error: any) {
    await connection.rollback();
    console.error('Error creating cliente:', error);
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function updateCliente(id: number, data: any) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { tipo_cliente, identificador_fiscal, razon_social, nombre_contacto, giro, direcciones, telefono, correo } = data;

    const finalRut = identificador_fiscal && identificador_fiscal.trim() !== '' ? identificador_fiscal : null;

    await connection.query(
      `UPDATE clientes 
       SET tipo_cliente = ?, identificador_fiscal = ?, razon_social = ?, nombre_contacto = ?, giro = ?, telefono = ?, correo = ?
       WHERE id = ?`,
      [tipo_cliente, finalRut, razon_social, nombre_contacto, giro, telefono, correo, id]
    );

    if (direcciones && Array.isArray(direcciones)) {
      await connection.query('DELETE FROM direcciones_cliente WHERE cliente_id = ?', [id]);
      for (let i = 0; i < direcciones.length; i++) {
        const dir = direcciones[i];
        if (dir.trim() !== '') {
          await connection.query(
            `INSERT INTO direcciones_cliente (cliente_id, direccion, es_principal) VALUES (?, ?, ?)`,
            [id, dir, i === 0]
          );
        }
      }
    }

    await connection.commit();
    return { success: true };
  } catch (error: any) {
    await connection.rollback();
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function deleteCliente(id: number) {
  try {
    const { getSession } = await import('@/actions/auth');
    const session = await getSession();
    if (session?.rol !== 'ADMIN') {
      return { success: false, error: 'No tienes permisos para eliminar clientes' };
    }
    await pool.query('DELETE FROM clientes WHERE id = ?', [id]);
    revalidatePath('/dashboard/clientes');
    return { success: true, deleted: 'hard' as const };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


