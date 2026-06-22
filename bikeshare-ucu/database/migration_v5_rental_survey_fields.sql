-- Días a la facultad y transporte previo (cálculo de impacto)
USE bikeshare_ucu;

ALTER TABLE rental_applications
  ADD COLUMN days_per_week TINYINT NULL AFTER email,
  ADD COLUMN previous_transport VARCHAR(50) NULL AFTER days_per_week;
