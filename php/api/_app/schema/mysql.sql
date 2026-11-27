-- evecoo schema, MySQL 8 / MariaDB 10.6+. Statements are separated by ";\n" (Db::migrate splits on that).
-- Ids and tokens are case-sensitive capabilities: always utf8mb4_bin. Timestamps are CHAR(24) UTC ISO strings.
CREATE TABLE IF NOT EXISTS businesses (
  id VARCHAR(22) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  name VARCHAR(100) NOT NULL,
  locale VARCHAR(35) NOT NULL DEFAULT 'en',
  card_name VARCHAR(60) NOT NULL,
  card_reward VARCHAR(100) NOT NULL,
  stamps_required TINYINT UNSIGNED NOT NULL DEFAULT 10,
  card_color CHAR(7) NOT NULL DEFAULT '#1F6F5B',
  created_at CHAR(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(22) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  business_id VARCHAR(22) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('owner','staff') NOT NULL,
  created_at CHAR(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_business_role (business_id, role),
  CONSTRAINT fk_users_business FOREIGN KEY (business_id) REFERENCES businesses (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  token_hash CHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  user_id VARCHAR(22) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  created_at CHAR(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  expires_at CHAR(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (token_hash),
  KEY idx_sessions_expires (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(22) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  business_id VARCHAR(22) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  name VARCHAR(80) NOT NULL,
  birthday CHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
  stamps INT UNSIGNED NOT NULL DEFAULT 0,
  created_at CHAR(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (id),
  KEY idx_customers_business (business_id),
  CONSTRAINT fk_customers_business FOREIGN KEY (business_id) REFERENCES businesses (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stamp_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id VARCHAR(22) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  business_id VARCHAR(22) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  kind ENUM('stamp','redeem') NOT NULL,
  created_at CHAR(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (id),
  KEY idx_stamp_events_business_kind (business_id, kind),
  KEY idx_stamp_events_customer_kind_created (customer_id, kind, created_at),
  CONSTRAINT fk_stamp_events_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(22) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  seq BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  business_id VARCHAR(22) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  title VARCHAR(200) NOT NULL,
  body VARCHAR(1000) NOT NULL,
  kind ENUM('broadcast','winback','birthday','welcome') NOT NULL,
  created_at CHAR(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_messages_seq (seq),
  KEY idx_messages_business_created (business_id, created_at),
  CONSTRAINT fk_messages_business FOREIGN KEY (business_id) REFERENCES businesses (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS message_recipients (
  message_id VARCHAR(22) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  customer_id VARCHAR(22) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (message_id, customer_id),
  KEY idx_message_recipients_customer (customer_id),
  CONSTRAINT fk_message_recipients_message FOREIGN KEY (message_id) REFERENCES messages (id),
  CONSTRAINT fk_message_recipients_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS automation_log (
  customer_id VARCHAR(22) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  kind VARCHAR(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  day CHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (customer_id, kind, day),
  CONSTRAINT fk_automation_log_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket CHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  window_start INT UNSIGNED NOT NULL,
  hits INT UNSIGNED NOT NULL,
  PRIMARY KEY (bucket),
  KEY idx_rate_limits_window (window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
