export const expenseCategoryNames = [
  "Food",
  "Transport",
  "Bills",
  "Utilities",
  "Shopping",
  "Entertainment",
  "Healthcare",
  "Education",
  "Others",
] as const;

export const incomeSourceNames = [
  "Salary",
  "Freelance",
  "Business",
  "Investment",
  "Gift",
  "Others",
] as const;

export const assetCategoryNames = [
  "Tech & Gadgets",
  "Vehicles",
  "Property",
  "Investments",
  "GCash Savings",
  "GSave",
  "GFunds",
  "GStocks",
  "GInsure",
  "Maya Savings",
  "Business Assets",
  "Collectibles",
  "Others",
] as const;

export const paymentMethods = [
  "Cash",
  "Credit Card",
  "Debit Card",
  "E-wallet",
] as const;

export const assetConditions = ["Excellent", "Good", "Fair", "Poor"] as const;

export type ExpenseCategory = (typeof expenseCategoryNames)[number] | string;
export type IncomeSource = (typeof incomeSourceNames)[number] | string;
export type AssetCategory = (typeof assetCategoryNames)[number] | string;
export type PaymentMethod = (typeof paymentMethods)[number];
export type AssetCondition = (typeof assetConditions)[number];
export type CategoryType = "expense" | "income" | "asset";
export type ExportFormat = "csv" | "excel";
export type DateFormatPreference = "MMM d, yyyy" | "yyyy-MM-dd" | "dd/MM/yyyy";

export interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  uploadedAt: string;
}

export interface Category {
  id: string;
  type: CategoryType;
  name: string;
  icon?: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string;
  description?: string;
  paymentMethod: PaymentMethod;
  receipt?: StoredFile | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Income {
  id: string;
  date: string;
  amount: number;
  source: string;
  description?: string;
  paymentMethod: PaymentMethod;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  name: string;
  category: string;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  location: string;
  serialNumber?: string;
  warrantyExpiry?: string;
  insuranceDetails?: string;
  condition: AssetCondition;
  photos: StoredFile[];
  documents: StoredFile[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
  month: number;
  year: number;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  dueDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  fullName: string;
  email: string;
  currency: "PHP";
  dateFormat: DateFormatPreference;
  exportFormat: ExportFormat;
  liabilities: number;
}

export interface FinanceSettings {
  profile: UserProfile;
  darkMode: boolean;
}

export interface FinanceBackup {
  version: 1;
  exportedAt: string;
  expenses: Expense[];
  incomes: Income[];
  assets: Asset[];
  budgets: Budget[];
  goals: SavingsGoal[];
  categories: Category[];
  settings: FinanceSettings;
}
