# University OD Tracker - Netlify Deployment Guide

This application is now configured for deployment on Netlify. Follow these steps to deploy:

## Prerequisites

1. **Neon Database**: You'll need a Neon PostgreSQL database
2. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
3. **Environment Variables**: Prepare your environment variables

## Environment Variables

Set these environment variables in your Netlify project settings:

```
DATABASE_URL=your_neon_database_connection_string
SESSION_SECRET=your_secure_random_session_secret
NODE_ENV=production
```

### Getting your DATABASE_URL from Neon:

1. Go to [neon.tech](https://neon.tech) and create an account
2. Create a new project
3. Go to the Dashboard and copy the connection string
4. Make sure to use the **pooled connection** string for better performance with serverless

## Deployment Steps

### Method 1: Deploy from GitHub (Recommended)

1. Push your code to a GitHub repository
2. Go to [netlify.com](https://netlify.com) and sign in
3. Click "New site from Git"
4. Connect your GitHub repository
5. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `dist/public`
6. Add your environment variables in the site settings
7. Deploy!

### Method 2: Deploy using Netlify CLI

1. Install Netlify CLI:
   ```bash
   npm i -g netlify-cli
   ```

2. Login to Netlify:
   ```bash
   netlify login
   ```

3. Deploy from your project directory:
   ```bash
   netlify deploy --prod
   ```

4. Follow the prompts and add your environment variables when asked

## Database Setup

After deployment, you need to push your database schema to Neon:

1. Install dependencies locally:
   ```bash
   npm install
   ```

2. Set your DATABASE_URL in a local `.env` file:
   ```
   DATABASE_URL=your_neon_database_connection_string
   ```

3. Push the database schema:
   ```bash
   npm run db:push
   ```

## Project Structure for Netlify

The application has been restructured for Netlify deployment:

- `/netlify/functions/api.ts` - Main API handler for serverless functions
- `/client/` - Frontend React application
- `/server/` - Backend logic (imported by API handler)
- `/shared/` - Shared types and schemas
- `netlify.toml` - Netlify deployment configuration

## Features

- **Admin Dashboard**: Manage student approvals and view OD requests
- **Student Dashboard**: Submit and track OD requests
- **Excel Export**: Export OD data to Excel files
- **Real-time Updates**: Live updates using React Query
- **Responsive Design**: Works on desktop and mobile devices

## Default Admin Account

After database setup, you can create an admin account by running the seeder:

```bash
npm run dev
# Then visit the application and the admin seeder will run automatically
```

Default admin credentials:
- Registration Number: `ADMIN001`
- Password: `admin123`

**Important**: Change these credentials immediately after first login!

## Troubleshooting

### Common Issues:

1. **Database Connection Errors**: Make sure your DATABASE_URL is correct and points to the pooled connection
2. **Session Issues**: Ensure SESSION_SECRET is set and secure
3. **CORS Errors**: The application is configured for Netlify's domain structure
4. **Function Timeout**: Netlify functions have a 10-second timeout limit

### Logs:

Check Netlify function logs in your Netlify dashboard under "Functions"

## Local Development

To run locally:

1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env` file with your environment variables
4. Run database migrations: `npm run db:push`
5. Start development server: `npm run dev`

## Support

For issues related to:
- Netlify deployment: Check [Netlify documentation](https://docs.netlify.com)
- Neon database: Check [Neon documentation](https://neon.tech/docs)
- Application bugs: Check the application logs in Netlify dashboard
