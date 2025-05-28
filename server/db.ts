import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "@shared/schema";

// Configure Neon for Netlify serverless environment
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;
neonConfig.pipelineTLS = false;

// Configure WebSocket constructor for serverless environment
if (typeof WebSocket === 'undefined') {
  import("ws").then((ws) => {
    neonConfig.webSocketConstructor = ws.default;
  });
}

// Get database URL from environment
let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is missing from environment variables');
  throw new Error('DATABASE_URL environment variable is required for production deployment');
}

console.log('Connecting to database...');

// Configure the pool for Netlify serverless with minimal connections
const poolConfig = {
  connectionString,
  max: 1, // Single connection for serverless
  min: 0, // No idle connections
  idleTimeoutMillis: 10000, // 10 second idle timeout
  connectionTimeoutMillis: 10000, // 10 second connection timeout
  application_name: 'university-od-tracker-netlify'
};

// Create the pool
const pool = new Pool(poolConfig);

// Initialize Drizzle with pool
export const db = drizzle(pool, { schema });

// Helper function to execute database operations with retries
const MAX_RETRIES = 2; // Reduced from 3
const BASE_RETRY_MS = 2000; // Increased from 1000

export async function executeWithRetry(operation: () => Promise<any>, retries = MAX_RETRIES) {
  try {
    return await operation();
  } catch (error: any) {
    // Check for connection-related errors
    const isConnectionError = 
      error.code === 'ETIMEDOUT' || 
      error.code === 'ECONNREFUSED' || 
      error.code === 'ECONNRESET' ||
      error.code === 'ENOTFOUND' ||
      error.code === '08006' || // Connection failure
      error.code === '08001' || // Connection rejected
      error.name === 'NeonDbError' ||
      (error.message && (
        error.message.includes('connection') || 
        error.message.includes('timeout') ||
        error.message.includes('fetch failed') ||
        error.message.includes('ETIMEDOUT')
      ));
      
    if (retries > 0 && isConnectionError) {
      const delay = BASE_RETRY_MS;
      console.log(`Database operation failed (${error.name || error.code}). Retrying in ${delay}ms. Attempts left: ${retries}`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return executeWithRetry(operation, retries - 1);
    }
    
    // Log the full error details for debugging
    console.error('Database operation failed after all retries:', {
      name: error.name,
      code: error.code,
      message: error.message
    });
    
    throw error;
  }
}
