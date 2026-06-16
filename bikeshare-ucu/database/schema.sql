-- BikeShare UCU - Esquema de base de datos
-- Ejecutar en MySQL: CREATE DATABASE bikeshare_ucu; USE bikeshare_ucu; luego este script.

CREATE DATABASE IF NOT EXISTS bikeshare_ucu
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE bikeshare_ucu;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  google_id VARCHAR(255) UNIQUE NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NULL,
  avatar_url TEXT,
  phone VARCHAR(50) NULL,
  ci VARCHAR(50) NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  co2_saved_kg FLOAT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bikes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,         -- ej: "UCU-001"
  model VARCHAR(255),
  status ENUM('available', 'loaned', 'maintenance') DEFAULT 'available',
  current_lat DECIMAL(10, 8),               -- posicion GPS actual
  current_lng DECIMAL(11, 8),
  last_gps_update TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE loans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bike_id INT NOT NULL,
  user_id INT NOT NULL,
  status ENUM('pending', 'active', 'return_requested', 'returned', 'rejected') DEFAULT 'pending',
  semester VARCHAR(20) NOT NULL,            -- ej: "2024-S1"
  request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approval_date TIMESTAMP NULL,
  return_request_date TIMESTAMP NULL,
  return_confirmed_date TIMESTAMP NULL,
  admin_notes TEXT,
  FOREIGN KEY (bike_id) REFERENCES bikes(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE gps_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bike_id INT NOT NULL,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bike_id) REFERENCES bikes(id)
);

CREATE TABLE rental_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  ci VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  address_proof_path VARCHAR(500) NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE damage_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  loan_id INT NOT NULL,
  user_id INT NOT NULL,
  description TEXT NOT NULL,
  photo_urls JSON,                          -- array de URLs de fotos
  status ENUM('open', 'reviewed', 'resolved') DEFAULT 'open',
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_id) REFERENCES loans(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
