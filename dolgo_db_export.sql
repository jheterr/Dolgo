-- Dolgo Database Export
-- Generated on 5/14/2026, 8:26:49 PM

CREATE DATABASE IF NOT EXISTS `dolgo_db`;
USE `dolgo_db`;

CREATE TABLE `active_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `start_time` datetime NOT NULL DEFAULT current_timestamp(),
  `end_time` datetime DEFAULT NULL,
  `status` enum('active','completed') DEFAULT 'active',
  `mac_address` varchar(17) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `active_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `active_sessions` (`id`, `user_id`, `start_time`, `end_time`, `status`, `mac_address`, `ip_address`, `created_at`) VALUES
(1, 7, '2026-05-11 04:37:57', '2026-05-11 06:37:57', 'completed', 'AA:BB:CC:DD:EE:FF', '192.168.1.101', '2026-05-11 04:37:57');

CREATE TABLE `door_access_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `door_name` varchar(50) NOT NULL,
  `method` varchar(50) DEFAULT 'RFID',
  `access_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('granted','denied','unlocked','locked') NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `door_access_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `door_access_logs` (`id`, `user_id`, `door_name`, `method`, `access_time`, `status`) VALUES
(1, 1, 'Main Door', 'RFID', '2026-05-14 11:47:26', 'unlocked'),
(2, 1, 'Main Door', 'Auto-Lock', '2026-05-14 11:50:26', 'locked'),
(3, 4, 'Main Door', 'RFID', '2026-05-14 11:58:26', 'granted'),
(4, 5, 'Main Door', 'RFID', '2026-05-14 12:02:26', 'denied'),
(5, 1, 'Main Door', 'Manual Console', '2026-05-14 11:27:26', 'unlocked'),
(6, 1, 'Main Door', 'Manual Console', '2026-05-14 11:31:26', 'locked'),
(7, 1, 'Main Door', 'Manual Console', '2026-05-14 12:08:41', 'unlocked'),
(8, 1, 'Main Door', 'Manual Console', '2026-05-14 12:08:42', 'locked'),
(9, 1, 'Main Door', 'Manual Console', '2026-05-14 12:08:42', 'unlocked'),
(10, 1, 'Main Door', 'Manual Console', '2026-05-14 12:08:43', 'locked'),
(11, 1, 'Main Door', 'Manual Console', '2026-05-14 12:09:14', 'unlocked'),
(12, 1, 'Main Door', 'Manual Console', '2026-05-14 12:09:27', 'unlocked'),
(13, 1, 'Main Door', 'Manual Console', '2026-05-14 12:09:33', 'locked'),
(14, 1, 'Main Door', 'Manual Console', '2026-05-14 12:25:06', 'unlocked'),
(15, 1, 'Main Door', 'Manual Console', '2026-05-14 12:25:06', 'unlocked'),
(16, 1, 'Main Door', 'Manual Console', '2026-05-14 12:25:06', 'locked'),
(17, 1, 'Main Door', 'Manual Console', '2026-05-14 12:25:07', 'locked'),
(18, 1, 'Main Door', 'Manual Console', '2026-05-14 12:25:07', 'locked');

CREATE TABLE `event_attendees` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `registered_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `event_attendees_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `event_attendees_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `event_date` datetime NOT NULL,
  `location` varchar(100) DEFAULT NULL,
  `max_attendees` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `events_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `floor_elements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `floor_plan_id` int(11) NOT NULL,
  `element_type` varchar(50) NOT NULL,
  `label` varchar(50) DEFAULT NULL,
  `pos_x` int(11) NOT NULL,
  `pos_y` int(11) NOT NULL,
  `width` int(11) NOT NULL,
  `height` int(11) NOT NULL,
  `rotation` int(11) DEFAULT 0,
  `color` varchar(20) DEFAULT NULL,
  `capacity` int(11) DEFAULT 1,
  `status` enum('open','taken','reserved','maintenance') DEFAULT 'open',
  PRIMARY KEY (`id`),
  KEY `floor_plan_id` (`floor_plan_id`),
  CONSTRAINT `floor_elements_ibfk_1` FOREIGN KEY (`floor_plan_id`) REFERENCES `floor_plans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=315 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `floor_elements` (`id`, `floor_plan_id`, `element_type`, `label`, `pos_x`, `pos_y`, `width`, `height`, `rotation`, `color`, `capacity`, `status`) VALUES
(274, 8, 'block-gray', 'Wall', 0, 0, 600, 45, 0, '#cbd5e1', 1, 'open'),
(275, 8, 'block-gray', 'Wall', 0, 0, 12, 450, 0, '#cbd5e1', 1, 'open'),
(276, 8, 'block-yellow', 'Counter', 29, 55, 300, 95, 0, '#fde68a', 1, 'open'),
(277, 8, 'room', 'Meeting Room', 414, 49, 180, 95, 0, '#22c55e', 8, 'open'),
(278, 8, 'round-table', 'T1', 96, 344, 50, 50, 0, '#fdba74', 1, 'open'),
(279, 8, 'chair', 'T1-1', 58, 310, 40, 40, -45, '#faecd4', 1, 'open'),
(280, 8, 'chair', 'T1-3', 100, 395, 40, 40, 180, '#faecd4', 1, 'open'),
(281, 8, 'round-table', 'T2', 237, 347, 50, 50, 0, '#fdba74', 1, 'open'),
(282, 8, 'chair', 'T1-2', 142, 308, 40, 40, 30, '#faecd4', 1, 'open'),
(283, 8, 'chair', 'T2-1', 204, 313, 40, 40, -30, '#faecd4', 1, 'open'),
(284, 8, 'chair', 'T2-2', 282, 316, 40, 40, 30, '#faecd4', 1, 'open'),
(285, 8, 'chair', 'T2-3', 240, 399, 40, 40, 180, '#faecd4', 1, 'open'),
(286, 8, 'chair', 'T3-8', 410, 396, 40, 40, 180, '#faecd4', 1, 'open'),
(287, 8, 'chair', 'T3-7', 465, 352, 40, 40, 90, '#faecd4', 1, 'open'),
(288, 8, 'rect-table', 'C4', 675, 313, 90, 40, 0, '#fdba74', 1, 'open'),
(289, 8, 'rect-table', 'C2', 674, 135, 90, 40, 0, '#fdba74', 1, 'open'),
(290, 8, 'rect-table', 'C3', 673, 225, 90, 40, 0, '#fdba74', 1, 'open'),
(291, 8, 'rect-table', 'C5', 675, 402, 90, 40, 0, '#fdba74', 1, 'open'),
(292, 8, 'chair-sq', 'C5-1', 676, 358, 40, 40, 0, '#faecd4', 1, 'open'),
(293, 8, 'chair-sq', 'C5-2', 723, 358, 40, 40, 0, '#faecd4', 1, 'open'),
(294, 8, 'chair-sq', 'C4-1', 675, 270, 40, 40, 0, '#faecd4', 1, 'open'),
(295, 8, 'chair-sq', 'C4-2', 719, 269, 40, 40, 0, '#faecd4', 1, 'open'),
(296, 8, 'chair-sq', 'C3-1', 676, 182, 40, 40, 0, '#faecd4', 1, 'open'),
(297, 8, 'chair-sq', 'C3-2', 719, 181, 40, 40, 0, '#faecd4', 1, 'open'),
(298, 8, 'chair-sq', 'C2-1', 676, 91, 40, 40, 0, '#faecd4', 1, 'open'),
(299, 8, 'chair-sq', 'C2-2', 721, 89, 40, 40, 0, '#faecd4', 1, 'open'),
(300, 8, 'rect-table', 'C1', 680, 46, 80, 40, 0, '#fdba74', 1, 'open'),
(301, 8, 'chair-sq', 'C1-1', 677, 5, 40, 40, 0, '#faecd4', 1, 'open'),
(302, 8, 'chair-sq', 'C1-2', 720, 3, 40, 40, 0, '#faecd4', 1, 'open'),
(303, 8, 'rect-table', 'T3', 412, 274, 40, 120, 0, '#fdba74', 1, 'open'),
(304, 8, 'chair', 'T3-6', 464, 310, 40, 40, 90, '#faecd4', 1, 'open'),
(305, 8, 'chair', 'TE-5', 464, 274, 40, 40, 90, '#faecd4', 1, 'open'),
(306, 8, 'chair', 'T3-4', 413, 224, 40, 40, 0, '#faecd4', 1, 'open'),
(307, 8, 'chair-sq', 'T3-1', 365, 273, 40, 40, 0, '#faecd4', 1, 'open'),
(308, 8, 'chair-sq', 'T3-2', 365, 312, 40, 40, 0, '#faecd4', 1, 'open'),
(309, 8, 'chair-sq', 'T3-3', 365, 352, 40, 40, 0, '#faecd4', 1, 'open'),
(310, 8, 'block-gray', NULL, 333, 198, 10, 250, 0, '#b0b8c0', 1, 'open'),
(311, 8, 'round-table', 'T4', 544, 354, 50, 50, 0, '#fdba74', 1, 'open'),
(312, 8, 'chair', 'T4-1', 510, 321, 40, 40, -30, '#faecd4', 1, 'open'),
(313, 8, 'chair', 'T4-2', 584, 321, 40, 40, 30, '#faecd4', 1, 'open'),
(314, 8, 'chair', 'T4-3', 548, 404, 40, 40, 180, '#faecd4', 1, 'open');

CREATE TABLE `floor_plans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `width` int(11) DEFAULT 800,
  `height` int(11) DEFAULT 450,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `floor_plans` (`id`, `name`, `width`, `height`, `is_active`, `created_at`) VALUES
(8, 'Main Floor', 800, 450, 1, '2026-05-10 17:02:06');

CREATE TABLE `membership_plans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `duration_days` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `sender_id` (`sender_id`),
  KEY `receiver_id` (`receiver_id`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `reservations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `element_id` int(11) NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `amount` decimal(10,2) DEFAULT 0.00,
  `payment_method` enum('cashier','gcash') DEFAULT 'cashier',
  `payment_status` enum('unpaid','paid') DEFAULT 'unpaid',
  `reference_number` varchar(100) DEFAULT NULL,
  `proof_image` longtext DEFAULT NULL,
  `status` enum('pending','confirmed','completed','cancelled') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `element_id` (`element_id`),
  CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reservations_ibfk_2` FOREIGN KEY (`element_id`) REFERENCES `floor_elements` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `seat_transfer_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `current_element_id` int(11) NOT NULL,
  `requested_element_id` int(11) NOT NULL,
  `status` enum('pending','approved','declined') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `current_element_id` (`current_element_id`),
  KEY `requested_element_id` (`requested_element_id`),
  CONSTRAINT `seat_transfer_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `seat_transfer_requests_ibfk_2` FOREIGN KEY (`current_element_id`) REFERENCES `floor_elements` (`id`) ON DELETE CASCADE,
  CONSTRAINT `seat_transfer_requests_ibfk_3` FOREIGN KEY (`requested_element_id`) REFERENCES `floor_elements` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) unsigned NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `sessions` (`session_id`, `expires`, `data`) VALUES
('842w2zjkm0r36xTRzMg0pg9HCGsj_PDm', 1778848008, '{"cookie":{"originalMaxAge":86400000,"expires":"2026-05-15T11:58:15.169Z","httpOnly":true,"path":"/"},"user":{"id":1,"username":"admin","email":"admin@example.com","role":"admin","status":"active","firstName":"Super","lastName":"Admin"}}');

CREATE TABLE `user_memberships` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('active','expired','cancelled') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `plan_id` (`plan_id`),
  CONSTRAINT `user_memberships_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_memberships_ibfk_2` FOREIGN KEY (`plan_id`) REFERENCES `membership_plans` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','staff','customer') NOT NULL DEFAULT 'customer',
  `type` enum('member','walkin') DEFAULT 'member',
  `status` enum('pending','active','suspended') DEFAULT 'pending',
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `schedule` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `role`, `type`, `status`, `first_name`, `last_name`, `phone`, `location`, `schedule`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'admin@example.com', '$2b$10$eHdE4MeeWEmQ0rdCbtoPMuUdrcmgVYLmVF.WCzYZDKeheSpdDoJy.', 'admin', 'member', 'active', 'Super', 'Admin', NULL, NULL, NULL, '2026-05-14 11:46:22', '2026-05-14 11:46:22'),
(2, 'staff', 'staff@example.com', '$2b$10$eHdE4MeeWEmQ0rdCbtoPMuCcwc10ELRnCN0ajh5eUUo05Jmim2Zoy', 'staff', 'member', 'active', 'Staff', 'Member', NULL, NULL, NULL, '2026-05-14 11:46:22', '2026-05-14 11:46:22'),
(3, 'customer', 'customer@example.com', '$2b$10$eHdE4MeeWEmQ0rdCbtoPMuPvhZn52NGfYU./EzAvIsHlmzm5b4Kpm', 'customer', 'member', 'active', 'John', 'Doe', NULL, NULL, NULL, '2026-05-14 11:46:23', '2026-05-14 11:46:23'),
(4, 'alice_smith', 'alice@example.com', '$2b$10$/CGJfMiBX1WGCFmGqxaxrudr7utvwPEOaPHQ8oJXIGNIIP0cs0r0S', 'customer', 'member', 'active', 'Alice', 'Smith', '+63 917 123 4567', 'Manila', NULL, '2026-05-14 11:50:53', '2026-05-14 11:50:53'),
(5, 'bob_jones', 'bob@example.com', '$2b$10$/CGJfMiBX1WGCFmGqxaxrudr7utvwPEOaPHQ8oJXIGNIIP0cs0r0S', 'customer', 'member', 'active', 'Bob', 'Jones', '+63 918 234 5678', 'Quezon City', NULL, '2026-05-14 11:50:53', '2026-05-14 11:50:53'),
(6, 'charlie_brown', 'charlie@example.com', '$2b$10$/CGJfMiBX1WGCFmGqxaxrudr7utvwPEOaPHQ8oJXIGNIIP0cs0r0S', 'customer', 'member', 'pending', 'Charlie', 'Brown', '+63 919 345 6789', 'Makati', NULL, '2026-05-14 11:50:53', '2026-05-14 11:50:53'),
(7, 'david_wilson', 'david@example.com', '$2b$10$/CGJfMiBX1WGCFmGqxaxrudr7utvwPEOaPHQ8oJXIGNIIP0cs0r0S', 'customer', 'walkin', 'active', 'David', 'Wilson', '+63 920 456 7890', 'Taguig', NULL, '2026-05-14 11:50:53', '2026-05-14 11:50:53'),
(8, 'eva_garcia', 'eva@example.com', '$2b$10$/CGJfMiBX1WGCFmGqxaxrudr7utvwPEOaPHQ8oJXIGNIIP0cs0r0S', 'customer', 'walkin', 'active', 'Eva', 'Garcia', '+63 921 567 8901', 'Pasig', NULL, '2026-05-14 11:50:53', '2026-05-14 11:50:53');

