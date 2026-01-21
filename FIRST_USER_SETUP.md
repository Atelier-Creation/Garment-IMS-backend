# First User Setup Guide

This guide explains how to create and login with the first admin user in the Garment IMS system.

## 🚀 Quick Start

The system automatically creates an admin user during setup. Here are the login credentials:

### Admin Login Credentials
```
📧 Email:    admin@garmentims.com
🔑 Password: admin123
```

## 🌐 Access URLs

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## 📋 Step-by-Step Login Process

### 1. Start Both Servers

**Backend Server:**
```bash
# In the root directory
npm start
# or for development with auto-reload
npm run dev
```

**Frontend Server:**
```bash
# In the garment-ims-frontend directory
cd garment-ims-frontend
npm run dev
```

### 2. Access the Frontend

1. Open your browser and go to: http://localhost:3001
2. You'll see the login page with the professional design

### 3. Login with Admin Credentials

1. Enter the email: `admin@garmentims.com`
2. Enter the password: `admin123`
3. Click "Login Now"

### 4. First Login Success

After successful login, you'll be redirected to the dashboard where you can:
- View system statistics
- Manage products and categories
- Create additional users
- Access all system features

## 🔧 Troubleshooting

### If Admin User Doesn't Exist

Run this command to create the admin user:
```bash
npm run create-admin
```

### If You Forgot the Credentials

Run this command to display the credentials:
```bash
npm run show-credentials
```

### If Login Fails

1. **Check Backend Server**: Ensure it's running on port 3000
2. **Check Database**: Make sure MySQL is running and the database exists
3. **Check Environment**: Verify the `.env` file has correct database credentials
4. **Check Network**: Ensure no firewall is blocking the ports

### Database Setup Issues

If you need to reset the database:
```bash
# Reset and recreate everything
npm run reset-db

# Or manually run migrations
npm run migrate

# Create admin user if needed
npm run create-admin
```

## 🔐 Security Notes

### ⚠️ Important Security Steps

1. **Change Default Password**: After first login, immediately change the admin password
2. **Create Additional Users**: Don't use the admin account for daily operations
3. **Set Strong Passwords**: Use complex passwords for all accounts
4. **Regular Backups**: Backup your database regularly

### Changing Admin Password

1. Login to the system
2. Go to Settings or Profile page
3. Change the password from `admin123` to a strong password
4. Save the changes

## 👥 Creating Additional Users

After logging in as admin:

1. Navigate to **Users** page from the sidebar
2. Click **"Add User"** button
3. Fill in the user details:
   - Username
   - Email
   - Full Name
   - Phone (optional)
   - Password
4. Click **"Create"** to save

## 🎯 Next Steps

After successful login, you can:

1. **Explore the Dashboard** - View system overview and statistics
2. **Set Up Categories** - Create product categories for your garments
3. **Add Products** - Start adding your garment products
4. **Configure Suppliers** - Add your supplier information
5. **Set Up Branches** - Configure your business locations
6. **Create Users** - Add team members with appropriate roles

## 📞 Support

If you encounter any issues:

1. Check the browser console for error messages
2. Check the backend server logs
3. Verify database connectivity
4. Ensure all dependencies are installed
5. Check that both servers are running on correct ports

## 🔄 System Status Check

To verify everything is working:

1. **Backend Health**: Visit http://localhost:3000/health
2. **Frontend Access**: Visit http://localhost:3001
3. **Database Connection**: Check server logs for "Database connection established"
4. **Login Test**: Try logging in with the admin credentials

---

**Happy Managing! 🎉**

Your Garment IMS system is now ready for use with the professional interface and complete backend integration.