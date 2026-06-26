'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getInformes() {
  try {
    const [rows] = await pool.query(`
      SELECT i.*, c.razon_social as cliente_nombre_actual 
      FROM informes i 
      LEFT JOIN clientes c ON i.cliente_id = c.id
      ORDER BY i.id DESC
    `);
    
    const data = (rows as any[]).map(row => {
      let snapshot = null;
      try {
        snapshot = row.cliente_snapshot ? (typeof row.cliente_snapshot === 'string' ? JSON.parse(row.cliente_snapshot) : row.cliente_snapshot) : null;
      } catch (e) {}
      
      return {
        ...row,
        cliente_nombre: row.cliente_nombre_actual || (snapshot ? snapshot.razon_social : 'Cliente Eliminado')
      };
    });

    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching informes:', error);
    return { success: false, error: error.message };
  }
}

export async function getInformeById(id: number) {
  try {
    const [rows] = await pool.query(`
      SELECT i.*, c.razon_social as cliente_nombre_actual 
      FROM informes i 
      LEFT JOIN clientes c ON i.cliente_id = c.id
      WHERE i.id = ?
    `, [id]);
    const rawData = rows as any[];
    if (rawData.length === 0) return { success: true, data: null };
    
    const row = rawData[0];
    let snapshot = null;
    try {
      snapshot = row.cliente_snapshot ? (typeof row.cliente_snapshot === 'string' ? JSON.parse(row.cliente_snapshot) : row.cliente_snapshot) : null;
    } catch (e) {}
    
    row.cliente_nombre = row.cliente_nombre_actual || (snapshot ? snapshot.razon_social : 'Cliente Eliminado');
    if (!row.cliente_nombre_actual && snapshot) {
      // Si el cliente fue eliminado, inyectamos los datos del snapshot para el PDF
      row.cliente_rut = snapshot.identificador_fiscal;
      row.cliente_giro = snapshot.giro;
      row.cliente_telefono = snapshot.telefono;
      row.cliente_correo = snapshot.correo;
    }
    
    return { success: true, data: row };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

import { getClienteById } from '@/actions/clientes';

export async function createInforme(data: any) {
  try {
    const { 
      cliente_id, 
      solicitado_por, 
      direccion_obra, 
      comuna, 
      trabajos_solicitados, 
      fecha_inicio, 
      fecha_fin, 
      fecha_informe, 
      trabajos_realizados, 
      imagenes,
      observaciones,
      link_fotografias,
      cliente_nombre
    } = data;

    let clienteData = null;
    if (cliente_id) {
      const clientRes = await getClienteById(cliente_id);
      if (clientRes.success && clientRes.data) {
        clienteData = clientRes.data;
      }
    } else if (cliente_nombre) {
      clienteData = { razon_social: cliente_nombre };
    }

    const [result] = await pool.query(
      `INSERT INTO informes (cliente_id, cliente_snapshot, solicitado_por, direccion_obra, comuna, trabajos_solicitados, fecha_inicio, fecha_fin, fecha_informe, trabajos_realizados, imagenes, observaciones, link_fotografias)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cliente_id,
        JSON.stringify(clienteData),
        solicitado_por,
        direccion_obra,
        comuna,
        trabajos_solicitados,
        fecha_inicio,
        fecha_fin,
        fecha_informe,
        JSON.stringify(trabajos_realizados || []),
        JSON.stringify(imagenes || []),
        JSON.stringify(observaciones || []),
        link_fotografias || null
      ]
    );

    revalidatePath('/dashboard/informes');
    return { success: true, insertId: (result as any).insertId };
  } catch (error: any) {
    console.error('Error creating informe:', error);
    return { success: false, error: error.message };
  }
}

export async function updateInforme(id: number, data: any) {
  try {
    const { 
      solicitado_por, 
      direccion_obra, 
      comuna, 
      trabajos_solicitados, 
      fecha_inicio, 
      fecha_fin, 
      fecha_informe, 
      trabajos_realizados, 
      imagenes,
      observaciones,
      link_fotografias,
      cliente_nombre
    } = data;

    let updateQuery = `UPDATE informes 
       SET solicitado_por = ?, direccion_obra = ?, comuna = ?, trabajos_solicitados = ?, fecha_inicio = ?, fecha_fin = ?, fecha_informe = ?, trabajos_realizados = ?, imagenes = ?, observaciones = ?, link_fotografias = ?`;
    let queryParams = [
        solicitado_por,
        direccion_obra,
        comuna,
        trabajos_solicitados,
        fecha_inicio,
        fecha_fin,
        fecha_informe,
        JSON.stringify(trabajos_realizados || []),
        JSON.stringify(imagenes || []),
        JSON.stringify(observaciones || []),
        link_fotografias || null
    ];

    if (cliente_nombre) {
      updateQuery += `, cliente_id = NULL, cliente_snapshot = ?`;
      queryParams.push(JSON.stringify({ razon_social: cliente_nombre }));
    }

    updateQuery += ` WHERE id = ?`;
    queryParams.push(id);

    await pool.query(updateQuery, queryParams);


    revalidatePath('/dashboard/informes');
    revalidatePath(`/dashboard/informes/${id}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating informe:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteInforme(id: number) {
  try {
    const { getSession } = await import('@/actions/auth');
    const session = await getSession();
    if (session?.rol !== 'ADMIN') {
      return { success: false, error: 'No tienes permisos para eliminar informes' };
    }
    await pool.query('DELETE FROM informes WHERE id = ?', [id]);
    revalidatePath('/dashboard/informes');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
