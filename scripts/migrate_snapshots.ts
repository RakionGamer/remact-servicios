import pool from '../src/lib/db';

async function migrate() {
  try {
    console.log('1. Añadiendo columnas a presupuestos...');
    await pool.query(`ALTER TABLE presupuestos 
      ADD COLUMN cliente_razon_social VARCHAR(255) NULL,
      ADD COLUMN cliente_identificador VARCHAR(20) NULL,
      ADD COLUMN cliente_correo VARCHAR(255) NULL,
      ADD COLUMN cliente_telefono VARCHAR(50) NULL,
      ADD COLUMN cliente_tipo ENUM('NATURAL', 'JURIDICA') NULL;
    `).catch(e => { if (e.code !== 'ER_DUP_FIELDNAME') throw e; else console.log('Columnas ya existen en presupuestos'); });

    console.log('2. Añadiendo columnas a presupuestos_detalle...');
    await pool.query(`ALTER TABLE presupuestos_detalle 
      ADD COLUMN servicio_item VARCHAR(255) NULL,
      ADD COLUMN servicio_caracteristica ENUM('Empresa', 'Particular') NULL,
      ADD COLUMN servicio_unidad_medida VARCHAR(50) NULL;
    `).catch(e => { if (e.code !== 'ER_DUP_FIELDNAME') throw e; else console.log('Columnas ya existen en presupuestos_detalle'); });

    console.log('3. Haciendo cliente_id y servicio_id nullables...');
    await pool.query(`ALTER TABLE presupuestos MODIFY cliente_id INT NULL`);
    await pool.query(`ALTER TABLE presupuestos_detalle MODIFY servicio_id INT NULL`);

    console.log('4. Eliminando FK constraint actual de presupuestos -> clientes');
    const [rows] = await pool.query(`
      SELECT CONSTRAINT_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'presupuestos' AND COLUMN_NAME = 'cliente_id' AND REFERENCED_TABLE_NAME = 'clientes'
    `);
    if ((rows as any[]).length > 0) {
      const fkName = (rows as any[])[0].CONSTRAINT_NAME;
      await pool.query(`ALTER TABLE presupuestos DROP FOREIGN KEY ${fkName}`);
    }

    console.log('5. Añadiendo nueva FK constraint ON DELETE SET NULL para presupuestos -> clientes');
    await pool.query(`ALTER TABLE presupuestos ADD CONSTRAINT fk_presupuesto_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL`).catch(e => { if(e.code !== 'ER_DUP_KEYNAME') throw e; });

    console.log('6. Eliminando FK constraint actual de presupuestos_detalle -> servicios');
    const [rows2] = await pool.query(`
      SELECT CONSTRAINT_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'presupuestos_detalle' AND COLUMN_NAME = 'servicio_id' AND REFERENCED_TABLE_NAME = 'servicios'
    `);
    if ((rows2 as any[]).length > 0) {
      const fkName2 = (rows2 as any[])[0].CONSTRAINT_NAME;
      await pool.query(`ALTER TABLE presupuestos_detalle DROP FOREIGN KEY ${fkName2}`);
    }

    console.log('7. Añadiendo nueva FK constraint ON DELETE SET NULL para presupuestos_detalle -> servicios');
    await pool.query(`ALTER TABLE presupuestos_detalle ADD CONSTRAINT fk_presupuesto_servicio FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE SET NULL`).catch(e => { if(e.code !== 'ER_DUP_KEYNAME') throw e; });

    console.log('8. Llenando datos históricos (backfill) para presupuestos...');
    await pool.query(`
      UPDATE presupuestos p 
      JOIN clientes c ON p.cliente_id = c.id 
      SET 
        p.cliente_razon_social = c.razon_social,
        p.cliente_identificador = c.identificador_fiscal,
        p.cliente_correo = c.correo,
        p.cliente_telefono = c.telefono,
        p.cliente_tipo = c.tipo_cliente
      WHERE p.cliente_razon_social IS NULL
    `);

    console.log('9. Llenando datos históricos (backfill) para presupuestos_detalle...');
    await pool.query(`
      UPDATE presupuestos_detalle pd 
      JOIN servicios s ON pd.servicio_id = s.id 
      SET 
        pd.servicio_item = s.item,
        pd.servicio_caracteristica = s.caracteristica,
        pd.servicio_unidad_medida = s.unidad_medida
      WHERE pd.servicio_item IS NULL
    `);

    console.log('Migración de snapshots completada con éxito.');
    process.exit(0);
  } catch (err) {
    console.error('Error durante la migración:', err);
    process.exit(1);
  }
}

migrate();
