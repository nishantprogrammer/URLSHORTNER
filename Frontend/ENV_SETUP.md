# Admin Password Setup

## Database-Based Admin System

The admin password is now stored in the database instead of environment variables. This is more reliable and secure.

## Default Password

When you first run the application, the default admin password is:
```
admin123
```

## How to Use

1. **First Time Setup**: 
   - The system will automatically create an admin account with the default password `admin123`
   - Use this password to login for the first time

2. **Change Default Password**:
   - After logging in, click the "Change Password" button in the analytics dashboard
   - Enter your current password (default: `admin123`)
   - Enter your new password (minimum 6 characters)
   - Confirm the new password

3. **Login Process**:
   - Click "Admin Login" button
   - Enter your admin password
   - If successful, you'll see the analytics dashboard

## Security Features

- ✅ Password stored securely in MongoDB database
- ✅ No environment variables needed
- ✅ Automatic admin account creation
- ✅ Password change functionality
- ✅ Session-based admin access
- ✅ Secure logout functionality

## API Endpoints

- `POST /admin/verify` - Verify admin password
- `PUT /admin/password` - Update admin password
- `GET /admin/stats` - Get analytics data

## No Configuration Required

Unlike the previous environment variable approach, this system works out of the box with no additional configuration needed!
