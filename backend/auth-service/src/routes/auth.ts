/**
 * Authentication Routes
 */

import express, { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { authenticateToken } from '../middleware/auth';

export function createAuthRoutes(userService: UserService): express.Router {
  const router = express.Router();

  /**
   * POST /auth/register/email
   * Register with email and password
   */
  router.post('/register/email', async (req: Request, res: Response) => {
    try {
      const { email, username, password, fullName } = req.body;

      // Validation
      if (!email || !username || !password) {
        res.status(400).json({
          success: false,
          error: 'Email, username, and password are required'
        });
        return;
      }

      const result = await userService.registerEmail({
        email,
        username,
        password,
        fullName
      });

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('[Auth] Registration error:', error);
      res.status(400).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  /**
   * POST /auth/login/email
   * Login with email and password
   */
  router.post('/login/email', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
        return;
      }

      const result = await userService.loginEmail({ email, password });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('[Auth] Login error:', error);
      res.status(401).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  /**
   * POST /auth/login/web3
   * Login with Web3 wallet
   */
  router.post('/login/web3', async (req: Request, res: Response) => {
    try {
      const { walletAddress, signature, message } = req.body;

      if (!walletAddress || !signature || !message) {
        res.status(400).json({
          success: false,
          error: 'Wallet address, signature, and message are required'
        });
        return;
      }

      const result = await userService.loginWeb3({
        walletAddress,
        signature,
        message
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('[Auth] Web3 login error:', error);
      res.status(401).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  /**
   * POST /auth/refresh
   * Refresh access token
   */
  router.post('/refresh', async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Refresh token is required'
        });
        return;
      }

      const result = await userService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('[Auth] Refresh token error:', error);
      res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token'
      });
    }
  });

  /**
   * POST /auth/logout
   * Logout (invalidate session)
   */
  router.post('/logout', authenticateToken, async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (token) {
        await userService.logout(token);
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  /**
   * GET /auth/me
   * Get current user info
   */
  router.get('/me', authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
        return;
      }

      const user = await userService.getUserById(req.userId);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      // Remove sensitive fields
      const { password_hash, ...userWithoutPassword } = user;

      res.json({
        success: true,
        data: userWithoutPassword
      });
    } catch (error) {
      console.error('[Auth] Get user error:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  /**
   * PUT /auth/profile
   * Update user profile
   */
  router.put('/profile', authenticateToken, async (req: Request, res: Response) => {
    try {
      if (!req.userId) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
        return;
      }

      const { fullName, avatarUrl, bio, theme, language } = req.body;

      const updatedUser = await userService.updateProfile(req.userId, {
        fullName,
        avatarUrl,
        bio,
        theme,
        language
      });

      const { password_hash, ...userWithoutPassword } = updatedUser;

      res.json({
        success: true,
        data: userWithoutPassword
      });
    } catch (error) {
      console.error('[Auth] Update profile error:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  return router;
}
