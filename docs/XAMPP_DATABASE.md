# VaultX XAMPP Database

This project includes a MySQL/MariaDB schema for XAMPP in:

```text
database/mysql/001_initial_schema.sql
```

## phpMyAdmin Setup

1. Open XAMPP Control Panel.
2. Start **Apache** and **MySQL**.
3. Open `http://localhost/phpmyadmin`.
4. Go to **Import**.
5. Choose `database/mysql/001_initial_schema.sql`.
6. Click **Import**.

The script creates a database named `vaultx`.

## Default Seed User

```text
Email: admin@vaultx.local
Password: vaultx123
```

## Tables

- `users`
- `expenses`
- `income`
- `assets`
- `categories`
- `budgets`
- `savings_goals`
- `recurring_transactions`
- `notifications`

## Local Connection Values

Use these values when wiring the Next.js app to XAMPP MySQL:

```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=vaultx
MYSQL_USER=root
MYSQL_PASSWORD=
```

## App Integration

The app now uses MySQL as the source of truth through:

```text
src/app/api/finance/route.ts
src/lib/db/mysql.ts
src/lib/db/finance-repository.ts
```

Login and registration use the `users` table. Finance records are loaded from MySQL after login and saved back to MySQL whenever the user changes expenses, income, assets, budgets, goals, categories, or settings.

For deployment, make sure your deployed app can reach the MySQL host in `MYSQL_HOST`. A local XAMPP database on `127.0.0.1` only works on the same machine running the Next.js server.
