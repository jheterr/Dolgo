CREATE DATABASE IF NOT EXISTS dolgo_db;
USE dolgo_db;

-- Users table handles all user types (Admin, Staff, Customer)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff', 'customer') NOT NULL DEFAULT 'customer',
    status ENUM('pending', 'active', 'suspended') DEFAULT 'pending',
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    location VARCHAR(100),
    mac_address VARCHAR(17),
    profile_picture LONGTEXT,
    type ENUM('member', 'walkin', 'staff') DEFAULT 'member',
    schedule TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Membership tiers
CREATE TABLE IF NOT EXISTS membership_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration_days INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Active/past memberships for customers
CREATE TABLE IF NOT EXISTS user_memberships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES membership_plans(id)
);

-- Floor Plans (Dynamic Layouts)
CREATE TABLE IF NOT EXISTS floor_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    width INT DEFAULT 800,
    height INT DEFAULT 450,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Floor Elements (Seats, Tables, Rooms, Walls, etc. inside a Floor Plan)
CREATE TABLE IF NOT EXISTS floor_elements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    floor_plan_id INT NOT NULL,
    element_type VARCHAR(50) NOT NULL,
    label VARCHAR(50), 
    pos_x INT NOT NULL,
    pos_y INT NOT NULL,
    width INT NOT NULL,
    height INT NOT NULL,
    rotation INT DEFAULT 0,
    color VARCHAR(20),
    capacity INT DEFAULT 1,
    status ENUM('open', 'taken', 'reserved', 'maintenance') DEFAULT 'open',
    image LONGTEXT,
    FOREIGN KEY (floor_plan_id) REFERENCES floor_plans(id) ON DELETE CASCADE
);

-- Reservations for seats or rooms (references floor_elements)
CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    element_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    amount DECIMAL(10,2) DEFAULT 0.00,
    payment_method ENUM('cashier', 'gcash') DEFAULT 'cashier',
    payment_status ENUM('unpaid', 'paid') DEFAULT 'unpaid',
    reference_number VARCHAR(100),
    proof_image LONGTEXT,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (element_id) REFERENCES floor_elements(id) ON DELETE CASCADE
);

-- Walk-in Sessions (For Mikrotik Hotspot and Staff Panel)
CREATE TABLE IF NOT EXISTS active_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    start_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    status ENUM('active', 'completed') DEFAULT 'active',
    mac_address VARCHAR(17),
    ip_address VARCHAR(45),
    is_paused BOOLEAN DEFAULT FALSE,
    remaining_seconds INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Door Management Access Logs
CREATE TABLE IF NOT EXISTS door_access_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    door_name VARCHAR(50) NOT NULL,
    method VARCHAR(50) DEFAULT 'RFID',
    access_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('granted', 'denied', 'unlocked', 'locked') NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seat Transfer Requests
CREATE TABLE IF NOT EXISTS seat_transfer_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    current_element_id INT NOT NULL,
    requested_element_id INT NOT NULL,
    status ENUM('pending', 'approved', 'declined') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (current_element_id) REFERENCES floor_elements(id) ON DELETE CASCADE,
    FOREIGN KEY (requested_element_id) REFERENCES floor_elements(id) ON DELETE CASCADE
);

-- Events
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    event_date DATETIME NOT NULL,
    location VARCHAR(100),
    image LONGTEXT,
    price DECIMAL(10,2) DEFAULT 0.00,
    max_attendees INT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (createdBy) REFERENCES users(id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert Default Admin
INSERT IGNORE INTO users (username, email, password_hash, role, status, first_name, last_name) 
VALUES ('admin', 'thelastmuster@gmail.com', '$2b$10$tZ9.fHREKj/Y.R6zXmS6h.UvV8O.W.v.U.V.U.V.U.V.U.V.U.V.U.V.U.', 'admin', 'active', 'Super', 'Admin');
