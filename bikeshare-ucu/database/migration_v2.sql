-- Migración v2: login email/contraseña + perfil
-- Ejecutar en phpMyAdmin o: mysql -u root bikeshare_ucu < database/migration_v2.sql

USE bikeshare_ucu;

ALTER TABLE users MODIFY google_id VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL AFTER email;
ALTER TABLE users ADD COLUMN phone VARCHAR(50) NULL AFTER avatar_url;
ALTER TABLE users ADD COLUMN ci VARCHAR(50) NULL AFTER phone;

-- Si alguna columna ya existe, ignorá el error de esa línea y ejecutá el resto.
