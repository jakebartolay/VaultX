import "server-only";

import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type {
  Asset,
  Category,
  Expense,
  FinanceBackup,
  FinanceSettings,
  Income,
  StoredFile,
} from "@/lib/finance-types";
import { createDefaultCategories, defaultSettings } from "@/lib/finance-utils";
import { getMysqlPool } from "@/lib/db/mysql";

export type FinanceSnapshot = Omit<FinanceBackup, "version" | "exportedAt">;

type UserRow = RowDataPacket & {
  user_id: string;
  email: string;
  full_name: string;
  preferences: string | Record<string, unknown>;
};

type ExpenseRow = RowDataPacket & {
  expense_id: string;
  date: Date | string;
  amount: number;
  category: string;
  description: string | null;
  payment_method: Expense["paymentMethod"];
  receipt: string | StoredFile | null;
  tags: string | string[];
  created_at: Date | string;
  updated_at: Date | string;
};

type IncomeRow = RowDataPacket & {
  income_id: string;
  date: Date | string;
  amount: number;
  source: string;
  description: string | null;
  payment_method: Income["paymentMethod"];
  tags: string | string[];
  created_at: Date | string;
  updated_at: Date | string;
};

type AssetRow = RowDataPacket & {
  asset_id: string;
  name: string;
  category: string;
  purchase_date: Date | string;
  purchase_price: number;
  current_value: number;
  location: string;
  serial_number: string | null;
  warranty_expiry: Date | string | null;
  insurance_details: string | null;
  condition: Asset["condition"];
  photos: string | StoredFile[];
  documents: string | StoredFile[];
  notes: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type CategoryRow = RowDataPacket & {
  category_id: string;
  type: Category["type"];
  name: string;
  icon: string | null;
  color: string | null;
  is_default: 0 | 1;
  created_at: Date | string;
};

type BudgetRow = RowDataPacket & {
  budget_id: string;
  category: string;
  monthly_limit: number;
  month: number;
  year: number;
  created_at: Date | string;
};

type GoalRow = RowDataPacket & {
  goal_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  due_date: Date | string | null;
  notes: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

function parseJson<T>(value: T | string | null | undefined, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toDateOnly(value: Date | string | null) {
  if (!value) return undefined;

  return toIso(value);
}

function toMysqlDateTime(value: string) {
  return new Date(value).toISOString().slice(0, 19).replace("T", " ");
}

function toMysqlDate(value?: string) {
  if (!value) return null;

  return new Date(value).toISOString().slice(0, 10);
}

function buildSettings(user: UserRow): FinanceSettings {
  const preferences = parseJson<Record<string, unknown>>(user.preferences, {});

  return {
    profile: {
      fullName: user.full_name,
      email: user.email,
      currency: "PHP",
      dateFormat:
        preferences.dateFormat === "yyyy-MM-dd" || preferences.dateFormat === "dd/MM/yyyy"
          ? preferences.dateFormat
          : "MMM d, yyyy",
      exportFormat: preferences.exportFormat === "excel" ? "excel" : "csv",
      liabilities: Number(preferences.liabilities ?? 0),
    },
    darkMode: Boolean(preferences.darkMode),
  };
}

async function resolveUser(userId: string, email?: string) {
  const pool = getMysqlPool();
  let [userRows] = await pool.query<UserRow[]>(
    "SELECT user_id, email, full_name, preferences FROM users WHERE user_id = ? LIMIT 1",
    [userId],
  );

  if (!userRows[0] && email) {
    [userRows] = await pool.query<UserRow[]>(
      "SELECT user_id, email, full_name, preferences FROM users WHERE email = ? LIMIT 1",
      [email],
    );
  }

  return userRows[0];
}

export async function getFinanceSnapshot(
  userId: string,
  email?: string,
): Promise<FinanceSnapshot> {
  const pool = getMysqlPool();
  const user = await resolveUser(userId, email);

  if (!user) {
    throw new Error("User not found");
  }

  const effectiveUserId = user.user_id;

  const [expensesRows] = await pool.query<ExpenseRow[]>(
    "SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, created_at DESC",
    [effectiveUserId],
  );
  const [incomeRows] = await pool.query<IncomeRow[]>(
    "SELECT * FROM income WHERE user_id = ? ORDER BY date DESC, created_at DESC",
    [effectiveUserId],
  );
  const [assetRows] = await pool.query<AssetRow[]>(
    "SELECT * FROM assets WHERE user_id = ? ORDER BY created_at DESC",
    [effectiveUserId],
  );
  const [categoryRows] = await pool.query<CategoryRow[]>(
    "SELECT * FROM categories WHERE user_id = ? ORDER BY is_default DESC, created_at ASC",
    [effectiveUserId],
  );
  const [budgetRows] = await pool.query<BudgetRow[]>(
    "SELECT * FROM budgets WHERE user_id = ? ORDER BY year DESC, month DESC, created_at DESC",
    [effectiveUserId],
  );
  const [goalRows] = await pool.query<GoalRow[]>(
    "SELECT * FROM savings_goals WHERE user_id = ? ORDER BY created_at DESC",
    [effectiveUserId],
  );

  return {
    expenses: expensesRows.map((row) => ({
      id: row.expense_id,
      date: toIso(row.date),
      amount: Number(row.amount),
      category: row.category,
      description: row.description ?? "",
      paymentMethod: row.payment_method,
      receipt: parseJson<StoredFile | null>(row.receipt, null),
      tags: parseJson<string[]>(row.tags, []),
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at),
    })),
    incomes: incomeRows.map((row) => ({
      id: row.income_id,
      date: toIso(row.date),
      amount: Number(row.amount),
      source: row.source,
      description: row.description ?? "",
      paymentMethod: row.payment_method,
      tags: parseJson<string[]>(row.tags, []),
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at),
    })),
    assets: assetRows.map((row) => ({
      id: row.asset_id,
      name: row.name,
      category: row.category,
      purchaseDate: toIso(row.purchase_date),
      purchasePrice: Number(row.purchase_price),
      currentValue: Number(row.current_value),
      location: row.location,
      serialNumber: row.serial_number ?? "",
      warrantyExpiry: toDateOnly(row.warranty_expiry),
      insuranceDetails: row.insurance_details ?? "",
      condition: row.condition,
      photos: parseJson<StoredFile[]>(row.photos, []),
      documents: parseJson<StoredFile[]>(row.documents, []),
      notes: row.notes ?? "",
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at),
    })),
    budgets: budgetRows.map((row) => ({
      id: row.budget_id,
      category: row.category,
      monthlyLimit: Number(row.monthly_limit),
      month: Number(row.month),
      year: Number(row.year),
      createdAt: toIso(row.created_at),
    })),
    goals: goalRows.map((row) => ({
      id: row.goal_id,
      name: row.name,
      targetAmount: Number(row.target_amount),
      currentAmount: Number(row.current_amount),
      dueDate: toDateOnly(row.due_date),
      notes: row.notes ?? "",
      createdAt: toIso(row.created_at),
      updatedAt: toIso(row.updated_at),
    })),
    categories:
      categoryRows.length > 0
        ? categoryRows.map((row) => ({
            id: row.category_id,
            type: row.type,
            name: row.name,
            icon: row.icon ?? "",
            color: row.color ?? "#0f766e",
            isDefault: Boolean(row.is_default),
            createdAt: toIso(row.created_at),
          }))
        : createDefaultCategories(),
    settings: buildSettings(user) ?? defaultSettings,
  };
}

async function executeMany(
  connection: PoolConnection,
  sql: string,
  rows: unknown[][],
) {
  if (rows.length === 0) return;

  await connection.query<ResultSetHeader>(sql, [rows]);
}

export async function saveFinanceSnapshot(
  userId: string,
  snapshot: FinanceSnapshot,
  email?: string,
) {
  const connection = await getMysqlPool().getConnection();

  try {
    const user = await resolveUser(userId, email);

    if (!user) {
      throw new Error("User not found");
    }

    const effectiveUserId = user.user_id;

    await connection.beginTransaction();

    await connection.query(
      "UPDATE users SET full_name = ?, email = ?, preferences = ? WHERE user_id = ?",
      [
        snapshot.settings.profile.fullName,
        snapshot.settings.profile.email,
        JSON.stringify({
          currency: "PHP",
          dateFormat: snapshot.settings.profile.dateFormat,
          exportFormat: snapshot.settings.profile.exportFormat,
          darkMode: snapshot.settings.darkMode,
          liabilities: snapshot.settings.profile.liabilities,
        }),
        effectiveUserId,
      ],
    );

    await connection.query("DELETE FROM notifications WHERE user_id = ?", [effectiveUserId]);
    await connection.query("DELETE FROM recurring_transactions WHERE user_id = ?", [effectiveUserId]);
    await connection.query("DELETE FROM savings_goals WHERE user_id = ?", [effectiveUserId]);
    await connection.query("DELETE FROM budgets WHERE user_id = ?", [effectiveUserId]);
    await connection.query("DELETE FROM categories WHERE user_id = ?", [effectiveUserId]);
    await connection.query("DELETE FROM assets WHERE user_id = ?", [effectiveUserId]);
    await connection.query("DELETE FROM income WHERE user_id = ?", [effectiveUserId]);
    await connection.query("DELETE FROM expenses WHERE user_id = ?", [effectiveUserId]);

    await executeMany(
      connection,
      `INSERT INTO expenses
       (expense_id, user_id, date, amount, category, description, payment_method, receipt, tags, created_at, updated_at)
      VALUES ?`,
      snapshot.expenses.map((expense) => [
        expense.id,
        effectiveUserId,
        toMysqlDateTime(expense.date),
        expense.amount,
        expense.category,
        expense.description ?? null,
        expense.paymentMethod,
        expense.receipt ? JSON.stringify(expense.receipt) : null,
        JSON.stringify(expense.tags),
        toMysqlDateTime(expense.createdAt),
        toMysqlDateTime(expense.updatedAt),
      ]),
    );

    await executeMany(
      connection,
      `INSERT INTO income
       (income_id, user_id, date, amount, source, description, payment_method, tags, created_at, updated_at)
      VALUES ?`,
      snapshot.incomes.map((income) => [
        income.id,
        effectiveUserId,
        toMysqlDate(income.date),
        income.amount,
        income.source,
        income.description ?? null,
        income.paymentMethod,
        JSON.stringify(income.tags),
        toMysqlDateTime(income.createdAt),
        toMysqlDateTime(income.updatedAt),
      ]),
    );

    await executeMany(
      connection,
      `INSERT INTO assets
       (asset_id, user_id, name, category, purchase_date, purchase_price, current_value, location,
        serial_number, warranty_expiry, insurance_details, \`condition\`, photos, documents, notes, created_at, updated_at)
      VALUES ?`,
      snapshot.assets.map((asset) => [
        asset.id,
        effectiveUserId,
        asset.name,
        asset.category,
        toMysqlDate(asset.purchaseDate),
        asset.purchasePrice,
        asset.currentValue,
        asset.location,
        asset.serialNumber ?? null,
        toMysqlDate(asset.warrantyExpiry),
        asset.insuranceDetails ?? null,
        asset.condition,
        JSON.stringify(asset.photos),
        JSON.stringify(asset.documents),
        asset.notes ?? null,
        toMysqlDateTime(asset.createdAt),
        toMysqlDateTime(asset.updatedAt),
      ]),
    );

    await executeMany(
      connection,
      `INSERT INTO categories
       (category_id, user_id, type, name, icon, color, is_default, created_at)
      VALUES ?`,
      snapshot.categories.map((category) => [
        category.id,
        effectiveUserId,
        category.type,
        category.name,
        category.icon ?? null,
        category.color,
        category.isDefault,
        toMysqlDateTime(category.createdAt),
      ]),
    );

    await executeMany(
      connection,
      `INSERT INTO budgets
       (budget_id, user_id, category, monthly_limit, month, year, created_at)
      VALUES ?`,
      snapshot.budgets.map((budget) => [
        budget.id,
        effectiveUserId,
        budget.category,
        budget.monthlyLimit,
        budget.month,
        budget.year,
        toMysqlDateTime(budget.createdAt),
      ]),
    );

    await executeMany(
      connection,
      `INSERT INTO savings_goals
       (goal_id, user_id, name, target_amount, current_amount, due_date, notes, created_at, updated_at)
      VALUES ?`,
      snapshot.goals.map((goal) => [
        goal.id,
        effectiveUserId,
        goal.name,
        goal.targetAmount,
        goal.currentAmount,
        toMysqlDate(goal.dueDate),
        goal.notes ?? null,
        toMysqlDateTime(goal.createdAt),
        toMysqlDateTime(goal.updatedAt),
      ]),
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
