# Deployment Guide

## Vercel Frontend

1. Push the repository to GitHub.
2. Import the project in Vercel.
3. Use the default Next.js build settings:
   - Install command: `npm install`
   - Build command: `npm run build`
   - Output: `.next`
4. Add environment variables from `.env.example` only when connecting a backend.
5. Deploy.

## Supabase Database

1. Create a Supabase project.
2. Create a storage bucket named `finance-files`.
3. Run `supabase/migrations/001_initial_schema.sql` in the SQL editor or through the Supabase CLI.
4. Set these Vercel environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL`
   - `JWT_SECRET`

## File Storage

For production uploads, store receipts, asset photos, and PDFs in Supabase Storage, S3, or Cloudinary. The database stores URLs only.

Recommended upload rules:

- Images: JPEG, PNG, WebP, max 5 MB.
- Documents: PDF, max 10 MB.
- Never expose service-role keys to the browser.
- Generate signed URLs for private files.

## Security Hardening Before Public Launch

- Implement the `docs/API.md` route handlers.
- Add bcrypt password hashing and JWT `HttpOnly` cookies.
- Validate requests with Zod on the server.
- Enforce `user_id` ownership on every query.
- Add CSRF protection for cookie-authenticated mutations.
- Add rate limiting to auth and write endpoints.
- Configure strict upload MIME and size validation.
- Serve through HTTPS only.

## Performance Notes

- The UI paginates table records and lazy-renders uploaded file previews from local data.
- Production database queries should use the indexes from the migration.
- Large receipt/photo libraries should use cloud object storage with optimized thumbnails.
