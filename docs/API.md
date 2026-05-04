# VaultX API Contract

The current MVP runs local-first in the browser with persisted Zustand state. This contract documents the production API shape for the next backend iteration using Next.js Route Handlers, JWT cookies, bcrypt password hashing, Supabase/PostgreSQL, and Supabase Storage or Cloudinary for files.

## Auth

All protected endpoints require an `HttpOnly`, `Secure`, `SameSite=Lax` session cookie containing a signed JWT.

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | `{ "email", "password", "fullName" }` | Safe user profile |
| `POST` | `/api/auth/login` | `{ "email", "password" }` | Safe user profile |
| `POST` | `/api/auth/logout` | none | `{ "ok": true }` |
| `GET` | `/api/auth/me` | none | Safe user profile |

Passwords should be hashed with bcrypt using `BCRYPT_SALT_ROUNDS`. The JWT secret comes from `JWT_SECRET`.

## Expenses

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/expenses?start=&end=&category=&paymentMethod=&min=&max=&page=` | Paginated expense list |
| `POST` | `/api/expenses` | Create expense |
| `PATCH` | `/api/expenses/:expenseId` | Update expense |
| `DELETE` | `/api/expenses/:expenseId` | Delete expense |
| `POST` | `/api/expenses/bulk-delete` | Delete multiple expenses by id |
| `GET` | `/api/expenses/export?format=csv` | Export visible expense data |

Create/update body:

```json
{
  "date": "2026-05-04T09:00:00.000Z",
  "amount": 250,
  "category": "Food",
  "description": "Lunch",
  "paymentMethod": "E-wallet",
  "receiptUrl": "https://storage.example/receipt.jpg",
  "tags": ["daily"]
}
```

## Income

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/income?start=&end=&source=&page=` | Paginated income list |
| `POST` | `/api/income` | Create income |
| `PATCH` | `/api/income/:incomeId` | Update income |
| `DELETE` | `/api/income/:incomeId` | Delete income |
| `GET` | `/api/income/summary?month=&year=` | Monthly income summary |

## Assets

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/assets?category=&condition=&location=&page=` | Paginated asset list |
| `POST` | `/api/assets` | Create asset |
| `PATCH` | `/api/assets/:assetId` | Update asset and current value |
| `DELETE` | `/api/assets/:assetId` | Delete asset |
| `GET` | `/api/assets/export?format=csv` | Export asset list |

Files should be uploaded first through `/api/uploads`, then referenced by URL in `photos` or `documents`.

## Budgets, Goals, Categories

| Method | Path | Purpose |
| --- | --- | --- |
| `GET/POST` | `/api/budgets` | List or create budgets |
| `PATCH/DELETE` | `/api/budgets/:budgetId` | Update or delete a budget |
| `GET/POST` | `/api/goals` | List or create savings goals |
| `PATCH/DELETE` | `/api/goals/:goalId` | Update or delete a goal |
| `GET/POST` | `/api/categories` | List or create custom categories |
| `PATCH/DELETE` | `/api/categories/:categoryId` | Update or delete a custom category |

## Reports

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/reports/dashboard` | Net worth, daily/weekly/monthly expenses, top categories |
| `GET` | `/api/reports/expenses?period=monthly` | Expense trends and category totals |
| `GET` | `/api/reports/income` | Income source breakdown and monthly trends |
| `GET` | `/api/reports/net-worth` | Asset allocation and net worth trend |

## Uploads

`POST /api/uploads` accepts multipart files. Validate:

- Images: JPEG, PNG, WebP, max 5 MB.
- Documents: PDF, max 10 MB.
- Reject executable and unknown MIME types.
- Store files outside the public app bundle in Supabase Storage, S3, or Cloudinary.

## Security Checklist

- Validate every request with Zod.
- Scope every query by `user_id` from the verified session.
- Use parameterized SQL or Supabase query builders.
- Set `HttpOnly`, `Secure`, and `SameSite=Lax` cookies.
- Add CSRF protection for cookie-authenticated mutations.
- Rate limit auth and write endpoints.
- Return DTOs that never include `password_hash`.
