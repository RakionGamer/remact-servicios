import pool from './src/lib/db';

async function migrate() {
  try {
    console.log('Creando tabla direcciones_cliente...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS direcciones_cliente (
          id INT AUTO_INCREMENT PRIMARY KEY,
          cliente_id INT NOT NULL,
          direccion TEXT NOT NULL,
          es_principal BOOLEAN DEFAULT FALSE,
          FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
      )
    `);

    console.log('Migrando direcciones existentes...');
    // Evitar duplicados si el script se corre 2 veces
    const [rows] = await pool.query('SELECT COUNT(*) as cnt FROM direcciones_cliente');
    if ((rows as any)[0].cnt === 0) {
      await pool.query(`
        INSERT INTO direcciones_cliente (cliente_id, direccion, es_principal)
        SELECT id, direccion, TRUE FROM clientes WHERE direccion IS NOT NULL AND direccion != ''
      `);
    }

    console.log('Añadiendo direccion_historica a presupuestos...');
    // Verificar si existe la columna antes
    try {
      await pool.query('ALTER TABLE presupuestos ADD COLUMN direccion_historica TEXT NULL');
    } catch (e: any) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('La columna ya existe.');
      } else {
        throw e;
      }
    }

    console.log('Exito.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

migrate();
