/**
 * Notification Service - Main Entry Point
 * Week 4: Notification System
 */

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { NotificationService } from './notificationService';
import { createNotificationRoutes } from './routes/notifications';

dotenv.config();

async function main() {
  console.log('🚀 Notification Service - Week 4: Notifications\n');

  // Load configuration
  const dbUrl = process.env.DATABASE_URL;
  const port = parseInt(process.env.PORT || '3003');

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

    // Create Express app
    const app = express();

    // Middleware
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Request logging
    app.use((req, res, next) => {
      console.log(`[API] ${req.method} ${req.path}`);
      next();
    });

    // Initialize services
    console.log('📦 Initializing notification service...');
    const notificationService = new NotificationService(db);

    // Health check
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'notification-service',
        timestamp: new Date()
      });
    });

    // Routes
    app.use('/notifications', createNotificationRoutes(notificationService));

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
      console.log(`\n✅ Notification Service is running!`);
      console.log(`   API:     http://localhost:${port}`);
      console.log(`   Health:  http://localhost:${port}/health`);
      console.log(`   Get notifications: GET http://localhost:${port}/notifications`);
      console.log(`   Test signal: POST http://localhost:${port}/notifications/test/signal`);
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
