-- Cambiar el rol de usuarios para incluir VENDEDOR
ALTER TABLE usuarios MODIFY COLUMN rol ENUM('ADMIN', 'CLIENTE', 'VENDEDOR') NOT NULL;

-- Añadir campos de estado y responsables a los presupuestos
ALTER TABLE presupuestos
ADD COLUMN estado ENUM('BORRADOR', 'EN_REVISION', 'ESPERANDO_APROBACION', 'APROBADO', 'RECHAZADO') DEFAULT 'BORRADOR',
ADD COLUMN vendedor_id INT NULL,
ADD COLUMN aprobador_id INT NULL,
ADD CONSTRAINT fk_presupuestos_vendedor FOREIGN KEY (vendedor_id) REFERENCES usuarios(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_presupuestos_aprobador FOREIGN KEY (aprobador_id) REFERENCES usuarios(id) ON DELETE SET NULL;

-- Crear tabla para los comentarios (chat en vivo)
CREATE TABLE IF NOT EXISTS presupuestos_comentarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    presupuesto_id INT NOT NULL,
    usuario_id INT NOT NULL,
    mensaje TEXT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Añadir el campo para registrar el nombre de la persona que solicitó la cotización
ALTER TABLE presupuestos
ADD COLUMN solicitado_por VARCHAR(255) NULL AFTER fecha_emision;
