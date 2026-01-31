/**
 * Analytics Routes
 */

import express, { Request, Response } from 'express';
import { AnalyticsService } from '../analyticsService';

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export function createAnalyticsRoutes(analyticsService: AnalyticsService): express.Router {
  const router = express.Router();

  /**
   * GET /analytics/sentiment/:marketSlug
   * Get market sentiment analysis
   */
  router.get('/sentiment/:marketSlug', async (req: Request, res: Response) => {
    try {
      const { marketSlug } = req.params;
      const hours = parseInt(req.query.hours as string) || 24;

      const sentiment = await analyticsService.getMarketSentiment(marketSlug, hours);

      if (!sentiment) {
        res.status(404).json({ success: false, error: 'Market not found' });
        return;
      }

      res.json({ success: true, data: sentiment });
    } catch (error) {
      console.error('[Analytics] Sentiment error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  /**
   * GET /analytics/trend/:marketSlug/:outcome
   * Get price trend analysis
   */
  router.get('/trend/:marketSlug/:outcome', async (req: Request, res: Response) => {
    try {
      const { marketSlug, outcome } = req.params;
      const hours = parseInt(req.query.hours as string) || 24;
      const interval = parseInt(req.query.interval as string) || 1;

      if (!['YES', 'NO'].includes(outcome)) {
        res.status(400).json({ success: false, error: 'Outcome must be YES or NO' });
        return;
      }

      const trends = await analyticsService.getPriceTrend(
        marketSlug,
        outcome as 'YES' | 'NO',
        hours,
        interval
      );

      res.json({ success: true, data: trends, count: trends.length });
    } catch (error) {
      console.error('[Analytics] Trend error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  /**
   * GET /analytics/large-trades
   * Get large trades (whale activity)
   */
  router.get('/large-trades', async (req: Request, res: Response) => {
    try {
      const minValue = parseInt(req.query.minValue as string) || 10000;
      const hours = parseInt(req.query.hours as string) || 24;
      const limit = parseInt(req.query.limit as string) || 50;

      const trades = await analyticsService.getLargeTrades(minValue, hours, limit);

      res.json({ success: true, data: trades, count: trades.length });
    } catch (error) {
      console.error('[Analytics] Large trades error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  /**
   * GET /analytics/stats
   * Get trading statistics
   */
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      const period = (req.query.period as string) || 'day';

      if (!['day', 'week', 'month'].includes(period)) {
        res.status(400).json({ success: false, error: 'Period must be day, week, or month' });
        return;
      }

      const stats = await analyticsService.getTradingStats(period as 'day' | 'week' | 'month');

      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('[Analytics] Stats error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  /**
   * GET /analytics/top-traders
   * Get top traders by volume
   */
  router.get('/top-traders', async (req: Request, res: Response) => {
    try {
      const hours = parseInt(req.query.hours as string) || 24;
      const limit = parseInt(req.query.limit as string) || 10;

      const traders = await analyticsService.getTopTraders(hours, limit);

      res.json({ success: true, data: traders, count: traders.length });
    } catch (error) {
      console.error('[Analytics] Top traders error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  /**
   * POST /analytics/compare-markets
   * Compare multiple markets
   */
  router.post('/compare-markets', async (req: Request, res: Response) => {
    try {
      const { marketSlugs } = req.body;
      const hours = parseInt(req.query.hours as string) || 24;

      if (!Array.isArray(marketSlugs) || marketSlugs.length === 0) {
        res.status(400).json({ success: false, error: 'marketSlugs must be a non-empty array' });
        return;
      }

      const comparison = await analyticsService.compareMarkets(marketSlugs, hours);

      res.json({ success: true, data: comparison, count: comparison.length });
    } catch (error) {
      console.error('[Analytics] Compare markets error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  /**
   * GET /analytics/dashboard/:marketSlug
   * Get comprehensive dashboard data for a market
   */
  router.get('/dashboard/:marketSlug', async (req: Request, res: Response) => {
    try {
      const { marketSlug } = req.params;
      const hours = parseInt(req.query.hours as string) || 24;

      const [sentiment, trendYes, trendNo, largeTrades, stats, topTraders] = await Promise.all([
        analyticsService.getMarketSentiment(marketSlug, hours),
        analyticsService.getPriceTrend(marketSlug, 'YES', hours, 1),
        analyticsService.getPriceTrend(marketSlug, 'NO', hours, 1),
        analyticsService.getLargeTrades(5000, hours, 20),
        analyticsService.getTradingStats('day'),
        analyticsService.getTopTraders(hours, 5)
      ]);

      res.json({
        success: true,
        data: {
          sentiment,
          trends: { YES: trendYes, NO: trendNo },
          largeTrades,
          stats,
          topTraders
        }
      });
    } catch (error) {
      console.error('[Analytics] Dashboard error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  return router;
}
