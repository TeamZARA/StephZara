# PropCon Canvassing App

A Vite + React + TypeScript app for PropCon-friendly WhatsApp canvassing.

## Included
- Production-style UI
- PropCon CSV import
- CSV export for batch sending
- Contact queue and workspace
- Manager dashboard
- Supabase-ready environment file
- Supabase migration SQL

## Local setup
1. Copy `.env.example` to `.env`
2. Install packages:
   `npm install`
3. Start the app:
   `npm run dev`

## Vercel deployment
1. Push this folder to GitHub
2. Import the repo into Vercel
3. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

## Supabase
Run the SQL file:
- `supabase/migrations/001_init.sql`
