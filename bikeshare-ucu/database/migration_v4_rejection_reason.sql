-- Motivo de rechazo en solicitudes de alquiler
USE bikeshare_ucu;

ALTER TABLE rental_applications
  ADD COLUMN rejection_reason TEXT NULL AFTER status;
