# Result Management System

A React + Vite web app for managing student results with Supabase as the backend, jsPDF for report generation, and Tailwind CSS for styling.

## Project Overview

- Admin portal for managing students, subjects, pending results, published results, and profile settings.
- Student-facing result portal for searching by class and roll number.
- Supabase RPC functions handle authentication, publishing, deletion, and result import workflows.
- PDF reports can be generated from published results for individual students.

## Tech Stack

- React + Vite
- Tailwind CSS
- Supabase (Postgres + Auth/RPC + Storage)
- jsPDF + jsPDF AutoTable
- React Hot Toast

## Project Structure

- src/components: shared UI components and admin layout
- src/context: authentication context
- src/lib: Supabase client setup
- src/pages/admin: admin dashboard, student, subject, result, and settings pages
- src/pages/portal: public student result portal pages
- src/services: API wrappers for Supabase RPC calls
- src/utils: grading and PDF helpers
- supabase/schema.sql: database schema and RPC functions

## Setup

1. Create a Supabase project.
2. Run the SQL in supabase/schema.sql in the Supabase SQL editor.
3. Create a storage bucket named avatars for admin profile images.
4. Create a .env.local file with:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SCHOOL_NAME=Your School Name
```

5. Install dependencies:

```bash
npm install
```

6. Start the app:

```bash
npm run dev
```

## Notes

- The admin login uses Supabase RPC functions and should remain protected.
- Published results appear in the student portal only when the corresponding result rows are marked as published.
- For the first admin account, insert a row into the admins table with a hashed password using pgcrypto.
