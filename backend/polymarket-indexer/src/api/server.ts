/**
 * Query API Server
 * RESTful API for querying indexed Polymarket data
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Database } from '../db/database';
import { MarketDiscoveryService } from '../services/marketDiscoveryService';
import { TradesIndexer } from '../services/tradesIndexer';

export class QueryAPIServer {
  private app: express.Application;
  private db: Database;
  private marketDiscovery: MarketDiscoveryService;
  private tradesIndexer: TradesIndexer;

  constructor(
    db: Database,
    marketDiscovery: MarketDiscoveryService,
    tradesIndexer: TradesIndexer
  ) {
    this.app = express();
    this.db = db;
    this.marketDiscovery = marketDiscovery;
    this.tradesIndexer = tradesIndexer;

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`[API] ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'polymarket-indexer',
        database: this.db.isReady()
      });
    });

    // Events endpoints
    this.app.get('/events/:slug', this.getEvent.bind(this));
    this.app.get('/events/:slug/markets', this.getEventMarkets.bind(this));

    // Markets endpoints
    this.app.get('/markets/:slug', this.getMarket.bind(this));
    this.app.get('/markets/:slug/trades', this.getMarketTrades.bind(this));
    this.app.get('/markets', this.getMarkets.bind(this));

    // Trades endpoints
    this.app.get('/trades/:txHash', this.getTrade.bind(this));
    this.app.get('/tokens/:tokenId/trades', this.getTokenTrades.bind(this));

    // Discovery endpoints
    this.app.post('/discovery/events/:slug', this.discoverEvent.bind(this));
    this.app.post('/discovery/all', this.discoverAll.bind(this));

    // Indexer control endpoints
    this.app.post('/indexer/start', this.startIndexer.bind(this));
    this.app.post('/indexer/stop', this.stopIndexer.bind(this));
    this.app.get('/indexer/status', this.getIndexerStatus.bind(this));
    this.app.get('/indexer/stats', this.getIndexerStats.bind(this));
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found'
      });
    });

    // Error handler
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('[API] Error:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Internal server error'
      });
    });
  }

  // Route handlers

  private async getEvent(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      const event = await this.marketDiscovery.getEvent(slug);

      if (!event) {
        res.status(404).json({ success: false, error: 'Event not found' });
        return;
      }

      res.json({ success: true, data: event });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  private async getEventMarkets(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;

      const query = `
        SELECT m.* FROM markets m
        JOIN events e ON m.event_id = e.id
        WHERE e.slug = $1
        ORDER BY m.created_at DESC
      `;

      const result = await this.db.query(query, [slug]);

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  private async getMarket(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      const market = await this.marketDiscovery.getMarket(slug);

      if (!market) {
        res.status(404).json({ success: false, error: 'Market not found' });
        return;
      }

      res.json({ success: true, data: market });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  private async getMarkets(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const status = req.query.status as string;

      let query = `SELECT * FROM markets`;
      const params: any[] = [];

      if (status) {
        query += ` WHERE status = $1`;
        params.push(status);
      }

      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await this.db.query(query, params);

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  private async getMarketTrades(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;

      const query = `
        SELECT t.* FROM trades t
        JOIN markets m ON t.market_id = m.id
        WHERE m.slug = $1
        ORDER BY t.block_timestamp DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await this.db.query(query, [slug, limit, offset]);

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  private async getTrade(req: Request, res: Response): Promise<void> {
    try {
      const { txHash } = req.params;

      const query = `
        SELECT t.*, m.slug as market_slug FROM trades t
        JOIN markets m ON t.market_id = m.id
        WHERE t.tx_hash = $1
        ORDER BY t.log_index
      `;

      const result = await this.db.query(query, [txHash]);

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  private async getTokenTrades(req: Request, res: Response): Promise<void> {
    try {
      const { tokenId } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;

      const query = `
        SELECT * FROM trades
        WHERE token_id = $1
        ORDER BY block_timestamp DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await this.db.query(query, [tokenId, limit, offset]);

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  private async discoverEvent(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      const count = await this.marketDiscovery.discoverEventMarkets(slug);

      res.json({
        success: true,
        message: `Discovered ${count} markets for event ${slug}`
      });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  private async discoverAll(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const result = await this.marketDiscovery.discoverAllMarkets(limit);

      res.json({
        success: true,
        message: `Discovered ${result.events} events with ${result.markets} markets`,
        data: result
      });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  private startIndexer(req: Request, res: Response): void {
    try {
      this.tradesIndexer.startContinuousIndexing();
      res.json({ success: true, message: 'Indexer started' });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  private stopIndexer(req: Request, res: Response): void {
    try {
      this.tradesIndexer.stopIndexing();
      res.json({ success: true, message: 'Indexer stopped' });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  private async getIndexerStatus(req: Request, res: Response): Promise<void> {
    try {
      const syncState = await this.tradesIndexer.getSyncState('trade_sync');

      res.json({
        success: true,
        data: syncState
      });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  private async getIndexerStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.tradesIndexer.getStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  start(port: number = 3001): void {
    this.app.listen(port, () => {
      console.log(`[API] 🚀 Query API running on port ${port}`);
    });
  }

  getExpressApp(): express.Application {
    return this.app;
  }
}
