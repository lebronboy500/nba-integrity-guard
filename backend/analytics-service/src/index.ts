/**
 * Analytics Service - Main Entry Point
 * Week 5: Data Analysis & Visualization
 */

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { AnalyticsService } from './analyticsService';
import { createAnalyticsRoutes } from './routes/analytics';

dotenv.config();

async function main() {
  console.log('🚀 Analytics Service - Week 5: Data Analysis\n');

  // Load configuration
  const dbUrl = process.env.DATABASE_URL;
  const port = parseInt(process.env.PORT || '3004');

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
    console.log('📦 Initializing analytics service...');
    const analyticsService = new AnalyticsService(db);

    // Health check
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'analytics-service',
        timestamp: new Date()
      });
    });

    // Routes
    app.use('/analytics', createAnalyticsRoutes(analyticsService));

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
      console.log(`\n✅ Analytics Service is running!`);
      console.log(`   API:     http://localhost:${port}`);
      console.log(`   Health:  http://localhost:${port}/health`);
      console.log(`\n📊 Available endpoints:`);
      console.log(`   GET  /analytics/sentiment/:marketSlug`);
      console.log(`   GET  /analytics/trend/:marketSlug/:outcome`);
      console.log(`   GET  /analytics/large-trades`);
      console.log(`   GET  /analytics/stats`);
      console.log(`   GET  /analytics/top-traders`);
      console.log(`   POST /analytics/compare-markets`);
      console.log(`   GET  /analytics/dashboard/:marketSlug`);
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
