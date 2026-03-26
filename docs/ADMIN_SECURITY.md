# Admin Security & Authentication Guide

This guide explains how to securely manage administrative privileges and describes the project's authentication architecture.

## 🛡️ Creating a Super Admin

Following the security hardening, administrative roles are no longer granted via metadata. They are strictly managed in the database via the `public.users` table.

### Method 1: Promote an Existing User (Recommended)

The most secure way is to have the user sign up normally via the frontend, then promote them via the Supabase SQL Editor.

1. Go to your **Supabase Dashboard** -> **SQL Editor**.
2. Run the following SQL (replace the email):

```sql
-- Promote user to Super Admin and Admin role
UPDATE public.users
SET
    role = 'admin',
    is_super_admin = true
WHERE email = 'user@example.com';
```

### Method 2: Manual Invitation

If you need to invite a new admin without them signing up first:

1. Go to **Supabase Dashboard** -> **Authentication** -> **Add User** -> **Send Invitation**.
2. Once they accept and create their account, follow **Method 1** to promote them in the database.

---

## 🏗️ Authentication Architecture

### 1. Data Flow

- **Auth Provider**: Supabase Auth (JWT-based).
- **Identity Storage**: `auth.users` (Internal Supabase table).
- **Profile & Permissions**: `public.users` (Our table, synced via triggers or manual creation).

### 2. Role Verification

We use a three-layer verification system to prevent role escalation:

1.  **Database Level (RLS)**:
    - The `users` table has Row Level Security enabled.
    - Even if a user has a JWT, they cannot modify the `role` or `is_super_admin` columns in the `public.users` table.
2.  **Edge Function Level**:
    - The `updateUser` Edge Function verifies the requester's `is_super_admin` status in the database before allowing any role changes.
3.  **Frontend Level**:
    - `AuthContext.jsx` fetches the profile from `public.users` upon login.
    - It sets `isAdmin` and `isSuperAdmin` based on database values, NOT JWT metadata.

### 3. Key Files

- `src/context/AuthContext.jsx`: Manages global auth state.
- `src/entities/User.js`: Contains helper logic for checking permissions.
- `src/components/AdminRoute.jsx`: Protects frontend routes.
- `supabase/migrations/20260111130000_harden_users_rls.sql`: The RLS logic enforcing these rules.

---

## 🚫 Insecure Practices to Avoid

- **Metadata Checks**: Never use `user.app_metadata.role` or `user.user_metadata.role` for security checks. These can be spoofed in local storage.
- **Hardcoded Scripts**: Avoid using scripts like `create-admin-user.js` that contain hardcoded passwords or emails. Use the SQL Editor or the Admin UI instead.
