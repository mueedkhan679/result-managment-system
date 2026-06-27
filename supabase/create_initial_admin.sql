-- Create an initial admin user. Run in Supabase SQL Editor or psql.
-- Replace the email, username, and password before running.

INSERT INTO admins(full_name, username, email, password_hash)
VALUES (
  'Administrator',
  'admin',
  'admin@example.com',
  crypt('ChangeMeStrongPassword!', gen_salt('bf'))
);

-- Optionally verify the admin exists:
-- select id, full_name, username, email from admins;
