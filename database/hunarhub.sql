-- ======================================================================
-- BalochHunar — Digital Artisan & Handicraft Business Platform Database
-- Database Schema & Initial Production Seed Data
-- ======================================================================

-- 1. Create Database if not exists
CREATE DATABASE IF NOT EXISTS `balochhunar_db`
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE `balochhunar_db`;

-- Disable Foreign Key checks temporarily for clean setup
SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables to ensure clean initialization
DROP TABLE IF EXISTS `order_status_history`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `order_artisan_assignments`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `contact_messages`;
DROP TABLE IF EXISTS `sessions`;
DROP TABLE IF EXISTS `gallery`;
DROP TABLE IF EXISTS `services`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `artisans`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- ======================================================================
-- 2. TABLE: users (Admin & Staff Accounts)
-- ======================================================================
CREATE TABLE `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'staff') NOT NULL DEFAULT 'admin',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TABLE: sessions (Persistent Express Authentication Sessions)
CREATE TABLE `sessions` (
  `session_id` VARCHAR(128) PRIMARY KEY,
  `expires` BIGINT UNSIGNED NOT NULL,
  `data` MEDIUMTEXT NOT NULL,
  INDEX `idx_sessions_expires` (`expires`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ======================================================================
-- 4. TABLE: categories (Craft & Product Classifications)
-- ======================================================================
CREATE TABLE `categories` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `slug` VARCHAR(120) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_categories_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ======================================================================
-- 4. TABLE: artisans (Master Craftsmen & Craftswomen Profiles)
-- ======================================================================
CREATE TABLE `artisans` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(120) NOT NULL,
  `location` VARCHAR(150) NOT NULL,
  `experience_years` INT UNSIGNED NOT NULL DEFAULT 0,
  `craft_type` VARCHAR(100) NOT NULL,
  `bio` TEXT NOT NULL,
  `image` VARCHAR(255) NULL,
  `story` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_artisans_location` (`location`),
  INDEX `idx_artisans_craft_type` (`craft_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ======================================================================
-- 5. TABLE: products (Handicraft Inventory & Masterpieces)
-- ======================================================================
CREATE TABLE `products` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT UNSIGNED NOT NULL,
  `artisan_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `description` TEXT NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `tags` VARCHAR(255) NULL,
  `image` VARCHAR(255) NULL,
  `is_featured` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_products_category` (`category_id`),
  INDEX `idx_products_artisan` (`artisan_id`),
  INDEX `idx_products_featured` (`is_featured`),
  INDEX `idx_products_name` (`name`),
  CONSTRAINT `fk_products_category`
    FOREIGN KEY (`category_id`)
    REFERENCES `categories` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_products_artisan`
    FOREIGN KEY (`artisan_id`)
    REFERENCES `artisans` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ======================================================================
-- 6. TABLE: orders (BalochHunar-managed customer orders)
-- ======================================================================
CREATE TABLE `orders` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_number` VARCHAR(32) NOT NULL UNIQUE,
  `tracking_token_hash` CHAR(64) NOT NULL UNIQUE,
  `customer_id` INT UNSIGNED NULL,
  `customer_name` VARCHAR(120) NOT NULL,
  `customer_email` VARCHAR(150) NOT NULL,
  `customer_phone` VARCHAR(30) NOT NULL,
  `alternative_phone` VARCHAR(30) NULL,
  `full_address` TEXT NOT NULL,
  `area` VARCHAR(150) NOT NULL,
  `village_town` VARCHAR(150) NULL,
  `city` VARCHAR(100) NOT NULL,
  `district` VARCHAR(100) NULL,
  `province` VARCHAR(100) NOT NULL,
  `postal_code` VARCHAR(20) NULL,
  `country` VARCHAR(80) NOT NULL DEFAULT 'Pakistan',
  `subtotal` DECIMAL(12,2) NOT NULL,
  `delivery_charges` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(12,2) NOT NULL,
  `currency` CHAR(3) NOT NULL DEFAULT 'PKR',
  `payment_method` ENUM('Bank Transfer','JazzCash','EasyPaisa','Cash on Delivery','Other') NOT NULL,
  `payment_status` ENUM('Pending','Verification Pending','Verified','Rejected','Failed','Refunded') NOT NULL DEFAULT 'Pending',
  `order_status` ENUM('Pending','Awaiting Payment','Payment Verification Pending','Payment Confirmed','Order Confirmed','Assigned to Artisan','Artisan Preparing','Ready for Dispatch','Shipped','Out for Delivery','Delivered','Completed','Cancelled','Refunded','Payment Rejected') NOT NULL DEFAULT 'Pending',
  `assigned_artist_id` INT UNSIGNED NULL,
  `assigned_by_admin_id` INT UNSIGNED NULL,
  `assigned_at` DATETIME NULL,
  `confirmed_at` DATETIME NULL,
  `shipped_at` DATETIME NULL,
  `delivered_at` DATETIME NULL,
  `completed_at` DATETIME NULL,
  `cancelled_at` DATETIME NULL,
  `courier_name` VARCHAR(120) NULL,
  `tracking_number` VARCHAR(120) NULL,
  `estimated_delivery_date` DATE NULL,
  `actual_delivery_date` DATE NULL,
  `customer_notes` TEXT NULL,
  `admin_notes` TEXT NULL,
  `cancellation_reason` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_orders_customer_email` (`customer_email`),
  INDEX `idx_orders_status` (`order_status`),
  INDEX `idx_orders_payment_status` (`payment_status`),
  INDEX `idx_orders_artist` (`assigned_artist_id`),
  CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_orders_artist` FOREIGN KEY (`assigned_artist_id`) REFERENCES `artisans` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_orders_admin` FOREIGN KEY (`assigned_by_admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ======================================================================
-- 7. TABLE: order_items (immutable product snapshots)
-- ======================================================================
CREATE TABLE `order_items` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED NULL,
  `product_name` VARCHAR(200) NOT NULL,
  `product_image` VARCHAR(255) NULL,
  `product_price` DECIMAL(12,2) NOT NULL,
  `quantity` INT UNSIGNED NOT NULL,
  `subtotal` DECIMAL(12,2) NOT NULL,
  `selected_options` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_order_items_order` (`order_id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ======================================================================
-- 8. TABLE: payments (manual platform payment verification)
-- ======================================================================
CREATE TABLE `payments` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `payment_method` VARCHAR(50) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `currency` CHAR(3) NOT NULL DEFAULT 'PKR',
  `transaction_reference` VARCHAR(150) NULL,
  `payment_proof` VARCHAR(255) NULL,
  `payment_status` ENUM('Pending','Verification Pending','Verified','Rejected','Failed','Refunded') NOT NULL DEFAULT 'Pending',
  `verified_by_admin_id` INT UNSIGNED NULL,
  `verification_notes` TEXT NULL,
  `paid_at` DATETIME NULL,
  `verified_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_payments_order` (`order_id`),
  INDEX `idx_payments_status` (`payment_status`),
  CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_payments_admin` FOREIGN KEY (`verified_by_admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ======================================================================
-- 9. TABLE: order_artisan_assignments
-- ======================================================================
CREATE TABLE `order_artisan_assignments` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `artist_id` INT UNSIGNED NOT NULL,
  `assigned_by` INT UNSIGNED NOT NULL,
  `assignment_notes` TEXT NULL,
  `assigned_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `expected_completion_date` DATE NULL,
  `artisan_status` ENUM('Assigned','Accepted','In Progress','Work Completed','Product Handed to Admin','Cancelled') NOT NULL DEFAULT 'Assigned',
  `artisan_notes` TEXT NULL,
  `completed_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_assignments_order` (`order_id`),
  INDEX `idx_assignments_artist` (`artist_id`),
  CONSTRAINT `fk_assignments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_assignments_artist` FOREIGN KEY (`artist_id`) REFERENCES `artisans` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_assignments_admin` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ======================================================================
-- 10. TABLE: order_status_history
-- ======================================================================
CREATE TABLE `order_status_history` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `previous_status` VARCHAR(60) NULL,
  `new_status` VARCHAR(60) NOT NULL,
  `changed_by_user_id` INT UNSIGNED NULL,
  `changed_by_role` VARCHAR(30) NOT NULL DEFAULT 'system',
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_history_order` (`order_id`),
  CONSTRAINT `fk_history_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_history_user` FOREIGN KEY (`changed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ======================================================================
-- 6. TABLE: services (Custom Orders & Bespoke Artisan Services)
-- ======================================================================
CREATE TABLE `services` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(150) NOT NULL,
  `description` TEXT NOT NULL,
  `icon` VARCHAR(100) NOT NULL DEFAULT 'fas fa-palette',
  `estimated_days` VARCHAR(50) NOT NULL DEFAULT '7-14 business days',
  `starting_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ======================================================================
-- 7. TABLE: gallery (Showcase of Heritage Artwork & Studio Moments)
-- ======================================================================
CREATE TABLE `gallery` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(150) NOT NULL,
  `craft_type` VARCHAR(100) NULL,
  `image` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ======================================================================
-- 8. TABLE: contact_messages (Customer & Business Inquiries)
-- ======================================================================
CREATE TABLE `contact_messages` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(30) NULL,
  `subject` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_messages_is_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ======================================================================
-- 9. INITIAL PRODUCTION SEED DATA
-- ======================================================================

-- 9.1 Insert Initial Admin Account
-- Default Credentials: Email: admin@balochhunar.com | Password: admin123
-- Password hash generated via bcrypt (10 rounds) for: admin123
INSERT INTO `users` (`name`, `email`, `password`, `role`) VALUES
('BalochHunar Administrator', 'admin@balochhunar.com', '$2b$10$C.P5EWXW6RFWMmt9gWF3TOHuG1Q6eR48l7aenl3hO5YX6gD2Ud3Gi', 'admin');

-- 9.2 Insert Categories
INSERT INTO `categories` (`name`, `slug`, `description`) VALUES
('Balochi Hand Embroidery', 'balochi-embroidery', 'Traditional intricate needlework including Doch, Kaputuk, and Sheeshedar mirror work handcrafted on premium silk and cotton fabrics.'),
('Handcrafted Leatherwork', 'leatherwork', 'Authentic vegetable-tanned leather shoes, bags, saddles, and accessories crafted using generational artisanal methods.'),
('Clay & Terracotta Pottery', 'clay-pottery', 'Earthenware, glazed vases, tea sets, and heritage pottery hand-spun on traditional wheels and wood-fired to perfection.'),
('Handwoven Rugs & Kilims', 'rugs-and-kilims', 'Geometrically patterned wool rugs, wall hangings, and floor coverings woven on wooden pit-looms with organic plant dyes.');

-- 9.3 Insert Artisans
INSERT INTO `artisans` (`name`, `location`, `experience_years`, `craft_type`, `bio`, `image`, `story`) VALUES
('Zarrina Baloch', 'Turbat, Balochistan', 24, 'Balochi Hand Embroidery', 'Master craftswoman specializing in traditional Doch needlework. She leads a local cooperative of over 30 rural women artisans.', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80', 'Zarrina learned the ancient art of Kaputuk needlework from her grandmother in Turbat at age seven. Over two decades, she has transformed traditional heirloom motifs into contemporary couture while providing dignified livelihoods to women in Makran.'),
('Mehrab Khan', 'Sibi, Balochistan', 32, 'Handcrafted Leatherwork', 'Veteran artisan known for hand-carved leather chappals, durable belts, and equestrian harness craft using vegetable-tanned hides.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80', 'Mehrab continues a four-generation leather crafting legacy. Every piece of leather is treated with indigenous tree bark and hand-stitched with waxed threads to withstand decades of use.'),
('Gul Bibi', 'Panjgur, Balochistan', 19, 'Clay & Terracotta Pottery', 'Celebrated potter creating organic earthenware, terracotta pitchers, and decorative glazed tileware reflecting regional heritage.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80', 'Sourcing clay directly from the dry riverbeds of Panjgur, Gul Bibi blends river silt and mineral quartz to create heat-resistant culinary pots and decorative vases celebrated across the region.'),
('Karim Dad', 'Dera Bugti, Balochistan', 28, 'Handwoven Rugs & Kilims', 'Master weaver renowned for intricate symmetrical geometric carpets woven with pure mountain sheep wool and natural madder dyes.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80', 'Operating traditional pit-looms, Karim Dad weaves timeless tribal stories and nomadic symbols into every rug, preserving motifs that date back over five centuries.'),
('Makran Doch Women''s Collective', 'Turbat, Balochistan', 18, 'Balochi Doch Embroidery', 'A women-led craft group preserving Balochi Doch through geometric hand embroidery, mirror accents, and dense counted stitches on cotton and silk.', 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600&auto=format&fit=crop&q=80', 'The collective reflects the long-standing role of women''s home-based embroidery in Makran. Its work brings together pattern knowledge, patient hand stitching, and contemporary color planning while keeping the cultural vocabulary of Doch visible.'),
('Panjgur Needlework Circle', 'Panjgur, Balochistan', 15, 'Balochi Women''s Needlework', 'Women artisans producing traditional embroidered panels, shawls, and dress details inspired by Balochi floral, geometric, and mirror-work motifs.', 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&auto=format&fit=crop&q=80', 'This profile represents a community craft practice rather than a single named maker. The circle supports skill sharing between generations and adapts heritage embroidery for garments, home textiles, and custom commissions.'),
('Sibi Leather Craftsmen''s Guild', 'Sibi, Balochistan', 22, 'Handcrafted Leatherwork', 'Men and women makers creating hand-tooled leather chappals, belts, bags, and utility goods with vegetable-tanned hides and waxed thread.', 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&auto=format&fit=crop&q=80', 'Leather craft in Balochistan is valued for practical construction and bold geometric tooling. This group profile highlights the cutting, edge finishing, punching, and saddle-stitching skills used in durable everyday pieces.'),
('Lasbela Loom & Dye Collective', 'Lasbela, Balochistan', 20, 'Wool Weaving & Natural Dye', 'A mixed artisan group weaving wool textiles and kilims with regional geometric layouts and color made from locally familiar plant and mineral sources.', 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=600&auto=format&fit=crop&q=80', 'The collective documents a workshop tradition built around spinning, dye preparation, loom work, and careful finishing. Its public profile is intentionally collective so the platform does not attribute shared community knowledge to one person.'),
('Akram Dost Baloch', 'Quetta, Balochistan', 16, 'Balochi Cultural Handicrafts', 'Baloch artisan profile focused on handmade cultural goods, traditional surface patterns, and commissions that keep regional craft visible in contemporary homes.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80', 'Akram Dost Baloch is included as a featured artisan profile supplied by the BalochHunar team. The profile is ready for direct contact, product linking, and a consented portrait or workshop photograph supplied by the artisan.'),
('Kaleem Khan', 'Khuzdar, Balochistan', 14, 'Balochi Handmade Cultural Goods', 'Baloch artisan profile representing handmade decorative and utility pieces shaped by regional materials, motifs, and practical making traditions.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80', 'Kaleem Khan is included as a featured artisan profile supplied by the BalochHunar team. The profile can be expanded with verified specialty details, a biography, and a consented portrait or workshop photograph as the catalog develops.');

-- 9.4 Insert Products
INSERT INTO `products` (`category_id`, `artisan_id`, `name`, `description`, `price`, `tags`, `image`, `is_featured`) VALUES
(1, 1, 'Royal Doch Silk Chiffon Shawl', 'An exquisite handcrafted silk chiffon dupatta adorned with authentic Balochi Doch embroidery and delicate mirror-work along the borders.', 18500.00, 'Balochi, Doch, Silk, Mirror Work, Traditional, Couture', 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=800&auto=format&fit=crop&q=80', 1),
(1, 1, 'Heritage Makrani Embroidered Kurti', 'Hand-stitched cotton tunic featuring multi-colored geometric needlework inspired by traditional tribal wedding attire.', 12500.00, 'Embroidery, Kurti, Makran, Hand-stitched, Cotton', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80', 1),
(2, 2, 'Artisanal Hand-Carved Leather Chappal', 'Genuine full-grain leather traditional footwear with hand-tooled geometric patterns, brass stud inlays, and durable rubber soles.', 6800.00, 'Leather, Footwear, Hand-carved, Traditional, Men', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80', 1),
(2, 2, 'Sibi Handcrafted Leather Messenger Bag', 'Rugged vegetable-tanned leather messenger bag featuring antique brass fittings and reinforced waxed thread saddle-stitching.', 14200.00, 'Leather, Bag, Travel, Vintage, Handcrafted', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80', 0),
(3, 3, 'Panjgur Terracotta Earthenware Pitcher', 'Hand-spun terracotta water jug naturally cooling beverages with porous clay and finished with mineral-based earth pigments.', 3500.00, 'Pottery, Terracotta, Eco-Friendly, Home Decor, Handmade', 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&auto=format&fit=crop&q=80', 1),
(4, 4, 'Tribal Geometric Mountain Wool Kilim', 'A 4x6 ft flatweave kilim rug crafted from hand-spun pure mountain wool, naturally dyed with pomegranate rinds and walnut shells.', 28000.00, 'Kilim, Wool Rug, Geometric, Tribal, Natural Dye', 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800&auto=format&fit=crop&q=80', 1);

-- 9.5 Insert Services
INSERT INTO `services` (`title`, `description`, `icon`, `estimated_days`, `starting_price`) VALUES
('Bespoke Bridal & Couture Embroidery', 'Commission customized heirloom Balochi Doch embroidery on custom bridal ensembles, shawls, and couture garments tailored to your dimensions.', 'fas fa-gem', '21-30 business days', 25000.00),
('Custom Handcrafted Leather Goods', 'Personalized leather jackets, boots, wallets, and equestrian gear hand-cut and crafted to your specific style and measurements.', 'fas fa-shoe-prints', '10-15 business days', 8500.00),
('Corporate & Heritage Gift Baskets', 'Curated handicraft gift boxes containing handwoven textiles, glazed terracotta pieces, and certificates of authenticity for organizations.', 'fas fa-gift', '7-14 business days', 15000.00),
('Artisan Studio Workshops & Consultations', 'Direct virtual or in-person masterclasses with master artisans exploring needlework history, natural dye chemistry, and weaving techniques.', 'fas fa-chalkboard-teacher', '1-3 sessions', 5000.00);

-- 9.6 Insert Gallery Items
INSERT INTO `gallery` (`title`, `craft_type`, `image`, `description`) VALUES
('Intricate Doch Needlework in Progress', 'Balochi Hand Embroidery', 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80', 'Master craftswoman Zarrina creating microscopic silk stitches on pure velvet.'),
('Vegetable Tanning & Leather Tooling', 'Handcrafted Leatherwork', 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&auto=format&fit=crop&q=80', 'Artisan Mehrab Khan carving traditional patterns into full-grain leather.'),
('Spinning Terracotta on the Potter Wheel', 'Clay & Terracotta Pottery', 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&auto=format&fit=crop&q=80', 'Gul Bibi shaping an earthen pitcher using riverbed clay from Panjgur.'),
('Nomadic Wool Dyeing with Plant Pigments', 'Handwoven Rugs & Kilims', 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=800&auto=format&fit=crop&q=80', 'Natural madder root and indigo dye baths preparing raw sheep wool for weaving.');

-- 9.7 Insert Sample Contact Inquiries
INSERT INTO `contact_messages` (`name`, `email`, `phone`, `subject`, `message`, `is_read`) VALUES
('Amina Tariq', 'amina.tariq@gmail.com', '+92 300 1234567', 'Inquiry for Custom Bridal Shawl', 'Hello, I would like to commission a custom Doch silk dupatta for my wedding in December. Please let me know the process for selecting thread colors.', 0),
('Bilal Ahmed', 'bilal.ahmed@heritagecrafts.pk', '+92 321 9876543', 'Bulk Corporate Order for Handicraft Sets', 'We are looking to order 50 gift sets for our annual corporate cultural conference. Can you provide a quotation and delivery timeline?', 1);
