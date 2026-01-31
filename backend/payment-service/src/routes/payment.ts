/**
 * Payment Service Routes
 * Privacy Payment API Endpoints
 */

import express, { Request, Response } from 'express';
import { PaymentService } from '../paymentService';
import { PaymentRequest, RewardRequest } from '../types/payment';

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export function createPaymentRoutes(paymentService: PaymentService): express.Router {
  const router = express.Router();

  /**
   * POST /payment/generate-address
   * Generate one-time privacy payment address (ERC-7962)
   */
  router.post('/generate-address', async (req: Request, res: Response) => {
    try {
      const { purpose, expiryHours = 24 } = req.body;

      if (!purpose) {
        res.status(400).json({ success: false, error: 'Purpose is required' });
        return;
      }

      const address = await paymentService.generatePrivacyAddress(purpose, expiryHours);

      res.json({
        success: true,
        data: {
          oneTimeAddress: address.oneTimeAddress,
          expiresAt: address.expiresAt,
          purpose: address.purpose,
          note: 'Send payment to this address. It will automatically reconcile once confirmed.'
        }
      });
    } catch (error) {
      console.error('[Payment] Generate address error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  /**
   * POST /payment/request
   * Request a payment (user initiates payment)
   */
  router.post('/request', async (req: Request, res: Response) => {
    try {
      const { amount, currency, purpose, description, metadata } = req.body;
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const paymentRequest: PaymentRequest = {
        userId,
        amount,
        currency: currency || 'USDC',
        purpose: purpose || 'service_fee',
        description,
        metadata
      };

      const payment = await paymentService.recordPayment(paymentRequest);

      res.json({
        success: true,
        data: {
          paymentId: payment.id,
          oneTimeAddress: payment.oneTimeAddress,
          amount: payment.amount,
          currency: payment.currency,
          expiresAt: 'Address expires in 24 hours',
          status: payment.status
        }
      });
    } catch (error) {
      console.error('[Payment] Request payment error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  /**
   * POST /payment/subscribe
   * Subscribe to a plan
   */
  router.post('/subscribe', async (req: Request, res: Response) => {
    try {
      const { planId, paymentTxHash } = req.body;
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      if (!planId || !paymentTxHash) {
        res.status(400).json({ success: false, error: 'Missing required fields' });
        return;
      }

      const subscription = await paymentService.processSubscription(userId, planId, paymentTxHash);

      res.json({
        success: true,
        data: {
          subscriptionId: subscription.paymentId,
          planId: subscription.planId,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          message: 'Subscription activated successfully'
        }
      });
    } catch (error) {
      console.error('[Payment] Subscribe error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  /**
   * GET /payment/subscription
   * Get current subscription status
   */
  router.get('/subscription', async (req: Request, res: Response) => {
    try {
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const subscription = await paymentService.getUserSubscription(userId);

      if (!subscription) {
        res.json({
          success: true,
          data: null,
          message: 'No active subscription'
        });
        return;
      }

      res.json({
        success: true,
        data: subscription
      });
    } catch (error) {
      console.error('[Payment] Get subscription error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  /**
   * GET /payment/plans
   * Get all subscription plans
   */
  router.get('/plans', async (req: Request, res: Response) => {
    try {
      const plans = await paymentService.getSubscriptionPlans();

      res.json({
        success: true,
        data: plans,
        count: plans.length
      });
    } catch (error) {
      console.error('[Payment] Get plans error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  /**
   * GET /payment/history
   * Get payment history (privacy-preserving)
   */
  router.get('/history', async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const history = await paymentService.getPaymentHistory(userId, limit, offset);

      res.json({
        success: true,
        data: history,
        count: history.length
      });
    } catch (error) {
      console.error('[Payment] Get history error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  /**
   * POST /payment/record-api-usage
   * Record API call for billing
   */
  router.post('/record-api-usage', async (req: Request, res: Response) => {
    try {
      const { apiCalls, cost } = req.body;
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      await paymentService.recordApiUsage(userId, apiCalls, cost);

      res.json({
        success: true,
        data: {
          apiCalls,
          cost,
          recorded: true
        }
      });
    } catch (error) {
      console.error('[Payment] Record API usage error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  /**
   * GET /payment/service-fees
   * Get current service fee configuration
   */
  router.get('/service-fees', async (req: Request, res: Response) => {
    try {
      const fees = await paymentService.getServiceFeeConfig();

      res.json({
        success: true,
        data: fees
      });
    } catch (error) {
      console.error('[Payment] Get service fees error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  /**
   * POST /payment/send-reward
   * Send anonymous reward to trader (admin only)
   */
  router.post('/send-reward', async (req: Request, res: Response) => {
    try {
      const { traderAddress, amount, currency, reason, description } = req.body;
      // TODO: Add admin authentication check

      const rewardRequest: RewardRequest = {
        traderAddress,
        amount,
        currency: currency || 'USDC',
        reason: reason || 'contribution',
        description
      };

      const reward = await paymentService.sendAnonymousReward(rewardRequest);

      res.json({
        success: true,
        data: {
          rewardId: reward.id,
          oneTimeAddress: reward.oneTimeAddress,
          amount: reward.amount,
          status: reward.status,
          message: 'Reward will be sent anonymously to the trader'
        }
      });
    } catch (error) {
      console.error('[Payment] Send reward error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  /**
   * GET /payment/audit-summary
   * Get audit summary (privacy-preserving aggregates only)
   */
  router.get('/audit-summary', async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      // TODO: Add admin authentication check

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      const summary = await paymentService.generateAuditSummary(start, end);

      res.json({
        success: true,
        data: summary,
        note: 'Summary shows aggregated data only - individual user identities are not revealed'
      });
    } catch (error) {
      console.error('[Payment] Get audit summary error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  /**
   * POST /payment/confirm-payment
   * Confirm payment received (called by webhook or monitoring service)
   */
  router.post('/confirm-payment', async (req: Request, res: Response) => {
    try {
      const { oneTimeAddress, txHash } = req.body;

      if (!oneTimeAddress || !txHash) {
        res.status(400).json({ success: false, error: 'Missing required fields' });
        return;
      }

      await paymentService.markAddressUsed(oneTimeAddress, txHash);

      res.json({
        success: true,
        data: {
          confirmed: true,
          txHash
        }
      });
    } catch (error) {
      console.error('[Payment] Confirm payment error:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  return router;
}
