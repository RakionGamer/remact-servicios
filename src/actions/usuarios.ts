'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';



export async function getUsuarios() {
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.nombre, u.email, u.rol, u.cliente_id, c.razon_social as cliente_nombre 
      FROM usuarios u
      LEFT JOIN clientes c ON u.cliente_id = c.id
      WHERE u.eliminado = 0
      ORDER BY u.id DESC
    `);
    return { success: true, data: rows as any[] };
  } catch (error: any) {
    console.error('Error fetching usuarios:', error);
    return { success: false, error: error.message };
  }
}

export async function createUsuario(data: any) {
  try {
    const { nombre, email, password, rol, cliente_id } = data;
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol, cliente_id) 
       VALUES (?, ?, ?, ?, NULL)`,
      [nombre, email, passwordHash, rol]
    );
    revalidatePath('/dashboard/usuarios');
    return { success: true, insertId: (result as any).insertId };
  } catch (error: any) {
    console.error('Error creating usuario:', error);
    return { success: false, error: error.message };
  }
}

export async function updateUsuario(id: number, data: any) {
  try {
    const { nombre, email, password, rol } = data;

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      await pool.query(
        `UPDATE usuarios 
         SET nombre = ?, email = ?, password_hash = ?, rol = ?, cliente_id = NULL
         WHERE id = ?`,
        [nombre, email, passwordHash, rol, id]
      );
    } else {
      await pool.query(
        `UPDATE usuarios 
         SET nombre = ?, email = ?, rol = ?, cliente_id = NULL
         WHERE id = ?`,
        [nombre, email, rol, id]
      );
    }
    
    // No revalidatePath aquí — el cliente llama router.refresh() después de cerrar el modal
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}



export async function deleteUsuario(id: number) {
  try {
    await pool.query('UPDATE usuarios SET eliminado = 1 WHERE id = ?', [id]);
    revalidatePath('/dashboard/usuarios');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function changePasswordAction(userId: number, currentPassword: string, newPassword: string) {
  try {
    const [rows] = await pool.query('SELECT password_hash FROM usuarios WHERE id = ?', [userId]);
    const usuarios = rows as any[];
    if (usuarios.length === 0) return { success: false, error: 'Usuario no encontrado' };

    const isValid = await bcrypt.compare(currentPassword, usuarios[0].password_hash);
    if (!isValid) return { success: false, error: 'Contraseña actual incorrecta' };

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE usuarios SET password_hash = ? WHERE id = ?', [newHash, userId]);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

