import Papa from "papaparse";
import {
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isSameWeek,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from "date-fns";
import type {
  Asset,
  Budget,
  Category,
  CategoryType,
  Expense,
  FinanceBackup,
  FinanceSettings,
  Income,
  SavingsGoal,
  StoredFile,
  UserProfile,
} from "@/lib/finance-types";
import {
  assetCategoryNames,
  expenseCategoryNames,
  incomeSourceNames,
} from "@/lib/finance-types";

export const chartColors = [
  "#0f766e",
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#dc2626",
  "#64748b",
  "#0891b2",
  "#84cc16",
  "#f97316",
  "#475569",
];

const categoryPalettes: Record<CategoryType, string[]> = {
  expense: [
    "#ef4444",
    "#0ea5e9",
    "#f59e0b",
    "#14b8a6",
    "#ec4899",
    "#8b5cf6",
    "#22c55e",
    "#6366f1",
    "#64748b",
  ],
  income: ["#16a34a", "#0284c7", "#0f766e", "#4d7c0f", "#f59e0b", "#64748b"],
  asset: ["#2563eb", "#dc2626", "#0f766e", "#16a34a", "#9333ea", "#f59e0b", "#64748b"],
};

export const defaultProfile: UserProfile = {
  fullName: "VaultX User",
  email: "you@example.com",
  currency: "PHP",
  dateFormat: "MMM d, yyyy",
  exportFormat: "csv",
  liabilities: 35000,
};

export const defaultSettings: FinanceSettings = {
  profile: defaultProfile,
  darkMode: false,
};

export function createId(prefix = "vx") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export function createDefaultCategories() {
  const now = new Date().toISOString();
  const expenseCategories: Category[] = expenseCategoryNames.map((name, index) => ({
    id: createId("cat"),
    type: "expense",
    name,
    color: categoryPalettes.expense[index] ?? chartColors[index % chartColors.length],
    icon: name,
    isDefault: true,
    createdAt: now,
  }));
  const incomeCategories: Category[] = incomeSourceNames.map((name, index) => ({
    id: createId("cat"),
    type: "income",
    name,
    color: categoryPalettes.income[index] ?? chartColors[index % chartColors.length],
    icon: name,
    isDefault: true,
    createdAt: now,
  }));
  const assetCategories: Category[] = assetCategoryNames.map((name, index) => ({
    id: createId("cat"),
    type: "asset",
    name,
    color: categoryPalettes.asset[index] ?? chartColors[index % chartColors.length],
    icon: name,
    isDefault: true,
    createdAt: now,
  }));

  return [...expenseCategories, ...incomeCategories, ...assetCategories];
}

export function formatCurrency(value: number, currency: "PHP" = "PHP") {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0 }).format(value);
}

export function formatDate(value: string, pattern = "MMM d, yyyy") {
  return format(parseISO(value), pattern);
}

export function formatDateTime(value: string, pattern = "MMM d, yyyy") {
  return `${formatDate(value, pattern)} ${format(parseISO(value), "h:mm a")}`;
}

export function toDateInput(value?: string) {
  return format(value ? parseISO(value) : new Date(), "yyyy-MM-dd");
}

export function toDateTimeInput(value?: string) {
  return format(value ? parseISO(value) : new Date(), "yyyy-MM-dd'T'HH:mm");
}

export function fromDateInput(value: string) {
  return new Date(`${value}T00:00:00`).toISOString();
}

export function fromDateTimeInput(value: string) {
  return new Date(value).toISOString();
}

export function sumAmounts<T extends { amount: number }>(items: T[]) {
  return items.reduce((total, item) => total + item.amount, 0);
}

export function sumAssetValues(assets: Asset[]) {
  return assets.reduce((total, asset) => total + asset.currentValue, 0);
}

export function expensesToday(expenses: Expense[], date = new Date()) {
  return expenses.filter((expense) => isSameDay(parseISO(expense.date), date));
}

export function expensesThisWeek(expenses: Expense[], date = new Date()) {
  return expenses.filter((expense) =>
    isSameWeek(parseISO(expense.date), date, { weekStartsOn: 1 }),
  );
}

export function expensesThisMonth(expenses: Expense[], date = new Date()) {
  return expenses.filter((expense) => isSameMonth(parseISO(expense.date), date));
}

export function incomesThisMonth(incomes: Income[], date = new Date()) {
  return incomes.filter((income) => isSameMonth(parseISO(income.date), date));
}

export function withinDateRange(value: string, start?: string, end?: string) {
  const date = parseISO(value);
  const startDate = start ? parseISO(`${start}T00:00:00`) : null;
  const endDate = end ? parseISO(`${end}T23:59:59`) : null;

  if (startDate && date < startDate) return false;
  if (endDate && date > endDate) return false;
  return true;
}

export function categoryTotals(expenses: Expense[]) {
  const totals = new Map<string, number>();
  expenses.forEach((expense) => {
    totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amount);
  });

  return Array.from(totals, ([name, value], index) => ({
    name,
    value,
    fill: chartColors[index % chartColors.length],
  })).sort((a, b) => b.value - a.value);
}

export function sourceTotals(incomes: Income[]) {
  const totals = new Map<string, number>();
  incomes.forEach((income) => {
    totals.set(income.source, (totals.get(income.source) ?? 0) + income.amount);
  });

  return Array.from(totals, ([name, value], index) => ({
    name,
    value,
    fill: chartColors[index % chartColors.length],
  })).sort((a, b) => b.value - a.value);
}

export function assetAllocation(assets: Asset[]) {
  const totals = new Map<string, number>();
  assets.forEach((asset) => {
    totals.set(asset.category, (totals.get(asset.category) ?? 0) + asset.currentValue);
  });

  return Array.from(totals, ([name, value], index) => ({
    name,
    value,
    fill: chartColors[index % chartColors.length],
  })).sort((a, b) => b.value - a.value);
}

export function monthlyIncomeExpenseTrend(expenses: Expense[], incomes: Income[]) {
  return Array.from({ length: 6 }).map((_, offset) => {
    const month = subMonths(new Date(), 5 - offset);
    const monthExpenses = expenses.filter((expense) => isSameMonth(parseISO(expense.date), month));
    const monthIncome = incomes.filter((income) => isSameMonth(parseISO(income.date), month));

    return {
      name: format(month, "MMM"),
      income: sumAmounts(monthIncome),
      expenses: sumAmounts(monthExpenses),
    };
  });
}

export function dailySpendingTrend(expenses: Expense[], days = 14) {
  return Array.from({ length: days }).map((_, offset) => {
    const day = subDays(new Date(), days - 1 - offset);
    const dayExpenses = expenses.filter((expense) => isSameDay(parseISO(expense.date), day));

    return {
      name: format(day, "MMM d"),
      expenses: sumAmounts(dayExpenses),
    };
  });
}

export function topSpendingDays(expenses: Expense[], limit = 5) {
  const totals = new Map<string, number>();
  expenses.forEach((expense) => {
    const key = format(parseISO(expense.date), "yyyy-MM-dd");
    totals.set(key, (totals.get(key) ?? 0) + expense.amount);
  });

  return Array.from(totals, ([date, amount]) => ({ date, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

export function spendingAverages(expenses: Expense[]) {
  if (expenses.length === 0) {
    return { daily: 0, weekly: 0, monthly: 0 };
  }

  const dates = expenses.map((expense) => parseISO(expense.date).getTime());
  const oldest = new Date(Math.min(...dates));
  const newest = new Date(Math.max(...dates));
  const total = sumAmounts(expenses);
  const days = Math.max(1, differenceInCalendarDays(newest, oldest) + 1);
  const weeks = Math.max(1, Math.ceil(days / 7));
  const months = Math.max(1, (newest.getFullYear() - oldest.getFullYear()) * 12 + newest.getMonth() - oldest.getMonth() + 1);

  return {
    daily: total / days,
    weekly: total / weeks,
    monthly: total / months,
  };
}

export function currentVsPreviousMonth(expenses: Expense[]) {
  const current = new Date();
  const previous = subMonths(current, 1);
  const currentTotal = sumAmounts(expenses.filter((expense) => isSameMonth(parseISO(expense.date), current)));
  const previousTotal = sumAmounts(expenses.filter((expense) => isSameMonth(parseISO(expense.date), previous)));
  const change = previousTotal === 0 ? 100 : ((currentTotal - previousTotal) / previousTotal) * 100;

  return { currentTotal, previousTotal, change };
}

export function netWorthTrend(
  expenses: Expense[],
  incomes: Income[],
  assets: Asset[],
  liabilities: number,
) {
  const assetValue = sumAssetValues(assets);

  return Array.from({ length: 6 }).map((_, offset) => {
    const month = subMonths(new Date(), 5 - offset);
    const monthEnd = endOfMonth(month);
    const incomeToDate = incomes.filter((income) => parseISO(income.date) <= monthEnd);
    const expensesToDate = expenses.filter((expense) => parseISO(expense.date) <= monthEnd);

    return {
      name: format(month, "MMM"),
      netWorth: assetValue + sumAmounts(incomeToDate) - sumAmounts(expensesToDate) - liabilities,
    };
  });
}

export function currentMonthBudgetUsage(expenses: Expense[], budgets: Budget[]) {
  const now = new Date();

  return budgets
    .filter((budget) => budget.month === now.getMonth() + 1 && budget.year === now.getFullYear())
    .map((budget) => {
      const actual = sumAmounts(
        expenses.filter(
          (expense) =>
            expense.category === budget.category &&
            isSameMonth(parseISO(expense.date), now),
        ),
      );
      const percent = budget.monthlyLimit === 0 ? 0 : (actual / budget.monthlyLimit) * 100;

      return { ...budget, actual, percent };
    });
}

export function monthlyDateRange(date = new Date()) {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

export function weeklyDateRange(date = new Date()) {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  };
}

const depreciationRates: Record<string, number> = {
  "Tech & Gadgets": 0.28,
  Vehicles: 0.18,
  Property: -0.03,
  Investments: 0,
  "Business Assets": 0.12,
  Collectibles: -0.01,
  Others: 0.08,
};

export function calculateDepreciation(asset: Asset) {
  const ageDays = Math.max(0, differenceInCalendarDays(new Date(), parseISO(asset.purchaseDate)));
  const ageYears = ageDays / 365.25;
  const annualRate = depreciationRates[asset.category] ?? 0.08;
  const estimatedValue =
    annualRate < 0
      ? asset.purchasePrice * Math.pow(1 + Math.abs(annualRate), ageYears)
      : asset.purchasePrice * Math.pow(1 - annualRate, ageYears);
  const valueDelta = asset.currentValue - asset.purchasePrice;
  const depreciationPercent =
    asset.purchasePrice === 0 ? 0 : ((asset.purchasePrice - asset.currentValue) / asset.purchasePrice) * 100;

  return {
    ageYears,
    annualRate,
    estimatedValue: Math.max(0, estimatedValue),
    valueDelta,
    depreciationPercent,
  };
}

export function warrantyStatus(asset: Asset) {
  if (!asset.warrantyExpiry) return { label: "No warranty", tone: "muted" as const, days: null };

  const days = differenceInCalendarDays(parseISO(asset.warrantyExpiry), new Date());
  if (days < 0) return { label: "Expired", tone: "danger" as const, days };
  if (days <= 30) return { label: "Expires soon", tone: "warning" as const, days };
  return { label: "Active", tone: "success" as const, days };
}

export async function fileToStoredFile(file: File): Promise<StoredFile> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  return {
    id: createId("file"),
    name: file.name,
    type: file.type,
    size: file.size,
    dataUrl,
    uploadedAt: new Date().toISOString(),
  };
}

export function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function exportRowsToCsv(filename: string, rows: Record<string, unknown>[]) {
  const csv = Papa.unparse(rows);
  downloadBlob(filename, new Blob([csv], { type: "text/csv;charset=utf-8;" }));
}

export function exportRowsToExcel(filename: string, rows: Record<string, unknown>[]) {
  const headers = Object.keys(rows[0] ?? {});
  const escape = (value: unknown) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  const table = [
    "<table>",
    `<tr>${headers.map((header) => `<th>${escape(header)}</th>`).join("")}</tr>`,
    ...rows.map(
      (row) => `<tr>${headers.map((header) => `<td>${escape(row[header])}</td>`).join("")}</tr>`,
    ),
    "</table>",
  ].join("");
  const html = `<html><head><meta charset="utf-8" /></head><body>${table}</body></html>`;

  downloadBlob(filename, new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" }));
}

export function exportRows(
  baseName: string,
  rows: Record<string, unknown>[],
  preferredFormat: "csv" | "excel",
) {
  if (preferredFormat === "excel") {
    exportRowsToExcel(`${baseName}.xls`, rows);
    return;
  }

  exportRowsToCsv(`${baseName}.csv`, rows);
}

export function createBackup(data: Omit<FinanceBackup, "version" | "exportedAt">): FinanceBackup {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    ...data,
  };
}

export function downloadBackup(backup: FinanceBackup) {
  downloadBlob(
    `vaultx-backup-${format(new Date(), "yyyy-MM-dd-HHmm")}.json`,
    new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }),
  );
}

export function downloadChartSvg(containerId: string, filename: string) {
  const svg = document.querySelector(`#${containerId} svg`);
  if (!svg) return false;

  const clone = svg.cloneNode(true) as SVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const source = new XMLSerializer().serializeToString(clone);
  downloadBlob(filename, new Blob([source], { type: "image/svg+xml;charset=utf-8;" }));
  return true;
}

export function parseTags(value?: string) {
  return (value ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function tagsToString(tags?: string[]) {
  return (tags ?? []).join(", ");
}

export function normalizeBackup(value: unknown): FinanceBackup {
  const backup = value as Partial<FinanceBackup>;
  if (backup.version !== 1) {
    throw new Error("Unsupported backup version.");
  }
  if (!Array.isArray(backup.expenses) || !Array.isArray(backup.incomes) || !Array.isArray(backup.assets)) {
    throw new Error("Backup file is missing required finance tables.");
  }

  return backup as FinanceBackup;
}

export function createDemoData() {
  const now = new Date();
  const iso = (date: Date) => date.toISOString();
  const categories = createDefaultCategories();
  const expenses: Expense[] = [
    {
      id: createId("exp"),
      date: iso(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 20)),
      amount: 185,
      category: "Food",
      description: "Breakfast and coffee",
      paymentMethod: "E-wallet",
      receipt: null,
      tags: ["daily"],
      createdAt: iso(now),
      updatedAt: iso(now),
    },
    {
      id: createId("exp"),
      date: iso(subDays(now, 1)),
      amount: 920,
      category: "Transport",
      description: "Fuel top-up",
      paymentMethod: "Debit Card",
      receipt: null,
      tags: ["car"],
      createdAt: iso(now),
      updatedAt: iso(now),
    },
    {
      id: createId("exp"),
      date: iso(subDays(now, 3)),
      amount: 2450,
      category: "Bills",
      description: "Internet plan",
      paymentMethod: "Credit Card",
      receipt: null,
      tags: ["recurring"],
      createdAt: iso(now),
      updatedAt: iso(now),
    },
    {
      id: createId("exp"),
      date: iso(subDays(now, 8)),
      amount: 3750,
      category: "Shopping",
      description: "Work shoes",
      paymentMethod: "E-wallet",
      receipt: null,
      tags: ["personal"],
      createdAt: iso(now),
      updatedAt: iso(now),
    },
    {
      id: createId("exp"),
      date: iso(subDays(now, 18)),
      amount: 1280,
      category: "Utilities",
      description: "Electricity bill",
      paymentMethod: "E-wallet",
      receipt: null,
      tags: ["home"],
      createdAt: iso(now),
      updatedAt: iso(now),
    },
  ];

  const incomes: Income[] = [
    {
      id: createId("inc"),
      date: iso(new Date(now.getFullYear(), now.getMonth(), 1, 9)),
      amount: 74000,
      source: "Salary",
      description: "Monthly salary",
      paymentMethod: "Debit Card",
      tags: ["payroll"],
      createdAt: iso(now),
      updatedAt: iso(now),
    },
    {
      id: createId("inc"),
      date: iso(subDays(now, 12)),
      amount: 18000,
      source: "Freelance",
      description: "Landing page project",
      paymentMethod: "E-wallet",
      tags: ["client"],
      createdAt: iso(now),
      updatedAt: iso(now),
    },
    {
      id: createId("inc"),
      date: iso(subMonths(now, 1)),
      amount: 3500,
      source: "Investment",
      description: "Dividend payout",
      paymentMethod: "Debit Card",
      tags: ["passive"],
      createdAt: iso(now),
      updatedAt: iso(now),
    },
  ];

  const assets: Asset[] = [
    {
      id: createId("ast"),
      name: "MacBook Pro 14",
      category: "Tech & Gadgets",
      purchaseDate: iso(subMonths(now, 11)),
      purchasePrice: 126000,
      currentValue: 104000,
      location: "Home office",
      serialNumber: "MBP14-DEMO",
      warrantyExpiry: iso(subMonths(now, -1)),
      insuranceDetails: "Included in home office rider",
      condition: "Excellent",
      photos: [],
      documents: [],
      notes: "Primary work machine.",
      createdAt: iso(now),
      updatedAt: iso(now),
    },
    {
      id: createId("ast"),
      name: "Emergency fund",
      category: "Investments",
      purchaseDate: iso(subMonths(now, 18)),
      purchasePrice: 180000,
      currentValue: 214000,
      location: "Digital bank",
      serialNumber: "",
      warrantyExpiry: "",
      insuranceDetails: "",
      condition: "Excellent",
      photos: [],
      documents: [],
      notes: "High-yield savings allocation.",
      createdAt: iso(now),
      updatedAt: iso(now),
    },
    {
      id: createId("ast"),
      name: "Scooter",
      category: "Vehicles",
      purchaseDate: iso(subMonths(now, 30)),
      purchasePrice: 86000,
      currentValue: 52000,
      location: "Garage",
      serialNumber: "VX-SCOOT-01",
      warrantyExpiry: iso(subMonths(now, -6)),
      insuranceDetails: "Comprehensive until renewal month",
      condition: "Good",
      photos: [],
      documents: [],
      notes: "Used for short city trips.",
      createdAt: iso(now),
      updatedAt: iso(now),
    },
  ];

  const budgets: Budget[] = ["Food", "Transport", "Bills", "Shopping"].map((category, index) => ({
    id: createId("bud"),
    category,
    monthlyLimit: [12000, 9000, 6500, 8000][index],
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    createdAt: iso(now),
  }));

  const goals: SavingsGoal[] = [
    {
      id: createId("goal"),
      name: "New investment fund",
      targetAmount: 250000,
      currentAmount: 118000,
      dueDate: iso(subMonths(now, -8)),
      notes: "Build a long-term investment buffer.",
      createdAt: iso(now),
      updatedAt: iso(now),
    },
    {
      id: createId("goal"),
      name: "Travel sinking fund",
      targetAmount: 90000,
      currentAmount: 38000,
      dueDate: iso(subMonths(now, -5)),
      notes: "Keep travel spending pre-funded.",
      createdAt: iso(now),
      updatedAt: iso(now),
    },
  ];

  return {
    expenses,
    incomes,
    assets,
    budgets,
    goals,
    categories,
    settings: defaultSettings,
  };
}
