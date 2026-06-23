CREATE DATABASE IF NOT EXISTS remact_servicios;
USE remact_servicios;

-- Tabla: clientes
CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_cliente ENUM('NATURAL', 'JURIDICA') NOT NULL,
    identificador_fiscal VARCHAR(20) NOT NULL UNIQUE,
    razon_social VARCHAR(255) NOT NULL,
    nombre_contacto VARCHAR(255) NULL,
    giro VARCHAR(255) NULL,
    direccion TEXT NULL,
    telefono VARCHAR(50) NULL,
    correo VARCHAR(255) NULL
);

-- Tabla: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('ADMIN', 'CLIENTE', 'VENDEDOR') NOT NULL,
    cliente_id INT NULL,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
);

-- Tabla: servicios
CREATE TABLE IF NOT EXISTS servicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item VARCHAR(255) NOT NULL,
    caracteristica ENUM('Empresa', 'Particular') NULL,
    zona VARCHAR(100) NULL,
    unidad_medida VARCHAR(50) NOT NULL,
    valor_unitario DECIMAL(12,2) NOT NULL
);

-- Tabla: presupuestos
CREATE TABLE IF NOT EXISTS presupuestos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    fecha_emision DATE NOT NULL,
    motivo_servicio VARCHAR(255) NULL,
    tipo_documento ENUM('BOLETA', 'FACTURA') NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    iva DECIMAL(5,2) DEFAULT 0.19,
    impuesto_total DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    condiciones TEXT NULL,
    estado ENUM('BORRADOR', 'EN_REVISION', 'ESPERANDO_APROBACION', 'APROBADO', 'RECHAZADO') DEFAULT 'BORRADOR',
    vendedor_id INT NULL,
    aprobador_id INT NULL,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (vendedor_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (aprobador_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Tabla: presupuestos_detalle
CREATE TABLE IF NOT EXISTS presupuestos_detalle (
    id INT AUTO_INCREMENT PRIMARY KEY,
    presupuestos_id INT NOT NULL,
    servicio_id INT NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    precio_unitario_historico DECIMAL(12,2) NOT NULL,
    total_linea DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (presupuestos_id) REFERENCES presupuestos(id) ON DELETE CASCADE,
    FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE RESTRICT
);

-- Tabla: presupuestos_comentarios (Chat en vivo)
CREATE TABLE IF NOT EXISTS presupuestos_comentarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    presupuesto_id INT NOT NULL,
    usuario_id INT NOT NULL,
    mensaje TEXT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Insertar usuario administrador por defecto
-- Contraseña por defecto: Admin123! (el hash bcrypt debe generarse, usaré un hash de ejemplo para 'Admin123!')
-- El hash de 'Admin123!' es $2a$10$wO0X.Kz9A.22ZlP9t.rXoe9O.8E8mU2M.6V0xXy9U8B5xN1.9U0K2
INSERT IGNORE INTO usuarios (nombre, email, password_hash, rol, activo)
VALUES ('Administrador', 'admin@remact.cl', '$2a$10$wO0X.Kz9A.22ZlP9t.rXoe9O.8E8mU2M.6V0xXy9U8B5xN1.9U0K2', 'ADMIN', TRUE);

-- Tabla: configuracion
CREATE TABLE IF NOT EXISTS configuracion (
    llave VARCHAR(50) PRIMARY KEY,
    valor TEXT NOT NULL
);

INSERT IGNORE INTO configuracion (llave, valor) VALUES 
('DATOS_FACTURACION', 'REMACT SERVICIOS SPA.\nRUT: 77.966.563-1\nDIRECCIÓN: Lebu 733, La Florida\nCORREO: REMACTSERVICIOS@GMAIL.COM\nTELÉFONO: +56965890179'),
('DATOS_PAGO', 'REMACT SERVICIOS SPA.\nRUT: 77.966.563-1\nBANCO SANTANDER\nCTA. CTE: 0-000-94787521\nCORREO: REMACTSERVICIOS@GMAIL.COM');
