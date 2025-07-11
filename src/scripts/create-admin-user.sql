-- Create admin user after setting up authentication in Supabase
-- First, go to Supabase Dashboard > Authentication > Users
-- Create a new user with email: admin@cs.edu and a strong password
-- Then run this script with the user ID from the auth.users table

-- Replace 'your-admin-user-id-here' with the actual UUID from auth.users
INSERT INTO profiles (id, email, name, role) 
VALUES (
  'your-admin-user-id-here', 
  'admin@cs.edu', 
  'System Administrator', 
  'admin'
);

-- Create another admin user (previously lecturer)
INSERT INTO profiles (id, email, name, role) 
VALUES (
  'your-second-admin-user-id-here', 
  'admin2@cs.edu', 
  'Dr. John Smith', 
  'admin'
);
