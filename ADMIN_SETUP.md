# Admin Setup Instructions

## Security Configuration

### Authentication Settings
✅ **Public signup is now DISABLED** - Only administrators can create new user accounts.

### Admin Account Setup

The account `itisitachi@gmail.com` has been configured as an administrator.

**To activate this admin account:**

1. **First-time login:**
   - If the account doesn't exist yet, an administrator with database access must create it:
   ```sql
   -- Create the user account (run in Supabase SQL editor or via admin panel)
   -- Note: This requires service role access
   ```

2. **Sign in:**
   - Go to the login page
   - Use email: `itisitachi@gmail.com`
   - Use your password

3. **Reset password if needed:**
   - Click "Forgot your password?" on the login page
   - Check your email for the reset link
   - Set a new secure password

### Creating Additional User Accounts

Since public signup is disabled, new users must be created by administrators:

**Method 1: Using Admin Dashboard**
1. Log in as admin
2. Navigate to Admin Dashboard
3. Click "User Provisioning"
4. Fill in user details and assign roles
5. System will send credentials to the new user's email

**Method 2: Using Database (Advanced)**
```sql
-- Insert into auth.users table (requires service role)
-- Then assign role in public.user_roles table
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'collector'::app_role  -- or 'admin', 'lab_tech', 'analyst'
FROM auth.users
WHERE email = 'newuser@email.com';
```

### Available Roles

- **admin** - Full system access, can manage users and all evidence
- **collector** - Can create and manage evidence bags
- **lab_tech** - Can update evidence status and analysis
- **analyst** - Can view and analyze evidence data

### Password Reset

Users can reset their passwords using the "Forgot your password?" link on the login page. They will receive an email with a reset link.

### Security Best Practices

1. **Strong Passwords**
   - Minimum 8 characters
   - Use combination of letters, numbers, and symbols

2. **Two-Factor Authentication**
   - Enable 2FA in Settings > Security
   - Highly recommended for admin accounts

3. **Session Management**
   - Sessions timeout after 30 minutes of inactivity
   - 2-minute warning before timeout

4. **Regular Audits**
   - Review audit logs regularly
   - Monitor failed login attempts
   - Check role assignments

### Troubleshooting

**Can't sign in:**
- Verify email address is correct
- Use password reset if forgotten
- Contact system administrator if account is locked

**Admin features not visible:**
- Verify role is set to 'admin' in user_roles table
- Clear browser cache and cookies
- Log out and log back in

**Password reset not working:**
- Check spam folder for email
- Verify email address is correct in system
- Contact system administrator

---

**Important Notes:**
- Keep admin credentials secure
- Never share admin passwords
- Enable 2FA for all admin accounts
- Review security logs regularly
