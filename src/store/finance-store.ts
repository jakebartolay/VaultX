"use client";

import { create } from "zustand";
import type {
  Asset,
  Budget,
  Category,
  Expense,
  FinanceBackup,
  FinanceSettings,
  Income,
  SavingsGoal,
  UserProfile,
} from "@/lib/finance-types";
import {
  createDefaultCategories,
  createDemoData,
  createId,
  defaultSettings,
} from "@/lib/finance-utils";

type ExpenseInput = Omit<Expense, "id" | "createdAt" | "updatedAt">;
type IncomeInput = Omit<Income, "id" | "createdAt" | "updatedAt">;
type AssetInput = Omit<Asset, "id" | "createdAt" | "updatedAt">;
type BudgetInput = Omit<Budget, "id" | "createdAt">;
type GoalInput = Omit<SavingsGoal, "id" | "createdAt" | "updatedAt">;
type CategoryInput = Omit<Category, "id" | "createdAt" | "isDefault">;

type FinanceSnapshot = {
  expenses: Expense[];
  incomes: Income[];
  assets: Asset[];
  budgets: Budget[];
  goals: SavingsGoal[];
  categories: Category[];
  settings: FinanceSettings;
};

interface FinanceState extends FinanceSnapshot {
  isLoading: boolean;
  isSaving: boolean;
  hasLoaded: boolean;
  syncError: string | null;
  loadFromDatabase: () => Promise<void>;
  syncToDatabase: () => Promise<void>;
  addExpense: (expense: ExpenseInput) => void;
  updateExpense: (id: string, expense: ExpenseInput) => void;
  deleteExpense: (id: string) => void;
  deleteExpenses: (ids: string[]) => void;
  addIncome: (income: IncomeInput) => void;
  updateIncome: (id: string, income: IncomeInput) => void;
  deleteIncome: (id: string) => void;
  addAsset: (asset: AssetInput) => void;
  updateAsset: (id: string, asset: AssetInput) => void;
  deleteAsset: (id: string) => void;
  addBudget: (budget: BudgetInput) => void;
  updateBudget: (id: string, budget: BudgetInput) => void;
  deleteBudget: (id: string) => void;
  addGoal: (goal: GoalInput) => void;
  updateGoal: (id: string, goal: GoalInput) => void;
  deleteGoal: (id: string) => void;
  addCategory: (category: CategoryInput) => void;
  updateCategory: (id: string, category: CategoryInput) => void;
  deleteCategory: (id: string) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  setDarkMode: (darkMode: boolean) => void;
  importBackup: (backup: FinanceBackup) => void;
  resetDemoData: () => void;
  clearTransactions: () => void;
}

const nowIso = () => new Date().toISOString();
const emptySnapshot: FinanceSnapshot = {
  expenses: [],
  incomes: [],
  assets: [],
  budgets: [],
  goals: [],
  categories: [],
  settings: defaultSettings,
};

let saveTimer: ReturnType<typeof setTimeout> | undefined;
let saveVersion = 0;

function snapshotFromState(state: FinanceState): FinanceSnapshot {
  return {
    expenses: state.expenses,
    incomes: state.incomes,
    assets: state.assets,
    budgets: state.budgets,
    goals: state.goals,
    categories: state.categories,
    settings: state.settings,
  };
}

async function putSnapshot(snapshot: FinanceSnapshot) {
  const response = await fetch("/api/finance", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(snapshot),
  });

  if (!response.ok) {
    throw new Error("Database save failed");
  }
}

export const useFinanceStore = create<FinanceState>()((set, get) => {
  const syncNow = async () => {
    const version = ++saveVersion;

    set({ isSaving: true, syncError: null });

    try {
      await putSnapshot(snapshotFromState(get()));

      if (version === saveVersion) {
        set({ isSaving: false, syncError: null });
      }
    } catch {
      if (version === saveVersion) {
        set({ isSaving: false, syncError: "Unable to save changes to the database." });
      }
    }
  };

  const queueSync = () => {
    if (saveTimer) {
      clearTimeout(saveTimer);
    }

    set({ isSaving: true, syncError: null });

    saveTimer = setTimeout(() => {
      void syncNow();
    }, 300);
  };

  return {
    ...emptySnapshot,
    isLoading: false,
    isSaving: false,
    hasLoaded: false,
    syncError: null,
    loadFromDatabase: async () => {
      if (get().isLoading) return;

      set({ isLoading: true, syncError: null });

      try {
        const response = await fetch("/api/finance", { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Database load failed");
        }

        const snapshot = (await response.json()) as FinanceSnapshot;

        set({
          ...snapshot,
          categories:
            snapshot.categories.length > 0 ? snapshot.categories : createDefaultCategories(),
          isLoading: false,
          hasLoaded: true,
          syncError: null,
        });
      } catch {
        set({
          isLoading: false,
          hasLoaded: true,
          syncError: "Unable to load finance data from the database.",
        });
      }
    },
    syncToDatabase: syncNow,
    addExpense: (expense) => {
      set((state) => ({
        expenses: [
          { ...expense, id: createId("exp"), createdAt: nowIso(), updatedAt: nowIso() },
          ...state.expenses,
        ],
      }));
      queueSync();
    },
    updateExpense: (id, expense) => {
      set((state) => ({
        expenses: state.expenses.map((item) =>
          item.id === id ? { ...item, ...expense, updatedAt: nowIso() } : item,
        ),
      }));
      queueSync();
    },
    deleteExpense: (id) => {
      set((state) => ({ expenses: state.expenses.filter((item) => item.id !== id) }));
      queueSync();
    },
    deleteExpenses: (ids) => {
      set((state) => ({
        expenses: state.expenses.filter((item) => !ids.includes(item.id)),
      }));
      queueSync();
    },
    addIncome: (income) => {
      set((state) => ({
        incomes: [
          { ...income, id: createId("inc"), createdAt: nowIso(), updatedAt: nowIso() },
          ...state.incomes,
        ],
      }));
      queueSync();
    },
    updateIncome: (id, income) => {
      set((state) => ({
        incomes: state.incomes.map((item) =>
          item.id === id ? { ...item, ...income, updatedAt: nowIso() } : item,
        ),
      }));
      queueSync();
    },
    deleteIncome: (id) => {
      set((state) => ({ incomes: state.incomes.filter((item) => item.id !== id) }));
      queueSync();
    },
    addAsset: (asset) => {
      set((state) => ({
        assets: [
          { ...asset, id: createId("ast"), createdAt: nowIso(), updatedAt: nowIso() },
          ...state.assets,
        ],
      }));
      queueSync();
    },
    updateAsset: (id, asset) => {
      set((state) => ({
        assets: state.assets.map((item) =>
          item.id === id ? { ...item, ...asset, updatedAt: nowIso() } : item,
        ),
      }));
      queueSync();
    },
    deleteAsset: (id) => {
      set((state) => ({ assets: state.assets.filter((item) => item.id !== id) }));
      queueSync();
    },
    addBudget: (budget) => {
      set((state) => ({
        budgets: [
          { ...budget, id: createId("bud"), createdAt: nowIso() },
          ...state.budgets.filter(
            (item) =>
              !(
                item.category === budget.category &&
                item.month === budget.month &&
                item.year === budget.year
              ),
          ),
        ],
      }));
      queueSync();
    },
    updateBudget: (id, budget) => {
      set((state) => ({
        budgets: state.budgets.map((item) => (item.id === id ? { ...item, ...budget } : item)),
      }));
      queueSync();
    },
    deleteBudget: (id) => {
      set((state) => ({ budgets: state.budgets.filter((item) => item.id !== id) }));
      queueSync();
    },
    addGoal: (goal) => {
      set((state) => ({
        goals: [
          { ...goal, id: createId("goal"), createdAt: nowIso(), updatedAt: nowIso() },
          ...state.goals,
        ],
      }));
      queueSync();
    },
    updateGoal: (id, goal) => {
      set((state) => ({
        goals: state.goals.map((item) =>
          item.id === id ? { ...item, ...goal, updatedAt: nowIso() } : item,
        ),
      }));
      queueSync();
    },
    deleteGoal: (id) => {
      set((state) => ({ goals: state.goals.filter((item) => item.id !== id) }));
      queueSync();
    },
    addCategory: (category) => {
      set((state) => ({
        categories: [
          {
            ...category,
            id: createId("cat"),
            isDefault: false,
            createdAt: nowIso(),
          },
          ...state.categories,
        ],
      }));
      queueSync();
    },
    updateCategory: (id, category) => {
      set((state) => ({
        categories: state.categories.map((item) =>
          item.id === id && !item.isDefault ? { ...item, ...category } : item,
        ),
      }));
      queueSync();
    },
    deleteCategory: (id) => {
      set((state) => ({
        categories: state.categories.filter((item) => item.id !== id || item.isDefault),
      }));
      queueSync();
    },
    updateProfile: (profile) => {
      set((state) => ({
        settings: {
          ...state.settings,
          profile: { ...state.settings.profile, ...profile },
        },
      }));
      queueSync();
    },
    setDarkMode: (darkMode) => {
      set((state) => ({
        settings: { ...state.settings, darkMode },
      }));
      queueSync();
    },
    importBackup: (backup) => {
      set({
        expenses: backup.expenses,
        incomes: backup.incomes,
        assets: backup.assets,
        budgets: backup.budgets,
        goals: backup.goals,
        categories: backup.categories.length > 0 ? backup.categories : createDefaultCategories(),
        settings: backup.settings ?? defaultSettings,
      });
      queueSync();
    },
    resetDemoData: () => {
      set(createDemoData());
      queueSync();
    },
    clearTransactions: () => {
      set((state) => ({
        expenses: [],
        incomes: [],
        assets: [],
        budgets: [],
        goals: [],
        categories: createDefaultCategories(),
        settings: state.settings,
      }));
      queueSync();
    },
  };
});
