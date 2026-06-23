'use server';

import pool from '@/lib/db';

export async function getDashboardStats() {
  try {
    const [ingresosResult] = await pool.query('SELECT SUM(total) as totalIngresos FROM presupuestos');
    const totalIngresos = (ingresosResult as any)[0]?.totalIngresos || 0;

    const [clientesResult] = await pool.query('SELECT COUNT(*) as totalClientes FROM clientes');
    const totalClientes = (clientesResult as any)[0]?.totalClientes || 0;

    const [serviciosResult] = await pool.query('SELECT COUNT(*) as totalServicios FROM servicios');
    const totalServicios = (serviciosResult as any)[0]?.totalServicios || 0;

    const [presupuestosResult] = await pool.query('SELECT COUNT(*) as totalPresupuestos FROM presupuestos');
    const totalPresupuestos = (presupuestosResult as any)[0]?.totalPresupuestos || 0;

    // Datos del gráfico (últimos 6 meses)
    const [chartRows] = await pool.query(`
      SELECT 
        DATE_FORMAT(fecha_emision, '%Y-%m') AS month_raw,
        DATE_FORMAT(fecha_emision, '%b') AS month,
        COUNT(id) AS presupuestos,
        COALESCE(SUM(total), 0) AS ingresos
      FROM presupuestos
      WHERE fecha_emision >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY month_raw, month
      ORDER BY month_raw ASC
    `);

    return {
      success: true,
      data: {
        ingresos: parseFloat(totalIngresos),
        clientes: parseInt(totalClientes, 10),
        servicios: parseInt(totalServicios, 10),
        presupuestos: parseInt(totalPresupuestos, 10),
        chartData: (chartRows as any[]).map(row => ({
          month: row.month,
          presupuestos: parseInt(row.presupuestos, 10),
          ingresos: parseFloat(row.ingresos)
        }))
      }
    };
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error);
    return { success: false, error: error.message };
  }
}
