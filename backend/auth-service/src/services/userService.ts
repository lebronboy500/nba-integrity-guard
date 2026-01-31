/**
 * User Service
 * Handles user authentication and management
 */

import { Pool, PoolClient } from 'pg';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../utils/password';
import { generateTokenPair, JWTPayload, verifyRefreshToken } from '../utils/jwt';

export interface RegisterEmailRequest {
  email: string;
  username: string;
  password: string;
  fullName?: string;
}

export interface LoginEmailRequest {
  email: string;
  password: string;
}

export interface Web3LoginRequest {
  walletAddress: string;
  signature: string;
  message: string;
}

export interface AuthResponse {
  user: {
    id: number;
    email: string;
    username: string;
    walletAddress?: string;
    fullName?: string;
    avatarUrl?: string;
    isVerified: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  password_hash?: string;
  wallet_address?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  theme: string;
  language: string;
  notification_settings: any;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  is_active: boolean;
  is_verified: boolean;
}

export class UserService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Register user with email and password
   */
  async registerEmail(data: RegisterEmailRequest): Promise<AuthResponse> {
    const { email, username, password, fullName } = data;

    // Validate password strength
    const validation = validatePasswordStrength(password);
    if (!validation.valid) {
      throw new Error(`Password validation failed: ${validation.errors.join(', ')}`);
    }

    // Check if email or username already exists
    const existingUser = await this.db.query(
      `SELECT id FROM users WHERE email = $1 OR username = $2`,
      [email.toLowerCase(), username]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('Email or username already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const result = await this.db.query(
      `INSERT INTO users (email, username, password_hash, full_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, username, full_name, avatar_url, is_verified`,
      [email.toLowerCase(), username, passwordHash, fullName || null]
    );

    const user = result.rows[0];

    // Generate tokens
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      username: user.username
    };
    const tokens = generateTokenPair(payload);

    // Store session
    await this.createSession(user.id, tokens.accessToken, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        isVerified: user.is_verified
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  /**
   * Login with email and password
   */
  async loginEmail(data: LoginEmailRequest): Promise<AuthResponse> {
    const { email, password } = data;

    // Find user
    const result = await this.db.query(
      `SELECT id, email, username, password_hash, full_name, avatar_url, wallet_address, is_verified, is_active
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await this.db.query(
      `UPDATE users SET last_login = NOW() WHERE id = $1`,
      [user.id]
    );

    // Generate tokens
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      wallet: user.wallet_address
    };
    const tokens = generateTokenPair(payload);

    // Store session
    await this.createSession(user.id, tokens.accessToken, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        walletAddress: user.wallet_address,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        isVerified: user.is_verified
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  /**
   * Login with Web3 wallet (signature verification)
   */
  async loginWeb3(data: Web3LoginRequest): Promise<AuthResponse> {
    const { walletAddress, signature, message } = data;

    // TODO: Verify signature using ethers.js
    // For now, we just create/find user by wallet address

    // Find or create user
    let result = await this.db.query(
      `SELECT id, email, username, wallet_address, full_name, avatar_url, is_verified
       FROM users WHERE wallet_address = $1`,
      [walletAddress.toLowerCase()]
    );

    let user;

    if (result.rows.length === 0) {
      // Create new user with wallet
      const username = `user_${walletAddress.slice(0, 8)}`;
      const email = `${walletAddress.toLowerCase()}@wallet.local`;

      const insertResult = await this.db.query(
        `INSERT INTO users (email, username, wallet_address)
         VALUES ($1, $2, $3)
         RETURNING id, email, username, wallet_address, full_name, avatar_url, is_verified`,
        [email, username, walletAddress.toLowerCase()]
      );

      user = insertResult.rows[0];
    } else {
      user = result.rows[0];
    }

    // Update last login
    await this.db.query(
      `UPDATE users SET last_login = NOW() WHERE id = $1`,
      [user.id]
    );

    // Generate tokens
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      wallet: user.wallet_address
    };
    const tokens = generateTokenPair(payload);

    // Store session
    await this.createSession(user.id, tokens.accessToken, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        walletAddress: user.wallet_address,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        isVerified: user.is_verified
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Check if session exists and is active
    const sessionResult = await this.db.query(
      `SELECT id FROM sessions WHERE refresh_token = $1 AND is_active = true`,
      [refreshToken]
    );

    if (sessionResult.rows.length === 0) {
      throw new Error('Invalid or expired refresh token');
    }

    // Generate new access token
    const newPayload: JWTPayload = {
      userId: payload.userId,
      email: payload.email,
      username: payload.username,
      wallet: payload.wallet
    };

    const tokens = generateTokenPair(newPayload);

    // Update session
    await this.db.query(
      `UPDATE sessions SET token = $1, updated_at = NOW() WHERE refresh_token = $2`,
      [tokens.accessToken, refreshToken]
    );

    return { accessToken: tokens.accessToken };
  }

  /**
   * Logout (invalidate session)
   */
  async logout(accessToken: string): Promise<void> {
    await this.db.query(
      `UPDATE sessions SET is_active = false WHERE token = $1`,
      [accessToken]
    );
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: number): Promise<User | null> {
    const result = await this.db.query(
      `SELECT * FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: number,
    updates: {
      fullName?: string;
      avatarUrl?: string;
      bio?: string;
      theme?: string;
      language?: string;
    }
  ): Promise<User> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.fullName !== undefined) {
      fields.push(`full_name = $${paramIndex++}`);
      values.push(updates.fullName);
    }

    if (updates.avatarUrl !== undefined) {
      fields.push(`avatar_url = $${paramIndex++}`);
      values.push(updates.avatarUrl);
    }

    if (updates.bio !== undefined) {
      fields.push(`bio = $${paramIndex++}`);
      values.push(updates.bio);
    }

    if (updates.theme !== undefined) {
      fields.push(`theme = $${paramIndex++}`);
      values.push(updates.theme);
    }

    if (updates.language !== undefined) {
      fields.push(`language = $${paramIndex++}`);
      values.push(updates.language);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push(`updated_at = NOW()`);
    values.push(userId);

    const result = await this.db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Create session
   */
  private async createSession(
    userId: number,
    accessToken: string,
    refreshToken: string
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.db.query(
      `INSERT INTO sessions (user_id, token, refresh_token, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [userId, accessToken, refreshToken, expiresAt]
    );
  }

  /**
   * Invalidate all sessions for a user
   */
  async invalidateAllSessions(userId: number): Promise<void> {
    await this.db.query(
      `UPDATE sessions SET is_active = false WHERE user_id = $1`,
      [userId]
    );
  }
}
