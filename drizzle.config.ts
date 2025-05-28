import { defineConfig } from "drizzle-kit";
import { neonConfig } from '@neondatabase/serverless';
import ws from "ws";

// Configure Neon to use WebSockets in Node.js environment
if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

// Use connection string directly if DATABASE_URL is not set
const databaseUrl = process.env.DATABASE_URL || 
  "postgresql://neondb_owner:npg_hp1o6uNHCBiZ@ep-square-frost-a4mnwu6c-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
