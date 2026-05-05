CREATE DATABASE IF NOT EXISTS vaultx
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE vaultx;

CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(64) NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  preferences JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS expenses (
  expense_id VARCHAR(64) NOT NULL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  date DATETIME NOT NULL,
  amount DECIMAL(14, 2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NULL,
  payment_method ENUM('Cash', 'Credit Card', 'Debit Card', 'E-wallet') NOT NULL,
  receipt JSON NULL,
  tags JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT expenses_amount_check CHECK (amount >= 0),
  CONSTRAINT expenses_user_fk FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS income (
  income_id VARCHAR(64) NOT NULL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  date DATE NOT NULL,
  amount DECIMAL(14, 2) NOT NULL,
  source VARCHAR(100) NOT NULL,
  description TEXT NULL,
  payment_method ENUM('Cash', 'Credit Card', 'Debit Card', 'E-wallet') NOT NULL,
  tags JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT income_amount_check CHECK (amount >= 0),
  CONSTRAINT income_user_fk FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS assets (
  asset_id VARCHAR(64) NOT NULL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(100) NOT NULL,
  purchase_date DATE NOT NULL,
  purchase_price DECIMAL(14, 2) NOT NULL,
  current_value DECIMAL(14, 2) NOT NULL,
  location VARCHAR(150) NOT NULL,
  serial_number VARCHAR(150) NULL,
  warranty_expiry DATE NULL,
  insurance_details TEXT NULL,
  `condition` ENUM('Excellent', 'Good', 'Fair', 'Poor') NOT NULL,
  photos JSON NOT NULL,
  documents JSON NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT assets_purchase_price_check CHECK (purchase_price >= 0),
  CONSTRAINT assets_current_value_check CHECK (current_value >= 0),
  CONSTRAINT assets_user_fk FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categories (
  category_id VARCHAR(64) NOT NULL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  type ENUM('expense', 'income', 'asset') NOT NULL,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(60) NULL,
  color VARCHAR(20) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT categories_user_fk FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  UNIQUE KEY categories_user_type_name_unique (user_id, type, name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS budgets (
  budget_id VARCHAR(64) NOT NULL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  category VARCHAR(100) NOT NULL,
  monthly_limit DECIMAL(14, 2) NOT NULL,
  month TINYINT NOT NULL,
  year SMALLINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT budgets_monthly_limit_check CHECK (monthly_limit >= 0),
  CONSTRAINT budgets_month_check CHECK (month BETWEEN 1 AND 12),
  CONSTRAINT budgets_year_check CHECK (year BETWEEN 2020 AND 2100),
  CONSTRAINT budgets_user_fk FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  UNIQUE KEY budgets_user_category_month_unique (user_id, category, month, year)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS savings_goals (
  goal_id VARCHAR(64) NOT NULL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  name VARCHAR(150) NOT NULL,
  target_amount DECIMAL(14, 2) NOT NULL,
  current_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
  due_date DATE NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT goals_target_amount_check CHECK (target_amount > 0),
  CONSTRAINT goals_current_amount_check CHECK (current_amount >= 0),
  CONSTRAINT goals_user_fk FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS recurring_transactions (
  recurring_id VARCHAR(64) NOT NULL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  type ENUM('expense', 'income') NOT NULL,
  amount DECIMAL(14, 2) NOT NULL,
  category_or_source VARCHAR(100) NOT NULL,
  description TEXT NULL,
  payment_method ENUM('Cash', 'Credit Card', 'Debit Card', 'E-wallet') NOT NULL,
  frequency ENUM('weekly', 'monthly', 'yearly') NOT NULL,
  next_run_at DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT recurring_amount_check CHECK (amount >= 0),
  CONSTRAINT recurring_user_fk FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  notification_id VARCHAR(64) NOT NULL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  type ENUM('budget_alert', 'bill_reminder', 'warranty_expiry') NOT NULL,
  title VARCHAR(150) NOT NULL,
  body TEXT NOT NULL,
  scheduled_for DATETIME NULL,
  read_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notifications_user_fk FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX expenses_user_date_idx ON expenses(user_id, date DESC);
CREATE INDEX expenses_user_category_idx ON expenses(user_id, category);
CREATE INDEX income_user_date_idx ON income(user_id, date DESC);
CREATE INDEX income_user_source_idx ON income(user_id, source);
CREATE INDEX assets_user_category_idx ON assets(user_id, category);
CREATE INDEX assets_user_location_idx ON assets(user_id, location);
CREATE INDEX budgets_user_month_idx ON budgets(user_id, year, month);

DROP TRIGGER IF EXISTS users_set_id;
DROP TRIGGER IF EXISTS expenses_set_id;
DROP TRIGGER IF EXISTS income_set_id;
DROP TRIGGER IF EXISTS assets_set_id;
DROP TRIGGER IF EXISTS categories_set_id;
DROP TRIGGER IF EXISTS budgets_set_id;
DROP TRIGGER IF EXISTS savings_goals_set_id;
DROP TRIGGER IF EXISTS recurring_transactions_set_id;
DROP TRIGGER IF EXISTS notifications_set_id;

DELIMITER //

CREATE TRIGGER users_set_id
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
  IF NEW.user_id IS NULL OR NEW.user_id = '' THEN
    SET NEW.user_id = UUID();
  END IF;
END//

CREATE TRIGGER expenses_set_id
BEFORE INSERT ON expenses
FOR EACH ROW
BEGIN
  IF NEW.expense_id IS NULL OR NEW.expense_id = '' THEN
    SET NEW.expense_id = UUID();
  END IF;
END//

CREATE TRIGGER income_set_id
BEFORE INSERT ON income
FOR EACH ROW
BEGIN
  IF NEW.income_id IS NULL OR NEW.income_id = '' THEN
    SET NEW.income_id = UUID();
  END IF;
END//

CREATE TRIGGER assets_set_id
BEFORE INSERT ON assets
FOR EACH ROW
BEGIN
  IF NEW.asset_id IS NULL OR NEW.asset_id = '' THEN
    SET NEW.asset_id = UUID();
  END IF;
END//

CREATE TRIGGER categories_set_id
BEFORE INSERT ON categories
FOR EACH ROW
BEGIN
  IF NEW.category_id IS NULL OR NEW.category_id = '' THEN
    SET NEW.category_id = UUID();
  END IF;
END//

CREATE TRIGGER budgets_set_id
BEFORE INSERT ON budgets
FOR EACH ROW
BEGIN
  IF NEW.budget_id IS NULL OR NEW.budget_id = '' THEN
    SET NEW.budget_id = UUID();
  END IF;
END//

CREATE TRIGGER savings_goals_set_id
BEFORE INSERT ON savings_goals
FOR EACH ROW
BEGIN
  IF NEW.goal_id IS NULL OR NEW.goal_id = '' THEN
    SET NEW.goal_id = UUID();
  END IF;
END//

CREATE TRIGGER recurring_transactions_set_id
BEFORE INSERT ON recurring_transactions
FOR EACH ROW
BEGIN
  IF NEW.recurring_id IS NULL OR NEW.recurring_id = '' THEN
    SET NEW.recurring_id = UUID();
  END IF;
END//

CREATE TRIGGER notifications_set_id
BEFORE INSERT ON notifications
FOR EACH ROW
BEGIN
  IF NEW.notification_id IS NULL OR NEW.notification_id = '' THEN
    SET NEW.notification_id = UUID();
  END IF;
END//

DELIMITER ;

INSERT INTO users (user_id, email, password_hash, full_name, preferences)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@vaultx.local',
  SHA2('vaultx123', 256),
  'VaultX User',
  JSON_OBJECT(
    'currency', 'PHP',
    'dateFormat', 'MMM d, yyyy',
    'exportFormat', 'csv',
    'darkMode', false,
    'liabilities', 0
  )
)
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  preferences = VALUES(preferences);

INSERT IGNORE INTO categories (user_id, type, name, icon, color, is_default)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'expense', 'Food', 'Food', '#0f766e', true),
  ('00000000-0000-0000-0000-000000000001', 'expense', 'Transport', 'Transport', '#2563eb', true),
  ('00000000-0000-0000-0000-000000000001', 'expense', 'Bills', 'Bills', '#dc2626', true),
  ('00000000-0000-0000-0000-000000000001', 'expense', 'Utilities', 'Utilities', '#9333ea', true),
  ('00000000-0000-0000-0000-000000000001', 'expense', 'Shopping', 'Shopping', '#ea580c', true),
  ('00000000-0000-0000-0000-000000000001', 'expense', 'Entertainment', 'Entertainment', '#db2777', true),
  ('00000000-0000-0000-0000-000000000001', 'expense', 'Healthcare', 'Healthcare', '#16a34a', true),
  ('00000000-0000-0000-0000-000000000001', 'expense', 'Education', 'Education', '#0891b2', true),
  ('00000000-0000-0000-0000-000000000001', 'expense', 'Others', 'Others', '#64748b', true),
  ('00000000-0000-0000-0000-000000000001', 'income', 'Salary', 'Salary', '#16a34a', true),
  ('00000000-0000-0000-0000-000000000001', 'income', 'Freelance', 'Freelance', '#0f766e', true),
  ('00000000-0000-0000-0000-000000000001', 'income', 'Business', 'Business', '#2563eb', true),
  ('00000000-0000-0000-0000-000000000001', 'income', 'Investment', 'Investment', '#9333ea', true),
  ('00000000-0000-0000-0000-000000000001', 'income', 'Gift', 'Gift', '#db2777', true),
  ('00000000-0000-0000-0000-000000000001', 'income', 'Others', 'Others', '#64748b', true),
  ('00000000-0000-0000-0000-000000000001', 'asset', 'Tech & Gadgets', 'Tech', '#2563eb', true),
  ('00000000-0000-0000-0000-000000000001', 'asset', 'Vehicles', 'Vehicles', '#ea580c', true),
  ('00000000-0000-0000-0000-000000000001', 'asset', 'Property', 'Property', '#16a34a', true),
  ('00000000-0000-0000-0000-000000000001', 'asset', 'Investments', 'Investments', '#9333ea', true),
  ('00000000-0000-0000-0000-000000000001', 'asset', 'GCash Savings', 'GCash', '#06b6d4', true),
  ('00000000-0000-0000-0000-000000000001', 'asset', 'GSave', 'GSave', '#0ea5e9', true),
  ('00000000-0000-0000-0000-000000000001', 'asset', 'GFunds', 'GFunds', '#14b8a6', true),
  ('00000000-0000-0000-0000-000000000001', 'asset', 'GStocks', 'GStocks', '#6366f1', true),
  ('00000000-0000-0000-0000-000000000001', 'asset', 'GInsure', 'GInsure', '#f59e0b', true),
  ('00000000-0000-0000-0000-000000000001', 'asset', 'Maya Savings', 'Maya', '#22c55e', true),
  ('00000000-0000-0000-0000-000000000001', 'asset', 'Business Assets', 'Business', '#0f766e', true),
  ('00000000-0000-0000-0000-000000000001', 'asset', 'Collectibles', 'Collectibles', '#db2777', true),
  ('00000000-0000-0000-0000-000000000001', 'asset', 'Others', 'Others', '#64748b', true);
