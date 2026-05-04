"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  FileSpreadsheet,
  Filter,
  Gem,
  Grid2X2,
  Home,
  Menu,
  Moon,
  MoreHorizontal,
  Pencil,
  Plus,
  ReceiptText,
  RotateCcw,
  Search,
  Settings,
  Sun,
  Table2,
  Tags,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { FileDropzone } from "@/components/finance/file-dropzone";
import type {
  Asset,
  AssetCondition,
  Budget,
  Category,
  CategoryType,
  Expense,
  FinanceBackup,
  Income,
  PaymentMethod,
  SavingsGoal,
  StoredFile,
} from "@/lib/finance-types";
import { assetConditions, paymentMethods } from "@/lib/finance-types";
import {
  assetAllocation,
  calculateDepreciation,
  categoryTotals,
  chartColors,
  createBackup,
  currentMonthBudgetUsage,
  currentVsPreviousMonth,
  dailySpendingTrend,
  downloadBackup,
  downloadChartSvg,
  expensesThisMonth,
  expensesThisWeek,
  expensesToday,
  exportRows,
  formatCurrency,
  formatDate,
  formatDateTime,
  fromDateInput,
  fromDateTimeInput,
  incomesThisMonth,
  monthlyIncomeExpenseTrend,
  netWorthTrend,
  normalizeBackup,
  parseTags,
  sourceTotals,
  spendingAverages,
  sumAmounts,
  sumAssetValues,
  tagsToString,
  toDateInput,
  toDateTimeInput,
  topSpendingDays,
  warrantyStatus,
  withinDateRange,
} from "@/lib/finance-utils";
import { useFinanceStore } from "@/store/finance-store";
import { cn } from "@/lib/utils";

type ViewKey =
  | "overview"
  | "expenses"
  | "income"
  | "assets"
  | "reports"
  | "budgets"
  | "categories"
  | "settings";

const navItems: { key: ViewKey; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: Home },
  { key: "expenses", label: "Expenses", icon: ReceiptText },
  { key: "income", label: "Income", icon: WalletCards },
  { key: "assets", label: "Assets", icon: Gem },
  { key: "reports", label: "Reports", icon: BarChart3 },
  { key: "budgets", label: "Budgets & Goals", icon: Target },
  { key: "categories", label: "Categories", icon: Tags },
  { key: "settings", label: "Settings", icon: Settings },
];

const viewRoutes: Record<ViewKey, string> = {
  overview: "/overview",
  expenses: "/expenses",
  income: "/income",
  assets: "/assets",
  reports: "/reports",
  budgets: "/budgets",
  categories: "/categories",
  settings: "/settings",
};

function viewFromPathname(pathname: string): ViewKey {
  const segment = pathname.split("/").filter(Boolean)[0];
  const view = segment === undefined ? "overview" : segment;

  return view in viewRoutes ? (view as ViewKey) : "overview";
}

const expenseSchema = z.object({
  date: z.string().min(1, "Date and time is required"),
  amount: z.number().positive("Amount must be greater than zero"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  paymentMethod: z.enum(paymentMethods),
  tags: z.string().optional(),
});

const incomeSchema = z.object({
  date: z.string().min(1, "Date is required"),
  amount: z.number().positive("Amount must be greater than zero"),
  source: z.string().min(1, "Source is required"),
  description: z.string().optional(),
  paymentMethod: z.enum(paymentMethods),
  tags: z.string().optional(),
});

const assetSchema = z.object({
  name: z.string().min(2, "Asset name is required"),
  category: z.string().min(1, "Category is required"),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  purchasePrice: z.number().nonnegative(),
  currentValue: z.number().nonnegative(),
  location: z.string().min(1, "Location is required"),
  serialNumber: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  insuranceDetails: z.string().optional(),
  condition: z.enum(assetConditions),
  notes: z.string().optional(),
});

const budgetSchema = z.object({
  category: z.string().min(1, "Category is required"),
  monthlyLimit: z.number().positive("Budget must be greater than zero"),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
});

const goalSchema = z.object({
  name: z.string().min(2, "Goal name is required"),
  targetAmount: z.number().positive("Target must be greater than zero"),
  currentAmount: z.number().nonnegative(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

const categorySchema = z.object({
  type: z.enum(["expense", "income", "asset"]),
  name: z.string().min(2, "Name is required"),
  color: z.string().min(4, "Color is required"),
  icon: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;
type IncomeFormValues = z.infer<typeof incomeSchema>;
type AssetFormValues = z.infer<typeof assetSchema>;
type BudgetFormValues = z.infer<typeof budgetSchema>;
type GoalFormValues = z.infer<typeof goalSchema>;
type CategoryFormValues = z.infer<typeof categorySchema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-600">{message}</p>;
}

const subscribeNoop = () => () => undefined;

function useIsClient() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
  tone = "teal",
}: {
  title: string;
  value: string;
  detail: string;
  icon: React.ElementType;
  tone?: "teal" | "blue" | "green" | "amber" | "red" | "slate";
}) {
  const toneClass = {
    teal: "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    green: "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    red: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300",
  }[tone];

  return (
    <Card className="rounded-lg">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
        <div className={cn("rounded-lg p-2", toneClass)}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

function ChartCard({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const isClient = useIsClient();

  return (
    <Card className="rounded-lg">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => downloadChartSvg(id, `${id}.svg`)}
          title="Export chart"
        >
          <Download className="h-4 w-4" />
          <span className="sr-only">Export chart</span>
        </Button>
      </CardHeader>
      <CardContent>
        <div id={id} className="h-72 w-full">
          {isClient ? (
            children
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg bg-slate-50 text-sm text-muted-foreground dark:bg-slate-900">
              Preparing chart
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function FinanceApp() {
  const store = useFinanceStore();
  const pathname = usePathname();
  const router = useRouter();
  const { setTheme } = useTheme();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [expenseDialogKey, setExpenseDialogKey] = useState(0);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [incomeDialogKey, setIncomeDialogKey] = useState(0);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [assetDialogKey, setAssetDialogKey] = useState(0);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  useEffect(() => {
    setTheme(store.settings.darkMode ? "dark" : "light");
  }, [setTheme, store.settings.darkMode]);

  const activeView = viewFromPathname(pathname);
  const navigateToView = (view: ViewKey) => {
    router.push(viewRoutes[view]);
  };

  const openExpenseDialog = (expense?: Expense) => {
    setEditingExpense(expense ?? null);
    setExpenseDialogKey((key) => key + 1);
    setExpenseDialogOpen(true);
  };

  const openIncomeDialog = (income?: Income) => {
    setEditingIncome(income ?? null);
    setIncomeDialogKey((key) => key + 1);
    setIncomeDialogOpen(true);
  };

  const openAssetDialog = (asset?: Asset) => {
    setEditingAsset(asset ?? null);
    setAssetDialogKey((key) => key + 1);
    setAssetDialogOpen(true);
  };

  const searchResults = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return [];

    const expenseResults = store.expenses
      .filter((expense) =>
        [expense.description, expense.category, expense.paymentMethod, expense.tags.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(value),
      )
      .slice(0, 4)
      .map((expense) => ({
        id: expense.id,
        label: expense.description || expense.category,
        meta: `Expense • ${formatCurrency(expense.amount)}`,
        view: "expenses" as ViewKey,
      }));
    const incomeResults = store.incomes
      .filter((income) =>
        [income.description, income.source, income.paymentMethod, income.tags.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(value),
      )
      .slice(0, 4)
      .map((income) => ({
        id: income.id,
        label: income.description || income.source,
        meta: `Income • ${formatCurrency(income.amount)}`,
        view: "income" as ViewKey,
      }));
    const assetResults = store.assets
      .filter((asset) =>
        [asset.name, asset.category, asset.location, asset.serialNumber, asset.notes]
          .join(" ")
          .toLowerCase()
          .includes(value),
      )
      .slice(0, 4)
      .map((asset) => ({
        id: asset.id,
        label: asset.name,
        meta: `Asset • ${formatCurrency(asset.currentValue)}`,
        view: "assets" as ViewKey,
      }));

    return [...expenseResults, ...incomeResults, ...assetResults].slice(0, 8);
  }, [query, store.assets, store.expenses, store.incomes]);

  const activeLabel = navItems.find((item) => item.key === activeView)?.label ?? "Overview";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r bg-background lg:block">
          <NavContent
            activeView={activeView}
            profileName={store.settings.profile.fullName}
          />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b bg-background/95 px-4 py-3 backdrop-blur md:px-6">
            <div className="flex items-center gap-3">
              <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetTrigger asChild>
                  <Button className="lg:hidden" size="icon" variant="outline">
                    <Menu className="h-4 w-4" />
                    <span className="sr-only">Open navigation</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <SheetHeader className="sr-only">
                    <SheetTitle>VaultX navigation</SheetTitle>
                  </SheetHeader>
                  <NavContent
                    activeView={activeView}
                    onNavigate={() => {
                      setMobileNavOpen(false);
                    }}
                    profileName={store.settings.profile.fullName}
                  />
                </SheetContent>
              </Sheet>

              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Personal finance workspace</p>
                <h2 className="truncate text-lg font-semibold">{activeLabel}</h2>
              </div>

              <div className="relative hidden w-full max-w-md md:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="pl-9"
                  placeholder="Search expenses, income, assets"
                />
                {searchResults.length > 0 ? (
                  <Card className="absolute right-0 top-12 z-40 w-full rounded-lg shadow-lg">
                    <CardContent className="p-2">
                      {searchResults.map((result) => (
                        <button
                          key={result.id}
                          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
                          onClick={() => {
                            navigateToView(result.view);
                            setQuery("");
                          }}
                        >
                          <span className="truncate">{result.label}</span>
                          <span className="ml-3 shrink-0 text-xs text-muted-foreground">
                            {result.meta}
                          </span>
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                ) : null}
              </div>

              <Button onClick={() => openExpenseDialog()} className="hidden gap-2 bg-teal-700 hover:bg-teal-800 md:flex">
                <Plus className="h-4 w-4" />
                Expense
              </Button>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">
            {activeView === "overview" ? (
              <DashboardSection
                onAddExpense={() => openExpenseDialog()}
                onView={navigateToView}
              />
            ) : null}
            {activeView === "expenses" ? (
              <ExpensesSection onAdd={() => openExpenseDialog()} onEdit={openExpenseDialog} />
            ) : null}
            {activeView === "income" ? (
              <IncomeSection onAdd={() => openIncomeDialog()} onEdit={openIncomeDialog} />
            ) : null}
            {activeView === "assets" ? (
              <AssetsSection onAdd={() => openAssetDialog()} onEdit={openAssetDialog} />
            ) : null}
            {activeView === "reports" ? <ReportsSection /> : null}
            {activeView === "budgets" ? <BudgetsSection /> : null}
            {activeView === "categories" ? <CategoriesSection /> : null}
            {activeView === "settings" ? <SettingsSection /> : null}
          </main>
        </div>
      </div>

      <Button
        onClick={() => openExpenseDialog()}
        className="fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full bg-teal-700 p-0 shadow-lg hover:bg-teal-800 md:hidden"
      >
        <Plus className="h-6 w-6" />
        <span className="sr-only">Quick add expense</span>
      </Button>

      <ExpenseDialog
        key={`expense-${editingExpense?.id ?? "new"}-${expenseDialogKey}`}
        open={expenseDialogOpen}
        expense={editingExpense}
        onOpenChange={setExpenseDialogOpen}
      />
      <IncomeDialog
        key={`income-${editingIncome?.id ?? "new"}-${incomeDialogKey}`}
        open={incomeDialogOpen}
        income={editingIncome}
        onOpenChange={setIncomeDialogOpen}
      />
      <AssetDialog
        key={`asset-${editingAsset?.id ?? "new"}-${assetDialogKey}`}
        open={assetDialogOpen}
        asset={editingAsset}
        onOpenChange={setAssetDialogOpen}
      />
    </div>
  );
}

function NavContent({
  activeView,
  onNavigate,
  profileName,
}: {
  activeView: ViewKey;
  onNavigate?: () => void;
  profileName: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-700 text-white">
            <WalletCards className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold">VaultX</p>
            <p className="text-xs text-muted-foreground">PHP wealth tracker</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={viewRoutes[item.key]}
              onClick={onNavigate}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition",
                activeView === item.key
                  ? "bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-200"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground">Signed in as</p>
        <p className="truncate text-sm font-medium">{profileName}</p>
      </div>
    </div>
  );
}

function DashboardSection({
  onAddExpense,
  onView,
}: {
  onAddExpense: () => void;
  onView: (view: ViewKey) => void;
}) {
  const { expenses, incomes, assets, budgets, settings } = useFinanceStore();
  const profile = settings.profile;
  const today = expensesToday(expenses);
  const week = expensesThisWeek(expenses);
  const monthExpenses = expensesThisMonth(expenses);
  const monthIncomes = incomesThisMonth(incomes);
  const assetValue = sumAssetValues(assets);
  const netWorth = assetValue - profile.liabilities;
  const topCategories = categoryTotals(monthExpenses).slice(0, 5);
  const trend = monthlyIncomeExpenseTrend(expenses, incomes);
  const budgetUsage = currentMonthBudgetUsage(expenses, budgets);
  const alerts = budgetUsage.filter((budget) => budget.percent >= 80);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Overview"
        description="Track net worth, current-month cash flow, and spending pressure at a glance."
        action={
          <Button onClick={onAddExpense} className="gap-2 bg-teal-700 hover:bg-teal-800">
            <Plus className="h-4 w-4" />
            Quick add expense
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total net worth"
          value={formatCurrency(netWorth)}
          detail={`${formatCurrency(assetValue)} assets - ${formatCurrency(profile.liabilities)} liabilities`}
          icon={WalletCards}
          tone="teal"
        />
        <MetricCard
          title="Today's expenses"
          value={formatCurrency(sumAmounts(today))}
          detail={`${today.length} transaction${today.length === 1 ? "" : "s"} recorded today`}
          icon={ReceiptText}
          tone="red"
        />
        <MetricCard
          title="Weekly expenses"
          value={formatCurrency(sumAmounts(week))}
          detail="Monday to Sunday spending summary"
          icon={CalendarDays}
          tone="amber"
        />
        <MetricCard
          title="Monthly expenses"
          value={formatCurrency(sumAmounts(monthExpenses))}
          detail={`${formatCurrency(sumAmounts(monthIncomes))} income this month`}
          icon={TrendingDown}
          tone="blue"
        />
      </div>

      {alerts.length > 0 ? (
        <Alert className="border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Budget alerts</AlertTitle>
          <AlertDescription>
            {alerts
              .map((alert) => `${alert.category} is at ${Math.round(alert.percent)}%`)
              .join(", ")}
            . Review your budget plan before the month gets away from you.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <ChartCard
          id="overview-income-expense"
          title="Income vs expenses"
          description="Current six-month cash flow"
        >
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(value) => `₱${Number(value) / 1000}k`} tickLine={false} axisLine={false} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="income" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          id="overview-top-categories"
          title="Top spending categories"
          description="Current month, top five"
        >
          {topCategories.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
              <PieChart>
                <Pie
                  data={topCategories}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={92}
                  paddingAngle={2}
                >
                  {topCategories.map((entry, index) => (
                    <Cell key={entry.name} fill={entry.fill ?? chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No category data yet" description="Add expenses to populate this chart." />
          )}
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-lg lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Budget pressure</CardTitle>
            <CardDescription>Monthly category limits vs actual spending</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {budgetUsage.length > 0 ? (
              budgetUsage.slice(0, 5).map((budget) => (
                <div key={budget.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium">{budget.category}</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(budget.actual)} / {formatCurrency(budget.monthlyLimit)}
                    </span>
                  </div>
                  <Progress value={Math.min(100, budget.percent)} />
                </div>
              ))
            ) : (
              <EmptyState title="No budgets set" description="Create category budgets to see alerts here." />
            )}
            <Button variant="outline" onClick={() => onView("budgets")}>
              Manage budgets
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="text-base">Asset snapshot</CardTitle>
            <CardDescription>Current value by largest assets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {assets
              .slice()
              .sort((a, b) => b.currentValue - a.currentValue)
              .slice(0, 4)
              .map((asset) => (
                <div key={asset.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{asset.name}</p>
                    <p className="text-xs text-muted-foreground">{asset.category}</p>
                  </div>
                  <span className="shrink-0 font-medium">{formatCurrency(asset.currentValue)}</span>
                </div>
              ))}
            <Button variant="outline" onClick={() => onView("assets")}>
              Open assets
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ExpensesSection({
  onAdd,
  onEdit,
}: {
  onAdd: () => void;
  onEdit: (expense: Expense) => void;
}) {
  const store = useFinanceStore();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    start: "",
    end: "",
    category: "all",
    paymentMethod: "all",
    min: "",
    max: "",
  });
  const expenseCategories = store.categories.filter((category) => category.type === "expense");
  const profile = store.settings.profile;
  const filtered = useMemo(() => {
    return store.expenses
      .filter((expense) => withinDateRange(expense.date, filters.start, filters.end))
      .filter((expense) => filters.category === "all" || expense.category === filters.category)
      .filter((expense) => filters.paymentMethod === "all" || expense.paymentMethod === filters.paymentMethod)
      .filter((expense) => (filters.min ? expense.amount >= Number(filters.min) : true))
      .filter((expense) => (filters.max ? expense.amount <= Number(filters.max) : true))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [filters, store.expenses]);
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const visibleSelected = selected.filter((id) => filtered.some((row) => row.id === id));

  const exportRowsForDownload = filtered.map((expense) => ({
    Date: formatDateTime(expense.date, profile.dateFormat),
    Amount: expense.amount,
    Category: expense.category,
    Description: expense.description,
    "Payment Method": expense.paymentMethod,
    Tags: expense.tags.join(", "),
  }));

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Expense tracker"
        description="Add, filter, edit, bulk delete, and export every expense."
        action={
          <Button onClick={onAdd} className="gap-2 bg-teal-700 hover:bg-teal-800">
            <Plus className="h-4 w-4" />
            Add expense
          </Button>
        }
      />

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <Input
            type="date"
            value={filters.start}
            onChange={(event) => setFilters((current) => ({ ...current, start: event.target.value }))}
          />
          <Input
            type="date"
            value={filters.end}
            onChange={(event) => setFilters((current) => ({ ...current, end: event.target.value }))}
          />
          <Select
            value={filters.category}
            onValueChange={(value) => setFilters((current) => ({ ...current, category: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {expenseCategories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.paymentMethod}
            onValueChange={(value) => setFilters((current) => ({ ...current, paymentMethod: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All methods</SelectItem>
              {paymentMethods.map((method) => (
                <SelectItem key={method} value={method}>
                  {method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            min="0"
            placeholder="Min amount"
            value={filters.min}
            onChange={(event) => setFilters((current) => ({ ...current, min: event.target.value }))}
          />
          <Input
            type="number"
            min="0"
            placeholder="Max amount"
            value={filters.max}
            onChange={(event) => setFilters((current) => ({ ...current, max: event.target.value }))}
          />
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">All expenses</CardTitle>
            <CardDescription>
              {filtered.length} record{filtered.length === 1 ? "" : "s"} found
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={exportRowsForDownload.length === 0}
              onClick={() =>
                exportRows("vaultx-expenses", exportRowsForDownload, store.settings.profile.exportFormat)
              }
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export
            </Button>
            <Button
              variant="destructive"
              disabled={visibleSelected.length === 0}
              onClick={() => {
                store.deleteExpenses(visibleSelected);
                setSelected([]);
              }}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Bulk delete
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={pageRows.length > 0 && pageRows.every((row) => selected.includes(row.id))}
                      onCheckedChange={(checked) =>
                        setSelected((current) =>
                          checked
                            ? Array.from(new Set([...current, ...pageRows.map((row) => row.id)]))
                            : current.filter((id) => !pageRows.some((row) => row.id === id)),
                        )
                      }
                    />
                  </TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.length > 0 ? (
                  pageRows.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        <Checkbox
                          checked={selected.includes(expense.id)}
                          onCheckedChange={(checked) =>
                            setSelected((current) =>
                              checked
                                ? [...current, expense.id]
                                : current.filter((id) => id !== expense.id),
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDateTime(expense.date, profile.dateFormat)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{expense.category}</Badge>
                      </TableCell>
                      <TableCell className="min-w-52">
                        <p className="font-medium">{expense.description || "No description"}</p>
                        {expense.tags.length > 0 ? (
                          <p className="text-xs text-muted-foreground">{expense.tags.join(", ")}</p>
                        ) : null}
                      </TableCell>
                      <TableCell>{expense.paymentMethod}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell>
                        <RowActions
                          onEdit={() => onEdit(expense)}
                          onDelete={() => store.deleteExpense(expense.id)}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <EmptyState title="No expenses found" description="Adjust filters or add a new expense." />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}

function IncomeSection({
  onAdd,
  onEdit,
}: {
  onAdd: () => void;
  onEdit: (income: Income) => void;
}) {
  const store = useFinanceStore();
  const [filters, setFilters] = useState({ start: "", end: "", source: "all" });
  const profile = store.settings.profile;
  const incomeSources = store.categories.filter((category) => category.type === "income");
  const filtered = useMemo(() => {
    return store.incomes
      .filter((income) => withinDateRange(income.date, filters.start, filters.end))
      .filter((income) => filters.source === "all" || income.source === filters.source)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [filters, store.incomes]);
  const monthlyIncome = sumAmounts(incomesThisMonth(store.incomes));

  const exportRowsForDownload = filtered.map((income) => ({
    Date: formatDate(income.date, profile.dateFormat),
    Amount: income.amount,
    Source: income.source,
    Description: income.description,
    "Payment Method": income.paymentMethod,
    Tags: income.tags.join(", "),
  }));

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Income tracker"
        description="Record every source of money coming in and monitor monthly totals."
        action={
          <Button onClick={onAdd} className="gap-2 bg-teal-700 hover:bg-teal-800">
            <Plus className="h-4 w-4" />
            Add income
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="This month's income"
          value={formatCurrency(monthlyIncome)}
          detail={`${incomesThisMonth(store.incomes).length} records this month`}
          icon={TrendingUp}
          tone="green"
        />
        <MetricCard
          title="Average income record"
          value={formatCurrency(filtered.length ? sumAmounts(filtered) / filtered.length : 0)}
          detail="Based on visible records"
          icon={WalletCards}
          tone="teal"
        />
        <MetricCard
          title="Income sources"
          value={String(new Set(store.incomes.map((income) => income.source)).size)}
          detail="Active tracked sources"
          icon={CreditCard}
          tone="blue"
        />
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Input
            type="date"
            value={filters.start}
            onChange={(event) => setFilters((current) => ({ ...current, start: event.target.value }))}
          />
          <Input
            type="date"
            value={filters.end}
            onChange={(event) => setFilters((current) => ({ ...current, end: event.target.value }))}
          />
          <Select
            value={filters.source}
            onValueChange={(value) => setFilters((current) => ({ ...current, source: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {incomeSources.map((source) => (
                <SelectItem key={source.id} value={source.name}>
                  {source.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            disabled={exportRowsForDownload.length === 0}
            onClick={() => exportRows("vaultx-income", exportRowsForDownload, profile.exportFormat)}
            className="gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="text-base">Income records</CardTitle>
          <CardDescription>{filtered.length} records found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length > 0 ? (
                  filtered.map((income) => (
                    <TableRow key={income.id}>
                      <TableCell>{formatDate(income.date, profile.dateFormat)}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-950 dark:text-green-200">
                          {income.source}
                        </Badge>
                      </TableCell>
                      <TableCell className="min-w-52">
                        <p className="font-medium">{income.description || "No description"}</p>
                        {income.tags.length > 0 ? (
                          <p className="text-xs text-muted-foreground">{income.tags.join(", ")}</p>
                        ) : null}
                      </TableCell>
                      <TableCell>{income.paymentMethod}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(income.amount)}
                      </TableCell>
                      <TableCell>
                        <RowActions
                          onEdit={() => onEdit(income)}
                          onDelete={() => store.deleteIncome(income.id)}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <EmptyState title="No income found" description="Add an income record to begin." />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AssetsSection({
  onAdd,
  onEdit,
}: {
  onAdd: () => void;
  onEdit: (asset: Asset) => void;
}) {
  const store = useFinanceStore();
  const [view, setView] = useState<"grid" | "table">("grid");
  const [filters, setFilters] = useState({ category: "all", condition: "all", location: "" });
  const assetCategories = store.categories.filter((category) => category.type === "asset");
  const filtered = useMemo(() => {
    return store.assets
      .filter((asset) => filters.category === "all" || asset.category === filters.category)
      .filter((asset) => filters.condition === "all" || asset.condition === filters.condition)
      .filter((asset) => asset.location.toLowerCase().includes(filters.location.toLowerCase()))
      .sort((a, b) => b.currentValue - a.currentValue);
  }, [filters, store.assets]);
  const exportRowsForDownload = filtered.map((asset) => {
    const depreciation = calculateDepreciation(asset);
    return {
      Name: asset.name,
      Category: asset.category,
      "Purchase Date": formatDate(asset.purchaseDate, store.settings.profile.dateFormat),
      "Purchase Price": asset.purchasePrice,
      "Current Value": asset.currentValue,
      "Estimated Value": Math.round(depreciation.estimatedValue),
      Location: asset.location,
      Condition: asset.condition,
      "Serial Number": asset.serialNumber,
      "Warranty Expiry": asset.warrantyExpiry ? formatDate(asset.warrantyExpiry) : "",
    };
  });

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Asset management"
        description="Inventory valuable items, documents, warranty dates, depreciation, and current values."
        action={
          <Button onClick={onAdd} className="gap-2 bg-teal-700 hover:bg-teal-800">
            <Plus className="h-4 w-4" />
            Add asset
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Total assets value"
          value={formatCurrency(sumAssetValues(store.assets))}
          detail={`${store.assets.length} asset${store.assets.length === 1 ? "" : "s"} tracked`}
          icon={Gem}
          tone="blue"
        />
        <MetricCard
          title="Original purchase cost"
          value={formatCurrency(store.assets.reduce((total, asset) => total + asset.purchasePrice, 0))}
          detail="Cost basis across inventory"
          icon={WalletCards}
          tone="slate"
        />
        <MetricCard
          title="Warranty reminders"
          value={String(store.assets.filter((asset) => warrantyStatus(asset).tone === "warning").length)}
          detail="Assets expiring in 30 days"
          icon={AlertTriangle}
          tone="amber"
        />
      </div>

      <Card className="rounded-lg">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Asset filters</CardTitle>
            <CardDescription>{filtered.length} assets visible</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={view === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setView("grid")}
            >
              <Grid2X2 className="h-4 w-4" />
              <span className="sr-only">Grid view</span>
            </Button>
            <Button
              variant={view === "table" ? "default" : "outline"}
              size="icon"
              onClick={() => setView("table")}
            >
              <Table2 className="h-4 w-4" />
              <span className="sr-only">Table view</span>
            </Button>
            <Button
              variant="outline"
              disabled={exportRowsForDownload.length === 0}
              onClick={() =>
                exportRows("vaultx-assets", exportRowsForDownload, store.settings.profile.exportFormat)
              }
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Select
            value={filters.category}
            onValueChange={(value) => setFilters((current) => ({ ...current, category: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {assetCategories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.condition}
            onValueChange={(value) => setFilters((current) => ({ ...current, condition: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All conditions</SelectItem>
              {assetConditions.map((condition) => (
                <SelectItem key={condition} value={condition}>
                  {condition}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Location"
            value={filters.location}
            onChange={(event) => setFilters((current) => ({ ...current, location: event.target.value }))}
          />
        </CardContent>
      </Card>

      {view === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((asset) => {
            const depreciation = calculateDepreciation(asset);
            const warranty = warrantyStatus(asset);
            return (
              <Card key={asset.id} className="rounded-lg">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">{asset.name}</CardTitle>
                      <CardDescription>{asset.category}</CardDescription>
                    </div>
                    <RowActions onEdit={() => onEdit(asset)} onDelete={() => store.deleteAsset(asset.id)} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
                    <span className="text-sm text-muted-foreground">Current value</span>
                    <span className="font-semibold">{formatCurrency(asset.currentValue)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Purchase</p>
                      <p className="font-medium">{formatCurrency(asset.purchasePrice)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Estimated</p>
                      <p className="font-medium">{formatCurrency(depreciation.estimatedValue)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Location</p>
                      <p className="font-medium">{asset.location}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Condition</p>
                      <p className="font-medium">{asset.condition}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={warranty.tone} label={warranty.label} />
                    <Badge variant="secondary">
                      {depreciation.depreciationPercent > 0 ? "Depreciated" : "Appreciated"}{" "}
                      {Math.abs(depreciation.depreciationPercent).toFixed(1)}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="rounded-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">{asset.name}</TableCell>
                      <TableCell>{asset.category}</TableCell>
                      <TableCell>{asset.location}</TableCell>
                      <TableCell>{asset.condition}</TableCell>
                      <TableCell className="text-right">{formatCurrency(asset.currentValue)}</TableCell>
                      <TableCell>
                        <RowActions
                          onEdit={() => onEdit(asset)}
                          onDelete={() => store.deleteAsset(asset.id)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 ? (
        <EmptyState title="No assets found" description="Add an asset or change the active filters." />
      ) : null}
    </div>
  );
}

function ReportsSection() {
  const { expenses, incomes, assets, settings } = useFinanceStore();
  const monthExpenses = expensesThisMonth(expenses);
  const categoryData = categoryTotals(monthExpenses);
  const sources = sourceTotals(incomes);
  const allocation = assetAllocation(assets);
  const averages = spendingAverages(expenses);
  const comparison = currentVsPreviousMonth(expenses);
  const spendingTrend = dailySpendingTrend(expenses, 21);
  const monthlyTrend = monthlyIncomeExpenseTrend(expenses, incomes);
  const netWorth = netWorthTrend(expenses, incomes, assets, settings.profile.liabilities);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Reports & analytics"
        description="Expense trends, income mix, asset allocation, and net-worth movement."
      />

      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[520px]">
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="net-worth">Net worth</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              title="Average daily spend"
              value={formatCurrency(averages.daily)}
              detail="Across all tracked expense history"
              icon={CalendarDays}
              tone="blue"
            />
            <MetricCard
              title="Average weekly spend"
              value={formatCurrency(averages.weekly)}
              detail="Normalized from first to latest entry"
              icon={BarChart3}
              tone="amber"
            />
            <MetricCard
              title="Month change"
              value={`${comparison.change >= 0 ? "+" : ""}${comparison.change.toFixed(1)}%`}
              detail={`${formatCurrency(comparison.currentTotal)} vs ${formatCurrency(comparison.previousTotal)}`}
              icon={comparison.change >= 0 ? TrendingUp : TrendingDown}
              tone={comparison.change >= 0 ? "red" : "green"}
            />
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard id="expense-category-pie" title="Expense by category" description="Current month">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={96}>
                    {categoryData.map((entry, index) => (
                      <Cell key={entry.name} fill={entry.fill ?? chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard id="expense-spending-trend" title="Spending trend" description="Last 21 days">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                <AreaChart data={spendingTrend}>
                  <defs>
                    <linearGradient id="expenseTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f766e" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#0f766e" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(value) => `₱${Number(value) / 1000}k`} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Area type="monotone" dataKey="expenses" stroke="#0f766e" fill="url(#expenseTrend)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="text-base">Top spending days</CardTitle>
              <CardDescription>Largest daily totals in your expense history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {topSpendingDays(expenses).map((day) => (
                <div key={day.date} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="font-medium">{formatDate(fromDateInput(day.date), settings.profile.dateFormat)}</span>
                  <span>{formatCurrency(day.amount)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard id="income-sources" title="Income sources" description="All-time source breakdown">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                <PieChart>
                  <Pie data={sources} dataKey="value" nameKey="name" innerRadius={58} outerRadius={96}>
                    {sources.map((entry, index) => (
                      <Cell key={entry.name} fill={entry.fill ?? chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard id="monthly-income-trends" title="Monthly income trends" description="Income vs expenses">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(value) => `₱${Number(value) / 1000}k`} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Line type="monotone" dataKey="income" stroke="#16a34a" strokeWidth={2} />
                  <Line type="monotone" dataKey="expenses" stroke="#dc2626" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </TabsContent>

        <TabsContent value="net-worth" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              title="Assets"
              value={formatCurrency(sumAssetValues(assets))}
              detail="Total current value"
              icon={Gem}
              tone="blue"
            />
            <MetricCard
              title="Liabilities"
              value={formatCurrency(settings.profile.liabilities)}
              detail="Configured in settings"
              icon={CreditCard}
              tone="red"
            />
            <MetricCard
              title="Net worth"
              value={formatCurrency(sumAssetValues(assets) - settings.profile.liabilities)}
              detail="Assets less liabilities"
              icon={WalletCards}
              tone="teal"
            />
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard id="net-worth-line" title="Net worth trend" description="Estimated six-month movement">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                <LineChart data={netWorth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(value) => `₱${Number(value) / 1000}k`} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Line type="monotone" dataKey="netWorth" stroke="#0f766e" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard id="asset-allocation" title="Asset allocation" description="By category">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                <PieChart>
                  <Pie data={allocation} dataKey="value" nameKey="name" innerRadius={58} outerRadius={96}>
                    {allocation.map((entry, index) => (
                      <Cell key={entry.name} fill={entry.fill ?? chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BudgetsSection() {
  const store = useFinanceStore();
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const budgetUsage = currentMonthBudgetUsage(store.expenses, store.budgets);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Budget & goals"
        description="Set monthly category budgets and track savings goals with progress alerts."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditingGoal(null);
                setGoalDialogOpen(true);
              }}
              className="gap-2"
            >
              <Target className="h-4 w-4" />
              Goal
            </Button>
            <Button
              onClick={() => {
                setEditingBudget(null);
                setBudgetDialogOpen(true);
              }}
              className="gap-2 bg-teal-700 hover:bg-teal-800"
            >
              <Plus className="h-4 w-4" />
              Budget
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="text-base">Budget vs actual</CardTitle>
            <CardDescription>Current month, grouped by expense category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {budgetUsage.length > 0 ? (
              budgetUsage.map((budget) => (
                <div key={budget.id} className="space-y-2 rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{budget.category}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(budget.actual)} of {formatCurrency(budget.monthlyLimit)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge
                        status={budget.percent >= 100 ? "danger" : budget.percent >= 80 ? "warning" : "success"}
                        label={`${Math.round(budget.percent)}%`}
                      />
                      <RowActions
                        onEdit={() => {
                          setEditingBudget(budget);
                          setBudgetDialogOpen(true);
                        }}
                        onDelete={() => store.deleteBudget(budget.id)}
                      />
                    </div>
                  </div>
                  <Progress value={Math.min(100, budget.percent)} />
                </div>
              ))
            ) : (
              <EmptyState title="No budgets yet" description="Add category limits to compare spending." />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="text-base">Savings goals</CardTitle>
            <CardDescription>Progress against target amounts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {store.goals.length > 0 ? (
              store.goals.map((goal) => {
                const percent = goal.targetAmount === 0 ? 0 : (goal.currentAmount / goal.targetAmount) * 100;
                return (
                  <div key={goal.id} className="space-y-2 rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{goal.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
                        </p>
                      </div>
                      <RowActions
                        onEdit={() => {
                          setEditingGoal(goal);
                          setGoalDialogOpen(true);
                        }}
                        onDelete={() => store.deleteGoal(goal.id)}
                      />
                    </div>
                    <Progress value={Math.min(100, percent)} />
                    {goal.dueDate ? (
                      <p className="text-xs text-muted-foreground">
                        Target date: {formatDate(goal.dueDate, store.settings.profile.dateFormat)}
                      </p>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <EmptyState title="No goals yet" description="Create savings goals to track progress." />
            )}
          </CardContent>
        </Card>
      </div>

      <BudgetDialog
        open={budgetDialogOpen}
        budget={editingBudget}
        onOpenChange={setBudgetDialogOpen}
      />
      <GoalDialog open={goalDialogOpen} goal={editingGoal} onOpenChange={setGoalDialogOpen} />
    </div>
  );
}

function CategoriesSection() {
  const store = useFinanceStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Categories management"
        description="Create custom expense categories, income sources, and asset groups."
        action={
          <Button
            onClick={() => {
              setEditingCategory(null);
              setDialogOpen(true);
            }}
            className="gap-2 bg-teal-700 hover:bg-teal-800"
          >
            <Plus className="h-4 w-4" />
            Add category
          </Button>
        }
      />

      <Tabs defaultValue="expense" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[460px]">
          <TabsTrigger value="expense">Expenses</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="asset">Assets</TabsTrigger>
        </TabsList>
        {(["expense", "income", "asset"] as CategoryType[]).map((type) => (
          <TabsContent key={type} value={type}>
            <Card className="rounded-lg">
              <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                {store.categories
                  .filter((category) => category.type === type)
                  .map((category) => (
                    <div key={category.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {category.isDefault ? "Default" : "Custom"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={category.isDefault}
                          onClick={() => {
                            setEditingCategory(category);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit category</span>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={category.isDefault}
                          onClick={() => store.deleteCategory(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete category</span>
                        </Button>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <CategoryDialog
        open={dialogOpen}
        category={editingCategory}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}

function SettingsSection() {
  const store = useFinanceStore();
  const [restoreError, setRestoreError] = useState("");

  const backup = () =>
    createBackup({
      expenses: store.expenses,
      incomes: store.incomes,
      assets: store.assets,
      budgets: store.budgets,
      goals: store.goals,
      categories: store.categories,
      settings: store.settings,
    });

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Settings"
        description="Manage profile preferences, exports, dark mode, and local backups."
      />

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="text-base">User profile</CardTitle>
            <CardDescription>Used for local personalization and overview defaults</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input
                value={store.settings.profile.fullName}
                onChange={(event) => store.updateProfile({ fullName: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={store.settings.profile.email}
                onChange={(event) => store.updateProfile({ email: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Default currency</Label>
              <Input value="PHP" disabled />
            </div>
            <div className="space-y-2">
              <Label>Date format</Label>
              <Select
                value={store.settings.profile.dateFormat}
                onValueChange={(value) =>
                  store.updateProfile({ dateFormat: value as typeof store.settings.profile.dateFormat })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MMM d, yyyy">May 4, 2026</SelectItem>
                  <SelectItem value="yyyy-MM-dd">2026-05-04</SelectItem>
                  <SelectItem value="dd/MM/yyyy">04/05/2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Export preference</Label>
              <Select
                value={store.settings.profile.exportFormat}
                onValueChange={(value) => store.updateProfile({ exportFormat: value as "csv" | "excel" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel-compatible XLS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Liabilities</Label>
              <Input
                type="number"
                min="0"
                value={store.settings.profile.liabilities}
                onChange={(event) => store.updateProfile({ liabilities: Number(event.target.value) })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="text-base">Preferences</CardTitle>
            <CardDescription>Local display and data controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <div className="flex items-center gap-3">
                {store.settings.darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <div>
                  <p className="font-medium">Dark mode</p>
                  <p className="text-xs text-muted-foreground">Toggle the application theme</p>
                </div>
              </div>
              <Switch checked={store.settings.darkMode} onCheckedChange={store.setDarkMode} />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="outline" onClick={() => downloadBackup(backup())} className="gap-2">
                <Download className="h-4 w-4" />
                Backup
              </Button>
              <Label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-accent">
                <Upload className="h-4 w-4" />
                Restore
                <input
                  type="file"
                  accept="application/json"
                  className="sr-only"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    try {
                      const text = await file.text();
                      const parsed = normalizeBackup(JSON.parse(text)) as FinanceBackup;
                      store.importBackup(parsed);
                      setRestoreError("");
                    } catch (error) {
                      setRestoreError(error instanceof Error ? error.message : "Could not restore backup.");
                    } finally {
                      event.target.value = "";
                    }
                  }}
                />
              </Label>
              <Button variant="outline" onClick={store.resetDemoData} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Demo data
              </Button>
              <Button variant="destructive" onClick={store.clearTransactions} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Clear data
              </Button>
            </div>
            {restoreError ? <p className="text-sm text-red-600">{restoreError}</p> : null}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="text-base">Data and security notes</CardTitle>
          <CardDescription>Production backend guidance included in this repository</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <InfoTile
            icon={CheckCircle2}
            title="Validation"
            description="Forms use React Hook Form and Zod schemas before data is saved."
          />
          <InfoTile
            icon={Download}
            title="Exportable"
            description="Expenses, income, assets, reports, and backups can be exported."
          />
          <InfoTile
            icon={Upload}
            title="Storage ready"
            description="The SQL schema includes file URL fields for cloud storage integrations."
          />
        </CardContent>
      </Card>
    </div>
  );
}

function ExpenseDialog({
  open,
  expense,
  onOpenChange,
}: {
  open: boolean;
  expense: Expense | null;
  onOpenChange: (open: boolean) => void;
}) {
  const store = useFinanceStore();
  const [receipt, setReceipt] = useState<StoredFile[]>(() =>
    expense?.receipt ? [expense.receipt] : [],
  );
  const categories = store.categories.filter((category) => category.type === "expense");
  const defaultCategory = categories[0]?.name ?? "Food";
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: toDateTimeInput(),
      amount: 0,
      category: defaultCategory,
      description: "",
      paymentMethod: "Cash",
      tags: "",
    },
  });
  const categoryValue = useWatch({ control: form.control, name: "category" });
  const paymentMethodValue = useWatch({ control: form.control, name: "paymentMethod" });

  useEffect(() => {
    if (open) {
      form.reset({
        date: toDateTimeInput(expense?.date),
        amount: expense?.amount ?? 0,
        category: expense?.category ?? defaultCategory,
        description: expense?.description ?? "",
        paymentMethod: expense?.paymentMethod ?? "Cash",
        tags: tagsToString(expense?.tags),
      });
    }
  }, [defaultCategory, expense, form, open]);

  const onSubmit = form.handleSubmit((values) => {
    const payload = {
      date: fromDateTimeInput(values.date),
      amount: values.amount,
      category: values.category,
      description: values.description,
      paymentMethod: values.paymentMethod as PaymentMethod,
      receipt: receipt[0] ?? null,
      tags: parseTags(values.tags),
    };

    if (expense) {
      store.updateExpense(expense.id, payload);
    } else {
      store.addExpense(payload);
    }
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{expense ? "Edit expense" : "Add expense"}</DialogTitle>
          <DialogDescription>Record spending in PHP with category, method, notes, and receipt.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <FormField label="Date & time" error={form.formState.errors.date?.message}>
            <Input type="datetime-local" {...form.register("date")} />
          </FormField>
          <FormField label="Amount" error={form.formState.errors.amount?.message}>
            <Input type="number" min="0" step="0.01" {...form.register("amount", { valueAsNumber: true })} />
          </FormField>
          <FormField label="Category" error={form.formState.errors.category?.message}>
            <Select
              value={categoryValue}
              onValueChange={(value) => form.setValue("category", value, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Payment method" error={form.formState.errors.paymentMethod?.message}>
            <Select
              value={paymentMethodValue}
              onValueChange={(value) =>
                form.setValue("paymentMethod", value as PaymentMethod, { shouldValidate: true })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <div className="space-y-2 md:col-span-2">
            <Label>Description or notes</Label>
            <Textarea rows={3} {...form.register("description")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Tags</Label>
            <Input placeholder="groceries, family, recurring" {...form.register("tags")} />
          </div>
          <div className="md:col-span-2">
            <FileDropzone
              label="Drop receipt image or click to upload"
              accept={{ "image/*": [".jpg", ".jpeg", ".png", ".webp"] }}
              maxFiles={1}
              value={receipt}
              onChange={setReceipt}
            />
          </div>
          <DialogFooter className="md:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-teal-700 hover:bg-teal-800">
              Save expense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function IncomeDialog({
  open,
  income,
  onOpenChange,
}: {
  open: boolean;
  income: Income | null;
  onOpenChange: (open: boolean) => void;
}) {
  const store = useFinanceStore();
  const sources = store.categories.filter((category) => category.type === "income");
  const defaultSource = sources[0]?.name ?? "Salary";
  const form = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      date: toDateInput(),
      amount: 0,
      source: defaultSource,
      description: "",
      paymentMethod: "Debit Card",
      tags: "",
    },
  });
  const sourceValue = useWatch({ control: form.control, name: "source" });
  const paymentMethodValue = useWatch({ control: form.control, name: "paymentMethod" });

  useEffect(() => {
    if (open) {
      form.reset({
        date: toDateInput(income?.date),
        amount: income?.amount ?? 0,
        source: income?.source ?? defaultSource,
        description: income?.description ?? "",
        paymentMethod: income?.paymentMethod ?? "Debit Card",
        tags: tagsToString(income?.tags),
      });
    }
  }, [defaultSource, form, income, open]);

  const onSubmit = form.handleSubmit((values) => {
    const payload = {
      date: fromDateInput(values.date),
      amount: values.amount,
      source: values.source,
      description: values.description,
      paymentMethod: values.paymentMethod as PaymentMethod,
      tags: parseTags(values.tags),
    };
    if (income) {
      store.updateIncome(income.id, payload);
    } else {
      store.addIncome(payload);
    }
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{income ? "Edit income" : "Add income"}</DialogTitle>
          <DialogDescription>Track salary, freelance work, investments, gifts, and other sources.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <FormField label="Date" error={form.formState.errors.date?.message}>
            <Input type="date" {...form.register("date")} />
          </FormField>
          <FormField label="Amount" error={form.formState.errors.amount?.message}>
            <Input type="number" min="0" step="0.01" {...form.register("amount", { valueAsNumber: true })} />
          </FormField>
          <FormField label="Source" error={form.formState.errors.source?.message}>
            <Select
              value={sourceValue}
              onValueChange={(value) => form.setValue("source", value, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sources.map((source) => (
                  <SelectItem key={source.id} value={source.name}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Payment method" error={form.formState.errors.paymentMethod?.message}>
            <Select
              value={paymentMethodValue}
              onValueChange={(value) =>
                form.setValue("paymentMethod", value as PaymentMethod, { shouldValidate: true })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <Textarea rows={3} {...form.register("description")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Tags</Label>
            <Input placeholder="client, payroll, passive" {...form.register("tags")} />
          </div>
          <DialogFooter className="md:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-teal-700 hover:bg-teal-800">
              Save income
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AssetDialog({
  open,
  asset,
  onOpenChange,
}: {
  open: boolean;
  asset: Asset | null;
  onOpenChange: (open: boolean) => void;
}) {
  const store = useFinanceStore();
  const categories = store.categories.filter((category) => category.type === "asset");
  const defaultCategory = categories[0]?.name ?? "Tech & Gadgets";
  const [photos, setPhotos] = useState<StoredFile[]>(() => asset?.photos ?? []);
  const [documents, setDocuments] = useState<StoredFile[]>(() => asset?.documents ?? []);
  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name: "",
      category: defaultCategory,
      purchaseDate: toDateInput(),
      purchasePrice: 0,
      currentValue: 0,
      location: "",
      serialNumber: "",
      warrantyExpiry: "",
      insuranceDetails: "",
      condition: "Excellent",
      notes: "",
    },
  });
  const categoryValue = useWatch({ control: form.control, name: "category" });
  const conditionValue = useWatch({ control: form.control, name: "condition" });

  useEffect(() => {
    if (open) {
      form.reset({
        name: asset?.name ?? "",
        category: asset?.category ?? defaultCategory,
        purchaseDate: toDateInput(asset?.purchaseDate),
        purchasePrice: asset?.purchasePrice ?? 0,
        currentValue: asset?.currentValue ?? 0,
        location: asset?.location ?? "",
        serialNumber: asset?.serialNumber ?? "",
        warrantyExpiry: asset?.warrantyExpiry ? toDateInput(asset.warrantyExpiry) : "",
        insuranceDetails: asset?.insuranceDetails ?? "",
        condition: asset?.condition ?? "Excellent",
        notes: asset?.notes ?? "",
      });
    }
  }, [asset, defaultCategory, form, open]);

  const onSubmit = form.handleSubmit((values) => {
    const payload = {
      name: values.name,
      category: values.category,
      purchaseDate: fromDateInput(values.purchaseDate),
      purchasePrice: values.purchasePrice,
      currentValue: values.currentValue,
      location: values.location,
      serialNumber: values.serialNumber,
      warrantyExpiry: values.warrantyExpiry ? fromDateInput(values.warrantyExpiry) : "",
      insuranceDetails: values.insuranceDetails,
      condition: values.condition as AssetCondition,
      photos,
      documents,
      notes: values.notes,
    };
    if (asset) {
      store.updateAsset(asset.id, payload);
    } else {
      store.addAsset(payload);
    }
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{asset ? "Edit asset" : "Add asset"}</DialogTitle>
          <DialogDescription>Track current value, depreciation, warranty, photos, and documents.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <FormField label="Asset name" error={form.formState.errors.name?.message}>
            <Input {...form.register("name")} />
          </FormField>
          <FormField label="Category" error={form.formState.errors.category?.message}>
            <Select
              value={categoryValue}
              onValueChange={(value) => form.setValue("category", value, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Purchase date" error={form.formState.errors.purchaseDate?.message}>
            <Input type="date" {...form.register("purchaseDate")} />
          </FormField>
          <FormField label="Purchase price" error={form.formState.errors.purchasePrice?.message}>
            <Input type="number" min="0" step="0.01" {...form.register("purchasePrice", { valueAsNumber: true })} />
          </FormField>
          <FormField label="Current value" error={form.formState.errors.currentValue?.message}>
            <Input type="number" min="0" step="0.01" {...form.register("currentValue", { valueAsNumber: true })} />
          </FormField>
          <FormField label="Location" error={form.formState.errors.location?.message}>
            <Input {...form.register("location")} />
          </FormField>
          <FormField label="Serial number or model">
            <Input {...form.register("serialNumber")} />
          </FormField>
          <FormField label="Warranty expiry">
            <Input type="date" {...form.register("warrantyExpiry")} />
          </FormField>
          <FormField label="Condition" error={form.formState.errors.condition?.message}>
            <Select
              value={conditionValue}
              onValueChange={(value) =>
                form.setValue("condition", value as AssetCondition, { shouldValidate: true })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assetConditions.map((condition) => (
                  <SelectItem key={condition} value={condition}>
                    {condition}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Insurance details">
            <Input {...form.register("insuranceDetails")} />
          </FormField>
          <div className="space-y-2 md:col-span-2">
            <Label>Notes</Label>
            <Textarea rows={3} {...form.register("notes")} />
          </div>
          <div className="md:col-span-2">
            <FileDropzone
              label="Drop asset photos or click to upload"
              accept={{ "image/*": [".jpg", ".jpeg", ".png", ".webp"] }}
              maxFiles={6}
              value={photos}
              onChange={setPhotos}
            />
          </div>
          <div className="md:col-span-2">
            <FileDropzone
              label="Drop receipts, manuals, or PDFs"
              accept={{
                "application/pdf": [".pdf"],
                "image/*": [".jpg", ".jpeg", ".png", ".webp"],
              }}
              maxFiles={8}
              value={documents}
              onChange={setDocuments}
            />
          </div>
          <DialogFooter className="md:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-teal-700 hover:bg-teal-800">
              Save asset
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BudgetDialog({
  open,
  budget,
  onOpenChange,
}: {
  open: boolean;
  budget: Budget | null;
  onOpenChange: (open: boolean) => void;
}) {
  const store = useFinanceStore();
  const categories = store.categories.filter((category) => category.type === "expense");
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const defaultCategory = categories[0]?.name ?? "Food";
  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category: defaultCategory,
      monthlyLimit: 0,
      month: currentMonth,
      year: currentYear,
    },
  });
  const categoryValue = useWatch({ control: form.control, name: "category" });

  useEffect(() => {
    if (open) {
      form.reset({
        category: budget?.category ?? defaultCategory,
        monthlyLimit: budget?.monthlyLimit ?? 0,
        month: budget?.month ?? currentMonth,
        year: budget?.year ?? currentYear,
      });
    }
  }, [budget, currentMonth, currentYear, defaultCategory, form, open]);

  const onSubmit = form.handleSubmit((values) => {
    if (budget) {
      store.updateBudget(budget.id, values);
    } else {
      store.addBudget(values);
    }
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{budget ? "Edit budget" : "Add budget"}</DialogTitle>
          <DialogDescription>Set a monthly spending limit for a category.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <FormField label="Category" error={form.formState.errors.category?.message}>
            <Select
              value={categoryValue}
              onValueChange={(value) => form.setValue("category", value, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Monthly limit" error={form.formState.errors.monthlyLimit?.message}>
            <Input type="number" min="0" step="0.01" {...form.register("monthlyLimit", { valueAsNumber: true })} />
          </FormField>
          <FormField label="Month" error={form.formState.errors.month?.message}>
            <Input type="number" min="1" max="12" {...form.register("month", { valueAsNumber: true })} />
          </FormField>
          <FormField label="Year" error={form.formState.errors.year?.message}>
            <Input type="number" min="2020" max="2100" {...form.register("year", { valueAsNumber: true })} />
          </FormField>
          <DialogFooter className="md:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-teal-700 hover:bg-teal-800">
              Save budget
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GoalDialog({
  open,
  goal,
  onOpenChange,
}: {
  open: boolean;
  goal: SavingsGoal | null;
  onOpenChange: (open: boolean) => void;
}) {
  const store = useFinanceStore();
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: "",
      targetAmount: 0,
      currentAmount: 0,
      dueDate: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: goal?.name ?? "",
        targetAmount: goal?.targetAmount ?? 0,
        currentAmount: goal?.currentAmount ?? 0,
        dueDate: goal?.dueDate ? toDateInput(goal.dueDate) : "",
        notes: goal?.notes ?? "",
      });
    }
  }, [form, goal, open]);

  const onSubmit = form.handleSubmit((values) => {
    const payload = {
      ...values,
      dueDate: values.dueDate ? fromDateInput(values.dueDate) : "",
    };
    if (goal) {
      store.updateGoal(goal.id, payload);
    } else {
      store.addGoal(payload);
    }
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{goal ? "Edit savings goal" : "Add savings goal"}</DialogTitle>
          <DialogDescription>Track progress toward a specific savings target.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <FormField label="Goal name" error={form.formState.errors.name?.message}>
            <Input {...form.register("name")} />
          </FormField>
          <FormField label="Target amount" error={form.formState.errors.targetAmount?.message}>
            <Input type="number" min="0" step="0.01" {...form.register("targetAmount", { valueAsNumber: true })} />
          </FormField>
          <FormField label="Current amount" error={form.formState.errors.currentAmount?.message}>
            <Input type="number" min="0" step="0.01" {...form.register("currentAmount", { valueAsNumber: true })} />
          </FormField>
          <FormField label="Target date">
            <Input type="date" {...form.register("dueDate")} />
          </FormField>
          <div className="space-y-2 md:col-span-2">
            <Label>Notes</Label>
            <Textarea rows={3} {...form.register("notes")} />
          </div>
          <DialogFooter className="md:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-teal-700 hover:bg-teal-800">
              Save goal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CategoryDialog({
  open,
  category,
  onOpenChange,
}: {
  open: boolean;
  category: Category | null;
  onOpenChange: (open: boolean) => void;
}) {
  const store = useFinanceStore();
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      type: "expense",
      name: "",
      color: "#0f766e",
      icon: "",
    },
  });
  const typeValue = useWatch({ control: form.control, name: "type" });

  useEffect(() => {
    if (open) {
      form.reset({
        type: category?.type ?? "expense",
        name: category?.name ?? "",
        color: category?.color ?? "#0f766e",
        icon: category?.icon ?? "",
      });
    }
  }, [category, form, open]);

  const onSubmit = form.handleSubmit((values) => {
    if (category) {
      store.updateCategory(category.id, values);
    } else {
      store.addCategory(values);
    }
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{category ? "Edit category" : "Add category"}</DialogTitle>
          <DialogDescription>Custom labels appear immediately in forms and reports.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <FormField label="Type">
            <Select
              value={typeValue}
              onValueChange={(value) =>
                form.setValue("type", value as CategoryType, { shouldValidate: true })
              }
              disabled={Boolean(category)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="asset">Asset</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Name" error={form.formState.errors.name?.message}>
            <Input {...form.register("name")} />
          </FormField>
          <FormField label="Color" error={form.formState.errors.color?.message}>
            <Input type="color" {...form.register("color")} />
          </FormField>
          <FormField label="Icon label">
            <Input placeholder="Optional text label" {...form.register("icon")} />
          </FormField>
          <DialogFooter className="md:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-teal-700 hover:bg-teal-800">
              Save category
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-end gap-2">
      <Button
        variant="outline"
        size="icon"
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous page</span>
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="icon"
        disabled={page >= totalPages}
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next page</span>
      </Button>
    </div>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open row actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem className="text-red-600" onClick={onDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StatusBadge({
  status,
  label,
}: {
  status: "success" | "warning" | "danger" | "muted";
  label: string;
}) {
  const className = {
    success: "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-950 dark:text-green-200",
    warning: "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-200",
    danger: "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-950 dark:text-red-200",
    muted: "bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200",
  }[status];

  return <Badge className={className}>{label}</Badge>;
}

function InfoTile({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <Icon className="h-5 w-5 text-teal-700" />
      <p className="mt-3 font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
