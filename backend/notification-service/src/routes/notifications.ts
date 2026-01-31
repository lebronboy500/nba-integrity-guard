/**
 * Notification Routes
 */

import express, { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../notificationService';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

// Simple auth middleware (reused from auth-service)
function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  // TODO: Verify JWT token here
  // For now, just extract userId from request or token
  // In production, this should verify the token properly

  // Mock userId for development
  req.userId = 1;
  next();
}

export function createNotificationRoutes(notificationService: NotificationService): express.Router {
  const router = express.Router();

  /**
   * GET /notifications
   * Get user notifications
   */
  router.get('/', authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const notifications = await notificationService.getUserNotifications(
        req.userId,
        limit,
        offset
      );

      res.json({
        success: true,
        data: notifications,
        count: notifications.length
      });
    } catch (error) {
      console.error('[Notifications] Get notifications error:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  /**
   * POST /notifications/:id/read
   * Mark notification as read
   */
  router.post('/:id/read', authenticateToken, async (req: Request, res: Response) => {
    try {
      const notificationId = parseInt(req.params.id);

      await notificationService.markAsRead(notificationId);

      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('[Notifications] Mark as read error:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  /**
   * POST /notifications/read-all
   * Mark all notifications as read
   */
  router.post('/read-all', authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      await notificationService.markAllAsRead(req.userId);

      res.json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      console.error('[Notifications] Mark all as read error:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  /**
   * DELETE /notifications/:id
   * Delete notification
   */
  router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const notificationId = parseInt(req.params.id);

      await notificationService.deleteNotification(notificationId);

      res.json({
        success: true,
        message: 'Notification deleted'
      });
    } catch (error) {
      console.error('[Notifications] Delete notification error:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  /**
   * PUT /notifications/settings
   * Update notification settings
   */
  router.put('/settings', authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const { email, telegram, discord } = req.body;

      await notificationService.updateNotificationSettings(req.userId, {
        email,
        telegram,
        discord
      });

      res.json({
        success: true,
        message: 'Notification settings updated'
      });
    } catch (error) {
      console.error('[Notifications] Update settings error:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  /**
   * POST /notifications/test/signal
   * Test signal notification (for development)
   */
  router.post('/test/signal', authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      await notificationService.notifySignalTriggered(req.userId, {
        gameId: 'TEST_NBA_20250130_LAL_BOS',
        riggingIndex: 0.72,
        anomalyScore: 0.85,
        tradeAmount: 1500
      });

      res.json({
        success: true,
        message: 'Test signal notification sent'
      });
    } catch (error) {
      console.error('[Notifications] Test signal error:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  /**
   * POST /notifications/test/trade
   * Test trade notification (for development)
   */
  router.post('/test/trade', authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      await notificationService.notifyTradeCompleted(req.userId, {
        gameId: 'TEST_NBA_20250130_LAL_BOS',
        action: 'BET_NO',
        amount: 1500,
        estimatedPayout: 2700
      });

      res.json({
        success: true,
        message: 'Test trade notification sent'
      });
    } catch (error) {
      console.error('[Notifications] Test trade error:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  /**
   * POST /notifications/test/profit
   * Test profit notification (for development)
   */
  router.post('/test/profit', authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      await notificationService.notifyProfitDistributed(req.userId, {
        totalProfit: 1200,
        hedgeAmount: 600,
        opsFee: 60,
        userReward: 540
      });

      res.json({
        success: true,
        message: 'Test profit notification sent'
      });
    } catch (error) {
      console.error('[Notifications] Test profit error:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  return router;
}
