/**
 * Notification Service
 * Handles email, Telegram, and Discord notifications
 */

import { Pool } from 'pg';
import nodemailer, { Transporter } from 'nodemailer';
import TelegramBot from 'node-telegram-bot-api';

export interface NotificationData {
  userId: number;
  type: 'signal' | 'trade' | 'profit' | 'alert';
  title: string;
  message: string;
  data?: Record<string, any>;
}

export interface NotificationTemplate {
  type: string;
  emailSubject?: string;
  emailBody?: string;
  telegramMessage?: string;
  discordMessage?: string;
}

export class NotificationService {
  private db: Pool;
  private emailTransporter: Transporter | null = null;
  private telegramBot: TelegramBot | null = null;

  constructor(db: Pool) {
    this.db = db;
    this.initializeEmailTransporter();
    this.initializeTelegramBot();
  }

  /**
   * Initialize email transporter
   */
  private initializeEmailTransporter(): void {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn('[Notification] Email not configured (missing SMTP credentials)');
      return;
    }

    this.emailTransporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    console.log('[Notification] Email transporter initialized');
  }

  /**
   * Initialize Telegram bot
   */
  private initializeTelegramBot(): void {
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!telegramToken) {
      console.warn('[Notification] Telegram bot not configured (missing TELEGRAM_BOT_TOKEN)');
      return;
    }

    this.telegramBot = new TelegramBot(telegramToken, { polling: false });
    console.log('[Notification] Telegram bot initialized');
  }

  /**
   * Create notification in database
   */
  async createNotification(notification: NotificationData): Promise<number> {
    const result = await this.db.query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [notification.userId, notification.type, notification.title, notification.message, JSON.stringify(notification.data || {})]
    );

    return result.rows[0].id;
  }

  /**
   * Send email notification
   */
  async sendEmail(
    userId: number,
    email: string,
    subject: string,
    htmlBody: string
  ): Promise<boolean> {
    if (!this.emailTransporter) {
      console.warn('[Notification] Email transporter not configured');
      return false;
    }

    try {
      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@nba-integrity-guard.com',
        to: email,
        subject,
        html: htmlBody
      });

      console.log(`[Notification] ✅ Email sent to ${email}`);
      return true;
    } catch (error) {
      console.error(`[Notification] ❌ Failed to send email to ${email}:`, error);
      return false;
    }
  }

  /**
   * Send Telegram notification
   */
  async sendTelegram(
    userId: number,
    telegramChatId: string,
    message: string
  ): Promise<boolean> {
    if (!this.telegramBot) {
      console.warn('[Notification] Telegram bot not configured');
      return false;
    }

    try {
      await this.telegramBot.sendMessage(telegramChatId, message, {
        parse_mode: 'HTML'
      });

      console.log(`[Notification] ✅ Telegram message sent to ${telegramChatId}`);
      return true;
    } catch (error) {
      console.error(`[Notification] ❌ Failed to send Telegram message:`, error);
      return false;
    }
  }

  /**
   * Notify signal triggered
   */
  async notifySignalTriggered(userId: number, signalData: {
    gameId: string;
    riggingIndex: number;
    anomalyScore: number;
    tradeAmount: number;
  }): Promise<void> {
    // Create database notification
    await this.createNotification({
      userId,
      type: 'signal',
      title: 'High Risk Signal Detected',
      message: `Game: ${signalData.gameId} | Rigging: ${signalData.riggingIndex.toFixed(2)} | Anomaly: ${signalData.anomalyScore.toFixed(2)}`,
      data: signalData
    });

    // Get user info
    const userResult = await this.db.query(
      `SELECT email, notification_settings FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return;
    }

    const user = userResult.rows[0];
    const settings = user.notification_settings || {};

    // Send email
    if (settings.email) {
      const htmlBody = `
        <h2>🚨 High Risk Signal Detected</h2>
        <p><strong>Game:</strong> ${signalData.gameId}</p>
        <p><strong>Rigging Index:</strong> ${signalData.riggingIndex.toFixed(2)}</p>
        <p><strong>Anomaly Score:</strong> ${signalData.anomalyScore.toFixed(2)}</p>
        <p><strong>Trade Amount:</strong> $${signalData.tradeAmount.toFixed(2)}</p>
        <p><a href="https://nba-integrity-guard.com/dashboard">View Dashboard</a></p>
      `;

      await this.sendEmail(
        userId,
        user.email,
        'High Risk Signal Detected',
        htmlBody
      );
    }

    // Send Telegram (if user has chat_id configured)
    // TODO: Implement Telegram chat_id storage in users table
  }

  /**
   * Notify trade completed
   */
  async notifyTradeCompleted(userId: number, tradeData: {
    gameId: string;
    action: string;
    amount: number;
    estimatedPayout: number;
  }): Promise<void> {
    // Create database notification
    await this.createNotification({
      userId,
      type: 'trade',
      title: 'Trade Completed',
      message: `Game: ${tradeData.gameId} | Action: ${tradeData.action} | Amount: $${tradeData.amount}`,
      data: tradeData
    });

    // Get user info
    const userResult = await this.db.query(
      `SELECT email, notification_settings FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return;
    }

    const user = userResult.rows[0];
    const settings = user.notification_settings || {};

    // Send email
    if (settings.email) {
      const htmlBody = `
        <h2>✅ Trade Completed</h2>
        <p><strong>Game:</strong> ${tradeData.gameId}</p>
        <p><strong>Action:</strong> ${tradeData.action}</p>
        <p><strong>Amount:</strong> $${tradeData.amount.toFixed(2)}</p>
        <p><strong>Estimated Payout:</strong> $${tradeData.estimatedPayout.toFixed(2)}</p>
        <p><a href="https://nba-integrity-guard.com/trades">View Trades</a></p>
      `;

      await this.sendEmail(
        userId,
        user.email,
        'Trade Completed',
        htmlBody
      );
    }
  }

  /**
   * Notify profit distributed
   */
  async notifyProfitDistributed(userId: number, profitData: {
    totalProfit: number;
    hedgeAmount: number;
    opsFee: number;
    userReward: number;
  }): Promise<void> {
    // Create database notification
    await this.createNotification({
      userId,
      type: 'profit',
      title: 'Profit Distribution',
      message: `Total Profit: $${profitData.totalProfit.toFixed(2)} | Your Share: $${profitData.userReward.toFixed(2)}`,
      data: profitData
    });

    // Get user info
    const userResult = await this.db.query(
      `SELECT email, notification_settings FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return;
    }

    const user = userResult.rows[0];
    const settings = user.notification_settings || {};

    // Send email
    if (settings.email) {
      const htmlBody = `
        <h2>💰 Profit Distribution</h2>
        <p><strong>Total Profit:</strong> $${profitData.totalProfit.toFixed(2)}</p>
        <p><strong>Hedge Fund (50%):</strong> $${profitData.hedgeAmount.toFixed(2)}</p>
        <p><strong>Operations Fee (5%):</strong> $${profitData.opsFee.toFixed(2)}</p>
        <p><strong>Your Share (45%):</strong> <span style="color: green; font-weight: bold;">$${profitData.userReward.toFixed(2)}</span></p>
        <p><a href="https://nba-integrity-guard.com/distributions">View Details</a></p>
      `;

      await this.sendEmail(
        userId,
        user.email,
        'Profit Distribution',
        htmlBody
      );
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: number,
    limit: number = 20,
    offset: number = 0
  ): Promise<any[]> {
    const result = await this.db.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number): Promise<void> {
    await this.db.query(
      `UPDATE notifications SET read = true WHERE id = $1`,
      [notificationId]
    );
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: number): Promise<void> {
    await this.db.query(
      `UPDATE notifications SET read = true WHERE user_id = $1`,
      [userId]
    );
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: number): Promise<void> {
    await this.db.query(
      `DELETE FROM notifications WHERE id = $1`,
      [notificationId]
    );
  }

  /**
   * Update user notification settings
   */
  async updateNotificationSettings(
    userId: number,
    settings: {
      email?: boolean;
      telegram?: boolean;
      discord?: boolean;
    }
  ): Promise<void> {
    // Get current settings
    const result = await this.db.query(
      `SELECT notification_settings FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const currentSettings = result.rows[0].notification_settings || {};
    const updatedSettings = { ...currentSettings, ...settings };

    await this.db.query(
      `UPDATE users SET notification_settings = $1 WHERE id = $2`,
      [JSON.stringify(updatedSettings), userId]
    );

    console.log(`[Notification] Updated notification settings for user ${userId}`);
  }
}
