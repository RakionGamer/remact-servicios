'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/actions/auth';

export async function getPresupuestos() {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, 
             COALESCE(p.cliente_razon_social, c.razon_social) as cliente_nombre, 
             COALESCE(p.cliente_identificador, c.identificador_fiscal) as cliente_rut,
             v.nombre as vendedor_nombre, a.nombre as aprobador_nombre,
             COALESCE(p.direccion_historica, (SELECT direccion FROM direcciones_cliente dc WHERE dc.cliente_id = p.cliente_id ORDER BY es_principal DESC LIMIT 1)) as cliente_direccion
      FROM presupuestos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
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
      SELECT p.*, 
             COALESCE(p.cliente_razon_social, c.razon_social) as cliente_nombre, 
             COALESCE(p.cliente_identificador, c.identificador_fiscal) as cliente_rut, 
             COALESCE(p.cliente_tipo, c.tipo_cliente) as tipo_cliente,
             COALESCE(p.cliente_telefono, c.telefono) as cliente_telefono, 
             COALESCE(p.cliente_correo, c.correo) as cliente_correo,
             v.nombre as vendedor_nombre, a.nombre as aprobador_nombre,
             COALESCE(p.direccion_historica, (SELECT direccion FROM direcciones_cliente dc WHERE dc.cliente_id = p.cliente_id ORDER BY es_principal DESC LIMIT 1)) as cliente_direccion
      FROM presupuestos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN usuarios v ON p.vendedor_id = v.id
      LEFT JOIN usuarios a ON p.aprobador_id = a.id
      WHERE p.id = ?
    `, [id]);
    
    if ((presupuestoRows as any[]).length === 0) {
      return { success: false, error: 'Presupuesto no encontrado' };
    }

    const [detallesRows] = await pool.query(`
      SELECT pd.*, 
             COALESCE(pd.servicio_item, s.item) as servicio_nombre, 
             COALESCE(pd.servicio_unidad_medida, s.unidad_medida) as unidad_medida
      FROM presupuestos_detalle pd
      LEFT JOIN servicios s ON pd.servicio_id = s.id
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

    const { cliente_id, direccion_historica, fecha_emision, solicitado_por, motivo_servicio, tipo_documento, subtotal, iva, impuesto_total, total, condiciones, detalles } = data;
    const session = await getSession();
    const vendedor_id = session ? session.id : null;

    const [clienteRows] = await connection.query('SELECT * FROM clientes WHERE id = ?', [cliente_id]);
    const c = (clienteRows as any[])[0];

    const [headerResult] = await connection.query(
      `INSERT INTO presupuestos 
       (cliente_id, cliente_razon_social, cliente_identificador, cliente_correo, cliente_telefono, cliente_tipo, direccion_historica, vendedor_id, estado, fecha_emision, solicitado_por, motivo_servicio, tipo_documento, subtotal, iva, impuesto_total, total, condiciones) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'BORRADOR', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [cliente_id, c?.razon_social || null, c?.identificador_fiscal || null, c?.correo || null, c?.telefono || null, c?.tipo_cliente || null, direccion_historica || null, vendedor_id, fecha_emision, solicitado_por, motivo_servicio, tipo_documento, subtotal, iva, impuesto_total, total, condiciones]
    );

    const presupuestoId = (headerResult as any).insertId;

    for (const detalle of detalles) {
      const [servicioRows] = await connection.query('SELECT * FROM servicios WHERE id = ?', [detalle.servicio_id]);
      const s = (servicioRows as any[])[0];

      await connection.query(
        `INSERT INTO presupuestos_detalle 
         (presupuestos_id, servicio_id, servicio_item, servicio_caracteristica, servicio_unidad_medida, cantidad, precio_unitario_historico, total_linea) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [presupuestoId, detalle.servicio_id, s?.item || null, s?.caracteristica || null, s?.unidad_medida || null, detalle.cantidad, detalle.precio_unitario, detalle.total_linea]
      );
    }

    await connection.commit();
    revalidatePath('/dashboard/presupuestos');
    return { success: true, insertId: presupuestoId };
  } catch (error: any) {
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
      SELECT p.*, 
             COALESCE(p.cliente_razon_social, c.razon_social) as cliente_nombre,
             v.nombre as vendedor_nombre, a.nombre as aprobador_nombre,
             COALESCE(p.direccion_historica, (SELECT direccion FROM direcciones_cliente dc WHERE dc.cliente_id = p.cliente_id ORDER BY es_principal DESC LIMIT 1)) as cliente_direccion
      FROM presupuestos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
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

    const [rows] = await connection.query('SELECT estado, vendedor_id FROM presupuestos WHERE id = ?', [id]);
    const p = (rows as any[])[0];
    if (!p) throw new Error('Presupuesto no encontrado');
    if (p.estado && p.estado !== 'BORRADOR' && p.estado !== 'RECHAZADO' && p.estado !== 'SOLICITADO' && p.estado !== 'EN_REVISION') {
      throw new Error('Solo se pueden modificar presupuestos en borrador, solicitado, revisión o rechazado');
    }

    const { cliente_id, direccion_historica, fecha_emision, solicitado_por, motivo_servicio, tipo_documento, subtotal, iva, impuesto_total, total, condiciones, detalles } = data;

    const session = await getSession();
    let nuevoEstado = p.estado;
    let nuevoVendedor = p.vendedor_id;

    if (p.estado === 'SOLICITADO') {
      nuevoEstado = 'BORRADOR';
      nuevoVendedor = session ? session.id : null;
    }

    const [clienteRows] = await connection.query('SELECT * FROM clientes WHERE id = ?', [cliente_id]);
    const c = (clienteRows as any[])[0];

    await connection.query(
      `UPDATE presupuestos 
       SET cliente_id = ?, cliente_razon_social = ?, cliente_identificador = ?, cliente_correo = ?, cliente_telefono = ?, cliente_tipo = ?, direccion_historica = ?, fecha_emision = ?, solicitado_por = ?, motivo_servicio = ?, tipo_documento = ?, subtotal = ?, iva = ?, impuesto_total = ?, total = ?, condiciones = ?, estado = ?, vendedor_id = ?
       WHERE id = ?`,
      [cliente_id, c?.razon_social || null, c?.identificador_fiscal || null, c?.correo || null, c?.telefono || null, c?.tipo_cliente || null, direccion_historica || null, fecha_emision, solicitado_por, motivo_servicio, tipo_documento, subtotal, iva, impuesto_total, total, condiciones, nuevoEstado, nuevoVendedor, id]
    );

    await connection.query('DELETE FROM presupuestos_detalle WHERE presupuestos_id = ?', [id]);

    for (const detalle of detalles) {
      const [servicioRows] = await connection.query('SELECT * FROM servicios WHERE id = ?', [detalle.servicio_id]);
      const s = (servicioRows as any[])[0];

      await connection.query(
        `INSERT INTO presupuestos_detalle 
         (presupuestos_id, servicio_id, servicio_item, servicio_caracteristica, servicio_unidad_medida, cantidad, precio_unitario_historico, total_linea) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, detalle.servicio_id, s?.item || null, s?.caracteristica || null, s?.unidad_medida || null, detalle.cantidad, detalle.precio_unitario, detalle.total_linea]
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

export async function duplicatePresupuesto(id: number) {
  try {
    const originalResult = await getPresupuestoById(id);
    if (!originalResult.success || !originalResult.data) {
      return { success: false, error: 'No se encontró el presupuesto original' };
    }

    const original = originalResult.data;

    // Crear la data duplicada
    const newData = {
      cliente_id: original.cliente_id,
      direccion_historica: original.direccion_historica,
      fecha_emision: new Date().toISOString().split('T')[0], // Forzar fecha actual
      solicitado_por: original.solicitado_por,
      motivo_servicio: original.motivo_servicio,
      tipo_documento: 'PRE-VENTA', // Forzar a pre-venta
      subtotal: original.subtotal,
      iva: original.iva,
      impuesto_total: original.impuesto_total,
      total: original.total,
      condiciones: original.condiciones,
      detalles: original.detalles.map((d: any) => ({
        servicio_id: d.servicio_id,
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario_historico, // Mapear desde _historico hacia la prop que createPresupuesto espera
        total_linea: d.total_linea
      }))
    };

    // Llamamos a createPresupuesto para re-utilizar la lógica limpia de inserción
    // createPresupuesto ya fuerza el estado inicial a "BORRADOR"
    const createResult = await createPresupuesto(newData);
    return createResult;
  } catch (error: any) {
    console.error('Error duplicating presupuesto:', error);
    return { success: false, error: error.message };
  }
}
