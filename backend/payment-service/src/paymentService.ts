/**
 * Payment Service - Privacy Payment with ERC-7962
 * Using DataDance SDK for one-time public key generation
 */

import { Pool } from 'pg';
import { ethers } from 'ethers';
import {
  PaymentRequest,
  PaymentRecord,
  PaymentAddress,
  RewardRequest,
  SubscriptionPlan,
  UserSubscription,
  ServiceFeeConfig
} from './types/payment';

export class PaymentService {
  private db: Pool;
  private provider: ethers.JsonRpcProvider;
  private dataDanceApiKey: string;
  private dataDanceNetwork: string;

  constructor(db: Pool, dataDanceApiKey: string, dataDanceNetwork: string, rpcUrl: string) {
    this.db = db;
    this.dataDanceApiKey = dataDanceApiKey;
    this.dataDanceNetwork = dataDanceNetwork;
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  /**
   * 生成一次性隐私收款地址 (ERC-7962)
   * Generate one-time privacy payment address
   */
  async generatePrivacyAddress(purpose: string, expiryHours: number = 24): Promise<PaymentAddress> {
    try {
      // In real implementation, integrate with DataDance SDK
      // For now, we generate a placeholder
      const oneTimeAddress = ethers.getAddress(ethers.getAddress(ethers.zeroPadValue('0x1', 20)));

      const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

      // Store in database
      const result = await this.db.query(
        `INSERT INTO privacy_addresses (one_time_address, expires_at, purpose, used)
         VALUES ($1, $2, $3, $4)
         RETURNING id, one_time_address, expires_at, purpose, used`,
        [oneTimeAddress, expiresAt, purpose, false]
      );

      return {
        oneTimeAddress: result.rows[0].one_time_address,
        expiresAt: result.rows[0].expires_at,
        used: result.rows[0].used,
        purpose: result.rows[0].purpose
      };
    } catch (error) {
      console.error('[Payment] Generate privacy address error:', error);
      throw error;
    }
  }

  /**
   * 记录支付请求 (隐私化)
   * Record payment request with privacy preservation
   */
  async recordPayment(request: PaymentRequest): Promise<PaymentRecord> {
    try {
      // Generate one-time address
      const privacyAddr = await this.generatePrivacyAddress(request.purpose, 24);

      // Create payment record (without exposing user identity in blockchain)
      const result = await this.db.query(
        `INSERT INTO payments (
          user_id, amount, currency, purpose, status,
          one_time_address, description, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         RETURNING *`,
        [
          request.userId,
          request.amount,
          request.currency,
          request.purpose,
          'pending',
          privacyAddr.oneTimeAddress,
          request.description,
          JSON.stringify(request.metadata || {})
        ]
      );

      return this.formatPaymentRecord(result.rows[0]);
    } catch (error) {
      console.error('[Payment] Record payment error:', error);
      throw error;
    }
  }

  /**
   * 发送匿名奖励给优质交易者
   * Send anonymous reward to top traders
   */
  async sendAnonymousReward(request: RewardRequest): Promise<PaymentRecord> {
    try {
      // Generate privacy address for trader
      const privacyAddr = await this.generatePrivacyAddress(
        `reward_${request.reason}`,
        72 // 3 days to claim
      );

      // Create reward record
      const result = await this.db.query(
        `INSERT INTO rewards (
          trader_address, amount, currency, reason, status,
          one_time_address, description, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING *`,
        [
          request.traderAddress,
          request.amount,
          request.currency,
          request.reason,
          'pending',
          privacyAddr.oneTimeAddress,
          request.description
        ]
      );

      return this.formatPaymentRecord(result.rows[0]);
    } catch (error) {
      console.error('[Payment] Send anonymous reward error:', error);
      throw error;
    }
  }

  /**
   * 处理订阅支付
   * Process subscription payment
   */
  async processSubscription(
    userId: number,
    planId: number,
    paymentTxHash: string
  ): Promise<UserSubscription> {
    try {
      // Get subscription plan details
      const planResult = await this.db.query(
        'SELECT * FROM subscription_plans WHERE id = $1 AND active = true',
        [planId]
      );

      if (planResult.rows.length === 0) {
        throw new Error('Plan not found or inactive');
      }

      const plan = planResult.rows[0];
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.duration);

      // Record payment
      const paymentRecord = await this.db.query(
        `INSERT INTO payments (
          user_id, amount, currency, purpose, status, tx_hash, created_at
        ) VALUES ($1, $2, $3, 'subscription', 'completed', $4, NOW())
         RETURNING id`,
        [userId, plan.price, plan.currency, paymentTxHash]
      );

      // Create subscription
      const subscriptionResult = await this.db.query(
        `INSERT INTO user_subscriptions (
          user_id, plan_id, status, start_date, end_date, payment_id
        ) VALUES ($1, $2, 'active', NOW(), $3, $4)
         RETURNING *`,
        [userId, planId, endDate, paymentRecord.rows[0].id]
      );

      return this.formatSubscription(subscriptionResult.rows[0]);
    } catch (error) {
      console.error('[Payment] Process subscription error:', error);
      throw error;
    }
  }

  /**
   * 获取用户的订阅状态
   * Get user's subscription status
   */
  async getUserSubscription(userId: number): Promise<UserSubscription | null> {
    try {
      const result = await this.db.query(
        `SELECT us.*, sp.name, sp.features
         FROM user_subscriptions us
         JOIN subscription_plans sp ON us.plan_id = sp.id
         WHERE us.user_id = $1 AND us.status = 'active' AND us.end_date > NOW()
         ORDER BY us.end_date DESC
         LIMIT 1`,
        [userId]
      );

      if (result.rows.length === 0) return null;
      return this.formatSubscription(result.rows[0]);
    } catch (error) {
      console.error('[Payment] Get subscription error:', error);
      throw error;
    }
  }

  /**
   * 记录 API 调用费用
   * Record API call fee
   */
  async recordApiUsage(userId: number, apiCalls: number, cost: string): Promise<void> {
    try {
      const purpose = `api_calls_${apiCalls}`;

      await this.db.query(
        `INSERT INTO api_usage_charges (user_id, api_calls, cost, recorded_at)
         VALUES ($1, $2, $3, NOW())`,
        [userId, apiCalls, cost]
      );
    } catch (error) {
      console.error('[Payment] Record API usage error:', error);
      throw error;
    }
  }

  /**
   * 获取支付历史 (隐私化)
   * Get payment history without exposing blockchain identity
   */
  async getPaymentHistory(userId: number, limit: number = 50, offset: number = 0): Promise<PaymentRecord[]> {
    try {
      const result = await this.db.query(
        `SELECT id, user_id, amount, currency, purpose, status, description,
                created_at, completed_at
         FROM payments
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      return result.rows.map(row => this.formatPaymentRecord(row));
    } catch (error) {
      console.error('[Payment] Get payment history error:', error);
      throw error;
    }
  }

  /**
   * 获取所有订阅计划
   * Get all available subscription plans
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const result = await this.db.query(
        `SELECT * FROM subscription_plans WHERE active = true ORDER BY price ASC`
      );

      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        duration: row.duration,
        price: row.price,
        currency: row.currency,
        features: row.features || [],
        active: row.active
      }));
    } catch (error) {
      console.error('[Payment] Get subscription plans error:', error);
      throw error;
    }
  }

  /**
   * 获取服务费配置
   * Get service fee configuration
   */
  async getServiceFeeConfig(): Promise<ServiceFeeConfig> {
    try {
      const result = await this.db.query(
        `SELECT * FROM service_fee_config WHERE active = true LIMIT 1`
      );

      if (result.rows.length === 0) {
        throw new Error('Service fee configuration not found');
      }

      const config = result.rows[0];
      return {
        apiCallFee: config.api_call_fee,
        dataAccessFee: config.data_access_fee,
        advancedAnalyticsFee: config.advanced_analytics_fee,
        currency: config.currency
      };
    } catch (error) {
      console.error('[Payment] Get service fee config error:', error);
      throw error;
    }
  }

  /**
   * 生成支付摘要 (用于审计，隐私化)
   * Generate payment summary for audit without exposing identities
   */
  async generateAuditSummary(startDate: Date, endDate: Date): Promise<any> {
    try {
      const result = await this.db.query(
        `SELECT
          purpose,
          currency,
          COUNT(*) as transaction_count,
          SUM(CAST(amount AS NUMERIC)) as total_amount,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
         FROM payments
         WHERE created_at >= $1 AND created_at <= $2
         GROUP BY purpose, currency
         ORDER BY total_amount DESC`,
        [startDate, endDate]
      );

      return {
        period: { start: startDate, end: endDate },
        summary: result.rows,
        totalTransactions: result.rows.reduce((sum, row) => sum + parseInt(row.transaction_count), 0),
        totalVolume: result.rows.reduce((sum, row) => sum + parseFloat(row.total_amount || 0), 0)
      };
    } catch (error) {
      console.error('[Payment] Generate audit summary error:', error);
      throw error;
    }
  }

  /**
   * 标记隐私地址已使用
   * Mark privacy address as used
   */
  async markAddressUsed(oneTimeAddress: string, txHash: string): Promise<void> {
    try {
      await this.db.query(
        `UPDATE privacy_addresses SET used = true, tx_hash = $1, used_at = NOW()
         WHERE one_time_address = $2`,
        [txHash, oneTimeAddress]
      );

      // Update payment record status
      await this.db.query(
        `UPDATE payments SET status = 'completed', tx_hash = $1, completed_at = NOW()
         WHERE one_time_address = $2`,
        [txHash, oneTimeAddress]
      );
    } catch (error) {
      console.error('[Payment] Mark address used error:', error);
      throw error;
    }
  }

  // Helper methods
  private formatPaymentRecord(row: any): PaymentRecord {
    return {
      id: row.id,
      userId: row.user_id,
      traderAddress: row.trader_address,
      amount: row.amount,
      currency: row.currency,
      purpose: row.purpose,
      status: row.status,
      oneTimeAddress: row.one_time_address,
      txHash: row.tx_hash,
      createdAt: row.created_at,
      completedAt: row.completed_at,
      description: row.description,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    };
  }

  private formatSubscription(row: any): UserSubscription {
    return {
      userId: row.user_id,
      planId: row.plan_id,
      status: row.status,
      startDate: row.start_date,
      endDate: row.end_date,
      paymentId: row.payment_id
    };
  }
}
