-- Marca si el transporte anterior era eléctrico (sin estimación de CO₂)
ALTER TABLE rental_applications
  ADD COLUMN is_electric TINYINT(1) NOT NULL DEFAULT 0 AFTER distance_km;
