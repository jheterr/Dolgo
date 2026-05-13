-- Dolgo Filler Data & Schema Fix

USE `dolgo_db`;

-- 1. Fix reservations table (add missing columns for synchronization)
ALTER TABLE `reservations` 
ADD COLUMN IF NOT EXISTS `payment_status` VARCHAR(50) DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS `payment_method` VARCHAR(50) DEFAULT 'cashier',
ADD COLUMN IF NOT EXISTS `amount` DECIMAL(10,2) DEFAULT 0.00;

-- 2. Create missing tables
CREATE TABLE IF NOT EXISTS `wifi_extension_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `requested_hours` DECIMAL(5,2) NOT NULL,
  `fee` DECIMAL(10,2) NOT NULL,
  `status` VARCHAR(50) DEFAULT 'pending',
  `payment_method` VARCHAR(50) DEFAULT 'cashier',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `membership_plans` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `duration_days` INT NOT NULL
);

CREATE TABLE IF NOT EXISTS `plan_upgrade_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `current_plan_id` INT,
  `requested_plan_id` INT NOT NULL,
  `fee` DECIMAL(10,2) NOT NULL,
  `status` VARCHAR(50) DEFAULT 'pending',
  `payment_method` VARCHAR(50) DEFAULT 'cashier',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Insert Membership Plans if missing
INSERT IGNORE INTO `membership_plans` (`id`, `name`, `price`, `duration_days`) VALUES
(1, 'Member', 500.00, 30),
(2, 'Premium', 1199.00, 30);

-- 4. Insert Filler Users (Password hash for '123456')
INSERT IGNORE INTO `users` (`email`, `username`, `password_hash`, `role`, `type`, `status`, `first_name`, `last_name`, `phone`) VALUES
('staff.eren@example.com', 'staff.eren@example.com', '$2a$10$7Z6V2v7E4XF3Wv1q4R2v.O5v.O5v.O5v.O5v.O5v.O5v.O5v.O5v.', 'staff', 'member', 'active', 'Eren', 'Yeager', '09123456781'),
('staff.mikasa@example.com', 'staff.mikasa@example.com', '$2a$10$7Z6V2v7E4XF3Wv1q4R2v.O5v.O5v.O5v.O5v.O5v.O5v.O5v.O5v.', 'staff', 'member', 'active', 'Mikasa', 'Ackerman', '09123456782'),
('luffy@onepiece.com', 'luffy@onepiece.com', '$2a$10$7Z6V2v7E4XF3Wv1q4R2v.O5v.O5v.O5v.O5v.O5v.O5v.O5v.O5v.', 'customer', 'premium', 'active', 'Monkey D.', 'Luffy', '09123456783'),
('zoro@onepiece.com', 'zoro@onepiece.com', '$2a$10$7Z6V2v7E4XF3Wv1q4R2v.O5v.O5v.O5v.O5v.O5v.O5v.O5v.O5v.', 'customer', 'member', 'active', 'Roronoa', 'Zoro', '09123456784'),
('nami@onepiece.com', 'nami@onepiece.com', '$2a$10$7Z6V2v7E4XF3Wv1q4R2v.O5v.O5v.O5v.O5v.O5v.O5v.O5v.O5v.', 'customer', 'member', 'active', 'Nami', 'Catburglar', '09123456785'),
('sanji@onepiece.com', 'sanji@onepiece.com', '$2a$10$7Z6V2v7E4XF3Wv1q4R2v.O5v.O5v.O5v.O5v.O5v.O5v.O5v.O5v.', 'customer', 'premium', 'active', 'Sanji', 'Vinsmoke', '09123456786'),
('robin@onepiece.com', 'robin@onepiece.com', '$2a$10$7Z6V2v7E4XF3Wv1q4R2v.O5v.O5v.O5v.O5v.O5v.O5v.O5v.O5v.', 'customer', 'member', 'active', 'Nico', 'Robin', '09123456787');

-- 5. Insert Filler Reservations
-- We assume some elements exist from previous setup.
-- If not, these might fail but we'll try to use existing ones or common IDs.
INSERT INTO `reservations` (`user_id`, `element_id`, `start_time`, `end_time`, `status`, `payment_status`, `payment_method`, `amount`) 
SELECT u.id, fe.id, NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'confirmed', 'paid', 'gcash', 200.00
FROM users u, floor_elements fe 
WHERE u.email = 'luffy@onepiece.com' AND fe.element_type = 'chair' LIMIT 1;

INSERT INTO `reservations` (`user_id`, `element_id`, `start_time`, `end_time`, `status`, `payment_status`, `payment_method`, `amount`) 
SELECT u.id, fe.id, NOW(), DATE_ADD(NOW(), INTERVAL 3 HOUR), 'confirmed', 'unpaid', 'cashier', 300.00
FROM users u, floor_elements fe 
WHERE u.email = 'zoro@onepiece.com' AND fe.element_type = 'chair' AND fe.id NOT IN (SELECT element_id FROM reservations WHERE status='confirmed') LIMIT 1;

INSERT INTO `reservations` (`user_id`, `element_id`, `start_time`, `end_time`, `status`, `payment_status`, `payment_method`, `amount`) 
SELECT u.id, fe.id, NOW(), DATE_ADD(NOW(), INTERVAL 1 HOUR), 'pending', 'unpaid', 'cashier', 100.00
FROM users u, floor_elements fe 
WHERE u.email = 'nami@onepiece.com' AND fe.element_type = 'chair' AND fe.id NOT IN (SELECT element_id FROM reservations WHERE status='confirmed') LIMIT 1;

-- 6. Insert WiFi Extension Requests
INSERT INTO `wifi_extension_requests` (`user_id`, `requested_hours`, `fee`, `status`, `payment_method`)
SELECT id, 1, 50.00, 'pending', 'cashier' FROM users WHERE email = 'sanji@onepiece.com';

-- 7. Insert Plan Upgrade Requests
INSERT INTO `plan_upgrade_requests` (`user_id`, `current_plan_id`, `requested_plan_id`, `fee`, `status`, `payment_method`)
SELECT id, 1, 2, 699.00, 'pending', 'cashier' FROM users WHERE email = 'robin@onepiece.com';
