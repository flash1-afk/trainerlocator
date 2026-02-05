-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS TABLE
create table users (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text not null unique,
  password text not null, -- Stores hashed password
  role text default 'user' check (role in ('user', 'trainer', 'admin')),
  bio text,
  phone text,
  "location" text,
  "profileImage" text,
  "isVerified" boolean default false,
  "isActive" boolean default true,
  "lastLogin" timestamp with time zone,
  "preferences" jsonb default '{"notifications": true, "emailUpdates": true}',
  "createdAt" timestamp with time zone default now(),
  "updatedAt" timestamp with time zone default now()
);

-- TRAINERS TABLE (One-to-One with Users)
create table trainers (
  id uuid default uuid_generate_v4() primary key,
  "userId" uuid not null unique references users(id) on delete cascade,
  "specialization" text not null,
  "experience" jsonb, -- { years: number, description: text }
  "certifications" jsonb default '[]', -- Array of { name, issuingOrganization, issueDate, expiryDate, certificateUrl }
  "services" jsonb default '[]', -- Array of { name, description, duration, price }
  "availability" jsonb, -- Complex schedule object
  "location" jsonb, -- { address, city, state, zipCode, country, coordinates: {latitude, longitude} }
  "rating" jsonb default '{"average": 0, "count": 0}',
  "clients" jsonb default '{"total": 0, "active": 0}',
  "achievements" jsonb default '[]',
  "socialMedia" jsonb,
  "isVerified" boolean default false,
  "isActive" boolean default true,
  "featured" boolean default false,
  "tags" text[], -- Array of strings
  "createdAt" timestamp with time zone default now(),
  "updatedAt" timestamp with time zone default now()
);

-- TRAINER REVIEWS (Separate table for scalability)
create table trainer_reviews (
  id uuid default uuid_generate_v4() primary key,
  "trainerId" uuid not null references trainers(id) on delete cascade,
  "userId" uuid not null references users(id) on delete set null,
  "rating" integer not null check (rating >= 1 and rating <= 5),
  "comment" text,
  "date" timestamp with time zone default now()
);

-- SESSIONS TABLE
create table sessions (
  id uuid default uuid_generate_v4() primary key,
  "userId" uuid not null references users(id) on delete cascade,
  "trainerId" uuid not null references users(id) on delete cascade,
  "type" text not null check (type in ('in-person', 'virtual')),
  "duration" integer not null, -- minutes
  "date" timestamp with time zone not null,
  "status" text default 'scheduled' check (status in ('scheduled', 'in-progress', 'completed', 'cancelled', 'no-show')),
  "location" jsonb,
  "notes" text,
  "price" jsonb, -- { amount, currency, isPaid }
  "rating" jsonb, -- { score, comment, date }
  "statusHistory" jsonb default '[]',
  "reminders" jsonb default '[]',
  "attachments" jsonb default '[]',
  "isRecurring" boolean default false,
  "recurringPattern" jsonb,
  "createdAt" timestamp with time zone default now(),
  "updatedAt" timestamp with time zone default now()
);

-- BOOKINGS TABLE
create table bookings (
  id uuid default uuid_generate_v4() primary key,
  "userId" uuid not null references users(id) on delete cascade,
  "trainerId" uuid not null references users(id) on delete cascade,
  "sessionType" text not null check ("sessionType" in ('single', 'package', 'subscription')),
  "sessions" jsonb not null, -- Array of session details
  "totalPrice" numeric not null,
  "paymentMethod" text not null,
  "paymentStatus" text default 'pending',
  "transactionId" text,
  "notes" text,
  "specialRequests" text,
  "status" text default 'pending',
  "statusHistory" jsonb default '[]',
  "paymentHistory" jsonb default '[]',
  "cancellationPolicy" jsonb default '{"hoursBeforeSession": 24, "refundPercentage": 100}',
  "isRecurring" boolean default false,
  "recurringPattern" jsonb,
  "createdAt" timestamp with time zone default now(),
  "updatedAt" timestamp with time zone default now()
);

-- NOTIFICATIONS TABLE
create table notifications (
  id uuid default uuid_generate_v4() primary key,
  "recipient" uuid not null references users(id) on delete cascade,
  "sender" uuid references users(id) on delete set null,
  "type" text not null,
  "title" text not null,
  "message" text not null,
  "relatedId" uuid, -- ID of booking or session
  "relatedModel" text,
  "isRead" boolean default false,
  "createdAt" timestamp with time zone default now()
);

-- SECURITY POLICIES (RLS) - Optional for initial setup but recommended
alter table users enable row level security;
alter table trainers enable row level security;
alter table trainer_reviews enable row level security;
alter table sessions enable row level security;
alter table bookings enable row level security;
alter table notifications enable row level security;

-- Basic policies (open for now for backend service role usage, but can be restricted)
-- Since we are connecting via Service Role (or backend client), RLS is often bypassed if we use the secret key, 
-- but if using Anon key, we need policies. Assuming the Node.js backend uses the Service Key or Anon Key with public access?
-- Wait, the prompt implies replacing Backend logic. The Backend usually has full access.
-- If we use the ANON KEY in the backend, we are subject to RLS.
-- If we use SERVICE ROLE KEY, we bypass RLS.
-- For this migration, I'll make policies permissive for now or assume the user uses the Service Key if strict security is needed,
-- but typically for a "API Backend", one might use Service Key.
-- However, I'll create "select" policies for public/authenticated access to be safe.

create policy "Users can view their own data" on users for select using (auth.uid() = id);
-- Actually, since we are managing Auth manually (bcrypt/jwt), we aren't using Supabase Auth, so `auth.uid()` might be null.
-- We are just using Supabase as a database.
-- So we need to enable access for the "anon" role for all operations if we want the backend to work with just the Anon Key.
-- OR the backend should use the SERVICE_ROLE_KEY.

-- ALLOW ALL for now to prevent "permission denied" errors during migration testing,
-- assuming the backend is the only one accessing this via the anon/service key.
create policy "Enable access to all users" on users for all using (true);
create policy "Enable access to all trainers" on trainers for all using (true);
create policy "Enable access to all reviews" on trainer_reviews for all using (true);
create policy "Enable access to all sessions" on sessions for all using (true);
create policy "Enable access to all bookings" on bookings for all using (true);
create policy "Enable access to all notifications" on notifications for all using (true);
