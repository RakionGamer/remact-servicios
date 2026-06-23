const mysql = require('mysql2/promise');
require('dotenv').config();

const servicios = [
  ['Pintura de Muro', null, 'Oeste', 'm2', 4800],
  ['Reparación de Hoyos en Muros de living y dormitorio', null, 'Oeste', 'UNID.', 25000],
  ['Retiro, suministro e instalacion de 5 mts lineal de guardapolvo', null, 'Oeste', 'UNID.', 25000],
  ['Pintura de closet', null, 'Oeste', 'UNID.', 20000],
  ['Suministro e intalacion de focos en living y dormitorio', null, 'Oeste', 'UNID.', 7000],
  ['Reparacion y pintura de puertas', null, 'Oeste', 'UNID.', 27000],
  ['Pintura de guardapolvo', null, 'Oeste', 'UNID.', 25000],
  ['Reparacion de muro  y pintura de Balcon', null, 'Oeste', 'UNID.', 45000],
  ['Pintura de reja del Balcon', null, 'Oeste', 'UNID.', 36000],
  ['Ajuste de bisagra en mueble aereo living', null, 'Oeste', 'UNID.', 1500],
  ['Retiro termo dañado  e instalacion de termoelectrico', null, 'Oeste', 'UNID.', 120000],
  ['Retiro, suministro e instalacion de vidrio baño 50X90cm', null, 'Oeste', 'UNID.', 45000],
  ['Retiro de sellos en tina', null, 'Oeste', 'UNID.', 10000],
  ['Sellado de tina', null, 'Oeste', 'UNID.', 20000],
  ['suministron e instalacion de bisagra para puerta closet lavaderia', null, 'Oeste', 'UNID.', 7500],
  ['Ajuste de soporte portapapel', null, 'Oeste', 'UNID.', 12000],
  ['Suministro e instalación de Gabinete', null, 'Oeste', 'UNID.', 320000],
  ['Pintura de Muros (mano de obra)', null, 'Este', 'm2', 3500],
  ['Pintura de puertas (mano de obra)', null, 'Este', 'UNID.', 15000],
  ['Pintura de marco ventana (mano de obra)', null, 'Este', 'UNID.', 7500],
  ['Suministro de guardapolvo pvc', null, 'Este', 'UNID.', 11500],
  ['Suministro de pegamento para Guardalpolvo pvc', null, 'Este', 'UNID.', 7500],
  ['Suministro de toma corriente 16 amp,', null, 'Este', 'UNID.', 10300],
  ['Suminimistro de toma corriente sencillo', null, 'Este', 'UNID.', 7500],
  ['Suministro de toma corriente doble', null, 'Este', 'UNID.', 8900],
  ['Suminstro de toma corriente triple', null, 'Este', 'UNID.', 9500],
  ['Suministro interruptor sencillo', null, 'Este', 'UNID.', 7200],
  ['Suministro interruptor mixto', null, 'Este', 'UNID.', 11000],
  ['Suministro interruptor doble', null, 'Este', 'UNID.', 9500],
  ['Suministro interruptor triple', null, 'Este', 'UNID.', 10300],
  ['Suministro tapa ciega', null, 'Este', 'UNID.', 3500],
  ['Suministro de tarugos ', null, 'Este', 'UNID.', 3500],
  ['Pintura de cielo en baños (mano de obra)', null, 'Este', 'UNID.', 15000],
  ['Desintalacion pizarra de vidrio y rehubicacion 1,40x1.15 mts, tapar hoyos', null, 'Este', 'UNID.', 35000],
  ['Retiro de mueble aereo , tapar hoyos', null, 'Este', 'UNID.', 10000],
  ['Retiro de buzon 25x35 cm . pasillo exterior , tapar hoyos', null, 'Este', 'UNID.', 10000],
  ['Retiro de pizarra, tapar hoyo', null, 'Este', 'UNID.', 7000],
  ['Retiro de evaporador A/A, tapar hoyos', null, 'Este', 'UNID.', 13000],
  ['Desintalar y rehubicar soporte de TV, tapar hoyos', null, 'Este', 'UNID.', 25000],
  ['Instalacion de toma corrientes', null, 'Este', 'UNID.', 5500],
  ['Intalacion de interruptores', null, 'Este', 'UNID.', 5500],
  ['Instalacion de tapa ciegas', null, 'Este', 'UNID.', 2000],
  ['Instalacion de guardapolvos pvc', null, 'Este', 'ml', 3000],
  ['Retiro de escombros', null, 'Este', 'UNID.', 120000],
  ['Pintura ciclovîas (mano de obra) ', null, 'Este', 'm2', 3600],
  ['Pintura de simbolos de Bicicletas  (mano de Obra ) ', null, 'Este', 'UNID.', 4500]
];

async function seed() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'remact_servicios',
    });

    // Vaciar la tabla primero para evitar duplicados si se corre varias veces
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE servicios');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('Insertando 46 servicios en la base de datos...');
    
    for (const s of servicios) {
      await connection.query(
        'INSERT INTO servicios (item, descripcion, zona, unidad_medida, valor_unitario) VALUES (?, ?, ?, ?, ?)',
        s
      );
    }

    console.log('¡Servicios importados correctamente!');
    connection.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

seed();
