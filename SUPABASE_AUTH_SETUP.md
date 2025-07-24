# Supabase Auth Integration Setup

## ✅ Code Changes Completed

The following files have been updated to use Supabase Auth properly:

- ✅ `src/lib/auth.ts` - Refactored to use Supabase Auth methods
- ✅ `src/contexts/auth-context.tsx` - Updated for session management
- ✅ `src/app/login/page.tsx` - Supports both email and username login
- ✅ `src/app/users/page.tsx` - Updated for password reset via email
- ✅ `src/components/auth/ChangePasswordDialog.tsx` - Uses Supabase password update
- ✅ `src/types/database.ts` - Added auth_id field to user types

## 🔧 Database Setup Required

**IMPORTANT**: You must run the SQL migration in your Supabase dashboard:

1. Go to your Supabase project → SQL Editor
2. Execute the contents of `supabase-auth-sync.sql`:

```sql
-- This will:
-- 1. Add auth_id column to public.users table
-- 2. Create triggers to sync auth.users with public.users
-- 3. Set up Row Level Security policies
-- 4. Create functions for automatic user profile creation
```

## 🏗️ Migration Steps

### 1. Run Database Migration
```sql
-- Copy and paste the entire contents of supabase-auth-sync.sql
-- into your Supabase SQL Editor and execute
```

### 2. Environment Variables
Ensure these are set in your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Migrate Existing Users (Optional)
If you have existing users in `public.users` table, you'll need to:

1. Create auth users for existing users:
```sql
-- This is a manual process for each existing user
-- You'll need to use Supabase Auth Admin API or dashboard
```

2. Link existing profiles to auth users:
```sql
-- Uncomment and run the migration script at the bottom of supabase-auth-sync.sql
UPDATE public.users 
SET auth_id = auth.users.id
FROM auth.users 
WHERE public.users.email = auth.users.email 
AND public.users.auth_id IS NULL;
```

## 🧪 Testing the Integration

### Test User Creation
```javascript
// Create a new user (this will create both auth.users and public.users records)
await AuthService.createUser({
  username: 'testuser',
  email: 'test@example.com',
  fullName: 'Test User',
  phone: '+1234567890',
  password: 'securepassword123',
  isStoreEmployee: false,
  requirePasswordChange: false
});
```

### Test Login
```javascript
// Login with email
await authContext.login('test@example.com', 'securepassword123');

// Login with username (backward compatibility)
await authContext.loginWithUsername('testuser', 'securepassword123');
```

### Test Password Reset
```javascript
// Send password reset email
await AuthService.resetUserPassword('test@example.com');
```

## 🔒 Security Features Enabled

- ✅ **Automatic password hashing** by Supabase Auth
- ✅ **Row Level Security** policies on public.users table
- ✅ **Session management** with automatic token refresh
- ✅ **Password reset via email** with secure tokens
- ✅ **User profile sync** between auth.users and public.users

## 🎯 Key Benefits

1. **Secure**: Passwords are properly hashed by Supabase
2. **Automatic**: User profiles are synced via database triggers
3. **Compatible**: Existing username login still works
4. **Standard**: Uses Supabase Auth best practices
5. **Scalable**: Supports email verification, OAuth, etc. in the future

## 🚨 Important Notes

- **Password hashes** in `public.users.password_hash` are no longer used
- **Authentication** is now handled by `auth.users` table
- **User profiles** in `public.users` are automatically created via triggers
- **Email is required** for all new users (username is optional)
- **Password resets** now send secure email links instead of manual password changes

## Next Steps

1. Execute the SQL migration in Supabase
2. Test user creation and login flows
3. Migrate existing users if needed
4. Remove any references to the old password hashing system
5. Consider adding email verification for new signups