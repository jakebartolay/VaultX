"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
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

interface FinanceState {
  expenses: Expense[];
  incomes: Income[];
  assets: Asset[];
  budgets: Budget[];
  goals: SavingsGoal[];
  categories: Category[];
  settings: FinanceSettings;
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
const initialData = createDemoData();

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      ...initialData,
      addExpense: (expense) =>
        set((state) => ({
          expenses: [
            { ...expense, id: createId("exp"), createdAt: nowIso(), updatedAt: nowIso() },
            ...state.expenses,
          ],
        })),
      updateExpense: (id, expense) =>
        set((state) => ({
          expenses: state.expenses.map((item) =>
            item.id === id ? { ...item, ...expense, updatedAt: nowIso() } : item,
          ),
        })),
      deleteExpense: (id) =>
        set((state) => ({ expenses: state.expenses.filter((item) => item.id !== id) })),
      deleteExpenses: (ids) =>
        set((state) => ({
          expenses: state.expenses.filter((item) => !ids.includes(item.id)),
        })),
      addIncome: (income) =>
        set((state) => ({
          incomes: [
            { ...income, id: createId("inc"), createdAt: nowIso(), updatedAt: nowIso() },
            ...state.incomes,
          ],
        })),
      updateIncome: (id, income) =>
        set((state) => ({
          incomes: state.incomes.map((item) =>
            item.id === id ? { ...item, ...income, updatedAt: nowIso() } : item,
          ),
        })),
      deleteIncome: (id) =>
        set((state) => ({ incomes: state.incomes.filter((item) => item.id !== id) })),
      addAsset: (asset) =>
        set((state) => ({
          assets: [
            { ...asset, id: createId("ast"), createdAt: nowIso(), updatedAt: nowIso() },
            ...state.assets,
          ],
        })),
      updateAsset: (id, asset) =>
        set((state) => ({
          assets: state.assets.map((item) =>
            item.id === id ? { ...item, ...asset, updatedAt: nowIso() } : item,
          ),
        })),
      deleteAsset: (id) =>
        set((state) => ({ assets: state.assets.filter((item) => item.id !== id) })),
      addBudget: (budget) =>
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
        })),
      updateBudget: (id, budget) =>
        set((state) => ({
          budgets: state.budgets.map((item) => (item.id === id ? { ...item, ...budget } : item)),
        })),
      deleteBudget: (id) =>
        set((state) => ({ budgets: state.budgets.filter((item) => item.id !== id) })),
      addGoal: (goal) =>
        set((state) => ({
          goals: [
            { ...goal, id: createId("goal"), createdAt: nowIso(), updatedAt: nowIso() },
            ...state.goals,
          ],
        })),
      updateGoal: (id, goal) =>
        set((state) => ({
          goals: state.goals.map((item) =>
            item.id === id ? { ...item, ...goal, updatedAt: nowIso() } : item,
          ),
        })),
      deleteGoal: (id) =>
        set((state) => ({ goals: state.goals.filter((item) => item.id !== id) })),
      addCategory: (category) =>
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
        })),
      updateCategory: (id, category) =>
        set((state) => ({
          categories: state.categories.map((item) =>
            item.id === id && !item.isDefault ? { ...item, ...category } : item,
          ),
        })),
      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((item) => item.id !== id || item.isDefault),
        })),
      updateProfile: (profile) =>
        set((state) => ({
          settings: {
            ...state.settings,
            profile: { ...state.settings.profile, ...profile },
          },
        })),
      setDarkMode: (darkMode) =>
        set((state) => ({
          settings: { ...state.settings, darkMode },
        })),
      importBackup: (backup) =>
        set({
          expenses: backup.expenses,
          incomes: backup.incomes,
          assets: backup.assets,
          budgets: backup.budgets,
          goals: backup.goals,
          categories: backup.categories.length > 0 ? backup.categories : createDefaultCategories(),
          settings: backup.settings ?? defaultSettings,
        }),
      resetDemoData: () => set(createDemoData()),
      clearTransactions: () =>
        set((state) => ({
          expenses: [],
          incomes: [],
          assets: [],
          budgets: [],
          goals: [],
          categories: createDefaultCategories(),
          settings: state.settings,
        })),
    }),
    {
      name: "vaultx-finance-store",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
