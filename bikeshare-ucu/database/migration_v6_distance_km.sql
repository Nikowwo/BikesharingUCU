-- Distancia en km hasta la facultad
USE bikeshare_ucu;

ALTER TABLE rental_applications
  ADD COLUMN distance_km DECIMAL(5, 2) NULL AFTER previous_transport;
