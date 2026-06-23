'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/actions/auth';

export async function getPresupuestos() {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, c.razon_social as cliente_nombre, c.identificador_fiscal as cliente_rut,
             v.nombre as vendedor_nombre, a.nombre as aprobador_nombre
      FROM presupuestos p
      JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN usuarios v ON p.vendedor_id = v.id
      LEFT JOIN usuarios a ON p.aprobador_id = a.id
      ORDER BY p.id DESC
    `);
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPresupuestoById(id: number) {
  try {
    const [presupuestoRows] = await pool.query(`
      SELECT p.*, c.razon_social as cliente_nombre, c.identificador_fiscal as cliente_rut, c.tipo_cliente,
             c.direccion as cliente_direccion, c.telefono as cliente_telefono, c.correo as cliente_correo,
             v.nombre as vendedor_nombre, a.nombre as aprobador_nombre
      FROM presupuestos p
      JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN usuarios v ON p.vendedor_id = v.id
      LEFT JOIN usuarios a ON p.aprobador_id = a.id
      WHERE p.id = ?
    `, [id]);
    
    if ((presupuestoRows as any[]).length === 0) {
      return { success: false, error: 'Presupuesto no encontrado' };
    }

    const [detallesRows] = await pool.query(`
      SELECT pd.*, s.item as servicio_nombre, s.unidad_medida
      FROM presupuestos_detalle pd
      JOIN servicios s ON pd.servicio_id = s.id
      WHERE pd.presupuestos_id = ?
    `, [id]);

    return { 
      success: true, 
      data: {
        ...((presupuestoRows as any[])[0]),
        detalles: detallesRows as any[]
      } 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createPresupuesto(data: any) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { cliente_id, fecha_emision, solicitado_por, motivo_servicio, tipo_documento, subtotal, iva, impuesto_total, total, condiciones, detalles } = data;
    const session = await getSession();
    const vendedor_id = session ? session.id : null;

    // 1. Insertar el presupuesto maestro
    const [headerResult] = await connection.query(
      `INSERT INTO presupuestos 
       (cliente_id, vendedor_id, estado, fecha_emision, solicitado_por, motivo_servicio, tipo_documento, subtotal, iva, impuesto_total, total, condiciones) 
       VALUES (?, ?, 'BORRADOR', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [cliente_id, vendedor_id, fecha_emision, solicitado_por, motivo_servicio, tipo_documento, subtotal, iva, impuesto_total, total, condiciones]
    );

    const presupuestoId = (headerResult as any).insertId;

    // 2. Insertar las líneas de detalle
    for (const detalle of detalles) {
      await connection.query(
        `INSERT INTO presupuestos_detalle 
         (presupuestos_id, servicio_id, cantidad, precio_unitario_historico, total_linea) 
         VALUES (?, ?, ?, ?, ?)`,
        [presupuestoId, detalle.servicio_id, detalle.cantidad, detalle.precio_unitario, detalle.total_linea]
      );
    }

    // Si todo salió bien, guardamos los cambios de manera atómica
    await connection.commit();
    revalidatePath('/dashboard/presupuestos');
    return { success: true, insertId: presupuestoId };
  } catch (error: any) {
    // Si algo falla, revertimos toda la transacción
    await connection.rollback();
    console.error('Error creating presupuesto:', error);
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}



export async function getPresupuestosByCliente(cliente_id: number) {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, c.razon_social as cliente_nombre,
             v.nombre as vendedor_nombre, a.nombre as aprobador_nombre
      FROM presupuestos p
      JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN usuarios v ON p.vendedor_id = v.id
      LEFT JOIN usuarios a ON p.aprobador_id = a.id
      WHERE p.cliente_id = ?
      ORDER BY p.id DESC
    `, [cliente_id]);
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updatePresupuestoEstado(id: number, estado: 'BORRADOR' | 'ESPERANDO_APROBACION' | 'APROBADO' | 'RECHAZADO') {
  try {
    const session = await getSession();
    if (estado === 'APROBADO' || estado === 'RECHAZADO') {
      const aprobador_id = session ? session.id : null;
      await pool.query('UPDATE presupuestos SET estado = ?, aprobador_id = ? WHERE id = ?', [estado, aprobador_id, id]);
    } else {
      await pool.query('UPDATE presupuestos SET estado = ? WHERE id = ?', [estado, id]);
    }
    revalidatePath('/portal/presupuestos');
    revalidatePath('/dashboard/presupuestos');
    revalidatePath(`/portal/presupuestos/${id}`);
    revalidatePath(`/dashboard/presupuestos/${id}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deletePresupuesto(id: number) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Verify it's pending or null
    const [rows] = await connection.query('SELECT estado FROM presupuestos WHERE id = ?', [id]);
    const p = (rows as any[])[0];
    if (!p) throw new Error('Presupuesto no encontrado');
    if (p.estado && p.estado !== 'BORRADOR' && p.estado !== 'RECHAZADO' && p.estado !== 'SOLICITADO' && p.estado !== 'EN_REVISION') {
      throw new Error('Solo se pueden eliminar presupuestos en borrador, solicitado, revisión o rechazado');
    }

    await connection.query('DELETE FROM presupuestos_detalle WHERE presupuestos_id = ?', [id]);
    await connection.query('DELETE FROM presupuestos WHERE id = ?', [id]);

    await connection.commit();
    revalidatePath('/dashboard/presupuestos');
    revalidatePath('/portal/presupuestos');
    return { success: true };
  } catch (error: any) {
    await connection.rollback();
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

export async function updatePresupuesto(id: number, data: any) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Verify it's pending or null
    const [rows] = await connection.query('SELECT estado, vendedor_id FROM presupuestos WHERE id = ?', [id]);
    const p = (rows as any[])[0];
    if (!p) throw new Error('Presupuesto no encontrado');
    if (p.estado && p.estado !== 'BORRADOR' && p.estado !== 'RECHAZADO' && p.estado !== 'SOLICITADO' && p.estado !== 'EN_REVISION') {
      throw new Error('Solo se pueden modificar presupuestos en borrador, solicitado, revisión o rechazado');
    }

    const { cliente_id, fecha_emision, solicitado_por, motivo_servicio, tipo_documento, subtotal, iva, impuesto_total, total, condiciones, detalles } = data;

    const session = await getSession();
    // Si estaba solicitado y no tenía vendedor, al editarlo el vendedor se lo asigna y pasa a BORRADOR
    let nuevoEstado = p.estado;
    let nuevoVendedor = p.vendedor_id;

    if (p.estado === 'SOLICITADO') {
      nuevoEstado = 'BORRADOR';
      nuevoVendedor = session ? session.id : null;
    }

    // Update header
    await connection.query(
      `UPDATE presupuestos 
       SET cliente_id = ?, fecha_emision = ?, solicitado_por = ?, motivo_servicio = ?, tipo_documento = ?, subtotal = ?, iva = ?, impuesto_total = ?, total = ?, condiciones = ?, estado = ?, vendedor_id = ?
       WHERE id = ?`,
      [cliente_id, fecha_emision, solicitado_por, motivo_servicio, tipo_documento, subtotal, iva, impuesto_total, total, condiciones, nuevoEstado, nuevoVendedor, id]
    );

    // Delete old details
    await connection.query('DELETE FROM presupuestos_detalle WHERE presupuestos_id = ?', [id]);

    // Insert new details
    for (const detalle of detalles) {
      await connection.query(
        `INSERT INTO presupuestos_detalle 
         (presupuestos_id, servicio_id, cantidad, precio_unitario_historico, total_linea) 
         VALUES (?, ?, ?, ?, ?)`,
        [id, detalle.servicio_id, detalle.cantidad, detalle.precio_unitario, detalle.total_linea]
      );
    }

    await connection.commit();
    revalidatePath('/dashboard/presupuestos');
    revalidatePath(`/dashboard/presupuestos/${id}`);
    revalidatePath('/portal/presupuestos');
    return { success: true };
  } catch (error: any) {
    await connection.rollback();
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

