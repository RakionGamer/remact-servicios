import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'remact_servicios'
  });

  try {
    console.log("Altering servicios...");
    await connection.query('ALTER TABLE servicios ADD COLUMN activo TINYINT(1) DEFAULT 1;');
  } catch(e) {
    console.log("Servicios column already exists or error: ", e.message);
  }

  try {
    console.log("Altering clientes...");
    await connection.query('ALTER TABLE clientes ADD COLUMN activo TINYINT(1) DEFAULT 1;');
  } catch(e) {
    console.log("Clientes column already exists or error: ", e.message);
  }

  try {
    console.log("Altering usuarios...");
    await connection.query('ALTER TABLE usuarios ADD COLUMN eliminado TINYINT(1) DEFAULT 0;');
  } catch(e) {
    console.log("Usuarios column already exists or error: ", e.message);
  }

  console.log("Done.");
  process.exit(0);
}

run();
