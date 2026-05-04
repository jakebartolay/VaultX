# VaultX

VaultX is a personal finance and asset tracking web app for monitoring expenses, income, assets, budgets, savings goals, and net worth in PHP.

The MVP is local-first: it runs immediately without external services and persists data in the browser. A Supabase/PostgreSQL migration and production API contract are included for the backend iteration.

## Features

- Clickable routed pages: `/overview`, `/expenses`, `/income`, `/assets`, `/reports`, `/budgets`, `/categories`, and `/settings`.
- Overview page with net worth, today's expenses, weekly and monthly summaries, income vs expenses, budget alerts, quick-add expense, and top category charts.
- Expense tracker with add/edit/delete, receipt upload, filters, pagination, bulk delete, tags, CSV/XLS export.
- Income tracker with add/edit/delete, filters, monthly summary, source breakdown, export.
- Asset management with photos, documents, warranty tracking, insurance notes, condition, current value updates, depreciation estimate, grid/table views, export.
- Reports for expense analytics, income analytics, asset allocation, and net-worth trends.
- Monthly category budgets, budget-vs-actual progress, savings goals.
- Custom expense, income, and asset categories.
- Settings for profile, PHP currency, date format, export preference, liabilities, dark mode, backup, restore, demo reset.

## Tech Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS v4
- shadcn/ui
- Recharts
- Zustand
- React Hook Form + Zod
- Lucide React
- react-dropzone
- Supabase/PostgreSQL migration for production data

## Folder Structure

```text
src/
  app/
    globals.css
    layout.tsx
    page.tsx
  components/
    finance/
      file-dropzone.tsx
      finance-app.tsx
    ui/
      shadcn components
    providers.tsx
  lib/
    finance-types.ts
    finance-utils.ts
    utils.ts
  store/
    finance-store.ts
docs/
  API.md
supabase/
  migrations/
    001_initial_schema.sql
```

## Getting Started

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

Build for production:

```bash
npm run build
```

Run lint:

```bash
npm run lint
```

## Environment Variables

Copy `.env.example` to `.env.local` when wiring a real backend. The local-first MVP does not require environment variables.

## Database

The production-ready PostgreSQL schema is in `supabase/migrations/001_initial_schema.sql`.

It includes:

- users
- expenses
- income
- assets
- categories
- budgets
- savings goals
- recurring transactions
- notifications
- indexes, updated-at triggers, and Supabase RLS policies

## Backend Iteration

See `docs/API.md` for the planned Next.js Route Handler API contract covering authentication, protected CRUD endpoints, uploads, reports, exports, validation, and security requirements.

## Data Storage in the MVP

Local data is persisted in `localStorage` under `vaultx-finance-store`. Use Settings -> Backup to export a JSON backup, and Settings -> Restore to import it again.
