-- Asignar bici ficticia a un usuario (después de aprobar la solicitud por mail)
-- Reemplazá el email por el del usuario que solicitó la bici.

USE bikeshare_ucu;

SET @user_email = 'nicolasgobbo123@gmail.com';  -- <-- CAMBIAR por el email del usuario
SET @semester = '2026-S1';

-- 1) Crear bici de prueba si no existe
INSERT INTO bikes (code, model, status, current_lat, current_lng, last_gps_update)
SELECT 'UCU-001', 'Mountain Bike UCU', 'available', -34.8893849, -56.1585772, NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM bikes WHERE code = 'UCU-001');

-- 2) Obtener IDs
SET @user_id = (SELECT id FROM users WHERE email = @user_email LIMIT 1);
SET @bike_id = (SELECT id FROM bikes WHERE code = 'UCU-001' LIMIT 1);

-- 3) Marcar solicitud pendiente como aprobada
UPDATE rental_applications
SET status = 'approved', reviewed_at = NOW()
WHERE user_id = @user_id AND status = 'pending';

-- 4) Crear préstamo activo
INSERT INTO loans (bike_id, user_id, status, semester, approval_date)
VALUES (@bike_id, @user_id, 'active', @semester, NOW());

-- 5) Marcar bici como prestada
UPDATE bikes SET status = 'loaned' WHERE id = @bike_id;

SELECT 'Listo. El usuario debería ver su bici en Mi Bici.' AS resultado;
