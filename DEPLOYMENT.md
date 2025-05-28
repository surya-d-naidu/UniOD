# Netlify Deployment Checklist

## ✅ Pre-Deployment Setup

- [x] Created Netlify-compatible API structure (`/netlify/functions/api.ts`)
- [x] Updated build scripts for Netlify
- [x] Configured database for serverless environment
- [x] Set up CORS for production
- [x] Created deployment documentation
- [x] Added `.netlifyignore` for optimized builds

## 🚀 Deployment Steps

### 1. Environment Setup
- [ ] Create Neon database account
- [ ] Get database connection string (use **pooled connection**)
- [ ] Generate secure session secret

### 2. Netlify Setup
- [ ] Create Netlify account
- [ ] Connect GitHub repository (recommended)
- [ ] Set environment variables:
  ```
  DATABASE_URL=your_neon_pooled_connection_string
  SESSION_SECRET=your_secure_random_string
  NODE_ENV=production
  ```

### 3. Database Schema
- [ ] Run `npm run db:push` locally to push schema to Neon
- [ ] Verify tables are created in Neon dashboard

### 4. Deploy
- [ ] Push code to GitHub and auto-deploy, OR
- [ ] Use `./deploy-netlify.sh` script for CLI deployment

### 5. Post-Deployment
- [ ] Test admin login functionality
- [ ] Test student registration and approval
- [ ] Test OD request creation and export
- [ ] Change default admin password

## 🔧 Environment Variables Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `SESSION_SECRET` | Secure random string for sessions | `your-super-secret-key-here` |
| `NODE_ENV` | Environment mode | `production` |

## 🏗️ Architecture for Netlify

```
University OD Tracker (Netlify)
├── Frontend (Static Build)
│   └── /client/* → served as static files
├── API (Serverless Functions)
│   └── /netlify/functions/api.ts → handles all /api/* requests
└── Database (Neon PostgreSQL)
    └── Pooled connections for serverless
```

## 🆘 Troubleshooting

### Common Issues:

1. **Database Connection Failed**
   - Verify DATABASE_URL is the pooled connection string
   - Check Neon database is active and accessible

2. **Session/Authentication Issues**
   - Ensure SESSION_SECRET is set
   - Check cookie settings for cross-origin requests

3. **Build Failures**
   - Check Netlify function logs
   - Verify all dependencies are in package.json
   - Ensure `serverless-http` is installed

4. **CORS Errors**
   - Application is configured for Netlify domains
   - Check browser console for specific CORS errors

5. **Function Timeout**
   - Netlify functions have a 10-second timeout limit
   - Optimize database queries for faster response

### Getting Help:
- Netlify Logs: Check function logs in Netlify dashboard
- Database: Check Neon dashboard for connection issues
- Application: Enable debug logging in development

## 🎯 Success Criteria

Your deployment is successful when:
- [ ] Admin can login with default credentials
- [ ] Students can register and get approved
- [ ] OD requests can be created and viewed
- [ ] Excel export functionality works
- [ ] All pages load without errors
- [ ] No console errors in browser
