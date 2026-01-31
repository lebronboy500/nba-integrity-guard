/**
 * Reputation & Profile Routes
 */

import express, { Request, Response } from 'express';
import { TraderProfileService } from '../traderProfileService';
import { ReputationService } from '../reputationService';

export function createReputationRoutes(
  profileService: TraderProfileService,
  reputationService: ReputationService
): express.Router {
  const router = express.Router();

  /**
   * GET /reputation/profile/:traderAddress
   * Get trader profile
   */
  router.get('/profile/:traderAddress', async (req: Request, res: Response) => {
    try {
      const { traderAddress } = req.params;

      const profile = await profileService.getTraderProfile(traderAddress);

      if (!profile) {
        res.status(404).json({ success: false, error: 'Trader not found' });
        return;
      }

      res.json({ success: true, data: profile });
    } catch (error) {
      console.error('[Reputation] Profile error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  /**
   * GET /reputation/history/:traderAddress
   * Get trade history
   */
  router.get('/history/:traderAddress', async (req: Request, res: Response) => {
    try {
      const { traderAddress } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const history = await profileService.getTradeHistory(traderAddress, limit, offset);

      res.json({ success: true, data: history, count: history.length });
    } catch (error) {
      console.error('[Reputation] History error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  /**
   * GET /reputation/stats/:traderAddress
   * Get detailed trader statistics
   */
  router.get('/stats/:traderAddress', async (req: Request, res: Response) => {
    try {
      const { traderAddress } = req.params;

      const stats = await profileService.getTraderStats(traderAddress);

      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('[Reputation] Stats error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  /**
   * GET /reputation/score/:traderAddress
   * Get reputation score
   */
  router.get('/score/:traderAddress', async (req: Request, res: Response) => {
    try {
      const { traderAddress } = req.params;

      const score = await reputationService.getReputationScore(traderAddress);

      if (!score) {
        res.status(404).json({ success: false, error: 'Trader not found' });
        return;
      }

      res.json({ success: true, data: score });
    } catch (error) {
      console.error('[Reputation] Score error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  /**
   * GET /reputation/trust/:traderAddress
   * Get trust metrics
   */
  router.get('/trust/:traderAddress', async (req: Request, res: Response) => {
    try {
      const { traderAddress } = req.params;

      const trust = await reputationService.getTrustMetrics(traderAddress);

      res.json({ success: true, data: trust });
    } catch (error) {
      console.error('[Reputation] Trust error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  /**
   * GET /reputation/leaderboard
   * Get reputation leaderboard
   */
  router.get('/leaderboard', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;

      const leaderboard = await reputationService.getReputationLeaderboard(limit);

      res.json({ success: true, data: leaderboard, count: leaderboard.length });
    } catch (error) {
      console.error('[Reputation] Leaderboard error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  /**
   * GET /reputation/badges/:traderAddress
   * Get trader badges
   */
  router.get('/badges/:traderAddress', async (req: Request, res: Response) => {
    try {
      const { traderAddress } = req.params;

      const badges = await reputationService.getTraderBadges(traderAddress);

      res.json({ success: true, data: badges, count: badges.length });
    } catch (error) {
      console.error('[Reputation] Badges error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  /**
   * GET /reputation/portfolio/:traderAddress
   * Get trader portfolio composition
   */
  router.get('/portfolio/:traderAddress', async (req: Request, res: Response) => {
    try {
      const { traderAddress } = req.params;

      const portfolio = await profileService.getTraderPortfolio(traderAddress);

      res.json({ success: true, data: portfolio });
    } catch (error) {
      console.error('[Reputation] Portfolio error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  /**
   * GET /reputation/similar/:traderAddress
   * Get similar traders
   */
  router.get('/similar/:traderAddress', async (req: Request, res: Response) => {
    try {
      const { traderAddress } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;

      const similar = await profileService.getSimilarTraders(traderAddress, limit);

      res.json({ success: true, data: similar, count: similar.length });
    } catch (error) {
      console.error('[Reputation] Similar traders error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  /**
   * GET /reputation/top-traders
   * Get top traders by win rate
   */
  router.get('/top-traders', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;

      const topTraders = await profileService.getTopTradersByWinRate(limit);

      res.json({ success: true, data: topTraders, count: topTraders.length });
    } catch (error) {
      console.error('[Reputation] Top traders error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  /**
   * GET /reputation/dashboard/:traderAddress
   * Get comprehensive trader dashboard
   */
  router.get('/dashboard/:traderAddress', async (req: Request, res: Response) => {
    try {
      const { traderAddress } = req.params;

      const [profile, score, stats, badges, portfolio, similar] = await Promise.all([
        profileService.getTraderProfile(traderAddress),
        reputationService.getReputationScore(traderAddress),
        profileService.getTraderStats(traderAddress),
        reputationService.getTraderBadges(traderAddress),
        profileService.getTraderPortfolio(traderAddress),
        profileService.getSimilarTraders(traderAddress, 5)
      ]);

      if (!profile) {
        res.status(404).json({ success: false, error: 'Trader not found' });
        return;
      }

      res.json({
        success: true,
        data: {
          profile,
          reputation: score,
          stats,
          badges,
          portfolio,
          similarTraders: similar
        }
      });
    } catch (error) {
      console.error('[Reputation] Dashboard error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  return router;
}
