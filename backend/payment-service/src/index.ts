/**
 * Payment Service - Main Entry Point
 * Week 7: Privacy Payment with ERC-7962 One-Time Public Keys
 */

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { PaymentService } from './paymentService';
import { createPaymentRoutes } from './routes/payment';

dotenv.config();

async function main() {
  console.log('🚀 Payment Service - Week 7: Privacy Payment with ERC-7962\n');

  // Load configuration
  const dbUrl = process.env.DATABASE_URL;
  const port = parseInt(process.env.PORT || '3006');
  const dataDanceApiKey = process.env.DATADANCE_API_KEY || '';
  const dataDanceNetwork = process.env.DATADANCE_NETWORK || 'polygon-mainnet';
  const rpcUrl = process.env.ETH_RPC_URL || 'https://polygon-mainnet.infura.io/v3/';

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
    console.log('📦 Initializing payment service with DataDance SDK...');
    const paymentService = new PaymentService(db, dataDanceApiKey, dataDanceNetwork, rpcUrl);

    // Health check
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'payment-service',
        timestamp: new Date()
      });
    });

    // Routes
    app.use('/payment', createPaymentRoutes(paymentService));

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
      console.log(`\n✅ Payment Service is running!`);
      console.log(`   API:     http://localhost:${port}`);
      console.log(`   Health:  http://localhost:${port}/health`);
      console.log(`\n💳 Available endpoints:`);
      console.log(`   POST /payment/generate-address     - Generate one-time privacy address`);
      console.log(`   POST /payment/request              - Request payment`);
      console.log(`   POST /payment/subscribe            - Subscribe to plan`);
      console.log(`   GET  /payment/subscription         - Get subscription status`);
      console.log(`   GET  /payment/plans                - Get subscription plans`);
      console.log(`   GET  /payment/history              - Get payment history`);
      console.log(`   POST /payment/record-api-usage     - Record API usage`);
      console.log(`   GET  /payment/service-fees         - Get service fee config`);
      console.log(`   POST /payment/send-reward          - Send anonymous reward`);
      console.log(`   GET  /payment/audit-summary        - Get audit summary`);
      console.log(`   POST /payment/confirm-payment      - Confirm payment received`);
      console.log(`\n🔐 Privacy Features:`);
      console.log(`   • ERC-7962 one-time public keys for payment privacy`);
      console.log(`   • Anonymous reward distribution to traders`);
      console.log(`   • User identity not exposed on blockchain`);
      console.log(`   • Aggregated audit summaries (no personal data)`);
      console.log(`   • Service fee separation from identity`);
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
