import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Use the provided connection string
const connectionString = "postgresql://neondb_owner:npg_hp1o6uNHCBiZ@ep-square-frost-a4mnwu6c-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require";
export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });
