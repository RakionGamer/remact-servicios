const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAdmin() {
  // Capturar argumentos: node scripts/create-admin.js <email> <password> <nombre>
  const email = process.argv[2] || 'admin@remact.cl';
  const password = process.argv[3] || 'Admin123!';
  const nombre = process.argv[4] || 'Administrador Principal';

  console.log(`Iniciando registro de administrador...`);
  console.log(`Email: ${email}`);

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'remact_servicios',
    });

    const [rows] = await connection.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (rows.length > 0) {
      console.log(`\n[AVISO] El usuario con el email '${email}' ya existe. No se hicieron cambios.`);
      connection.end();
      return;
    }

    // Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insertar usuario
    await connection.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol, activo) VALUES (?, ?, ?, 'ADMIN', TRUE)`,
      [nombre, email, passwordHash]
    );

    console.log(`\n[ÉXITO] Administrador creado correctamente en la base de datos.`);
    console.log(`Puedes iniciar sesión con:`);
    console.log(`- Email: ${email}`);
    console.log(`- Contraseña: ${password}`);
    
    connection.end();
  } catch (error) {
    console.error('\n[ERROR] Hubo un problema al registrar al administrador:', error.message);
  }
}

createAdmin();
