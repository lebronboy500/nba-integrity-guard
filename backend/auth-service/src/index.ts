/**
 * Authentication Service - Main Entry Point
 * Week 3: User Authentication System
 */

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Pool } from 'pg';
import { createAuthRoutes } from './routes/auth';
import { UserService } from './services/userService';
import { initializeUserTables } from './models/schema';

dotenv.config();

async function main() {
  console.log('🚀 Auth Service - Week 3: User Authentication\n');

  // Load configuration
  const dbUrl = process.env.DATABASE_URL;
  const jwtSecret = process.env.JWT_SECRET || 'nba-integrity-guard-secret-key-change-in-production';
  const port = parseInt(process.env.PORT || '3002');

  if (!dbUrl) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  try {
    // Initialize database
    console.log('📦 Initializing database...');
    const db = new Pool({
      connectionString: dbUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    const testClient = await db.connect();
    console.log('[Database] ✅ Connected to PostgreSQL');
    testClient.release();

    // Initialize user tables
    await initializeUserTables(db);

    // Create Express app
    const app = express();

    // Middleware
    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Request logging
    app.use((req, res, next) => {
      console.log(`[API] ${req.method} ${req.path}`);
      next();
    });

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // 100 requests per windowMs
    });
    app.use('/auth/', limiter);

    // Initialize services
    console.log('📦 Initializing services...');
    const userService = new UserService(db);

    // Health check
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'auth-service',
        timestamp: new Date()
      });
    });

    // Routes
    app.use('/auth', createAuthRoutes(userService));

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found'
      });
    });

    // Error handler
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('[API] Error:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Internal server error'
      });
    });

    // Start server
    app.listen(port, () => {
      console.log(`\n✅ Auth Service is running!`);
      console.log(`   API:     http://localhost:${port}`);
      console.log(`   Health:  http://localhost:${port}/health`);
      console.log(`   Register: POST http://localhost:${port}/auth/register/email`);
      console.log(`   Login:    POST http://localhost:${port}/auth/login/email`);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\n⏹️  Shutting down...');
      await db.end();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

// Export for testing
export { main };
