/**
 * Payment Service Types
 * ERC-7962 Privacy Payment Interfaces
 */

export interface PaymentRequest {
  userId: number;
  amount: string; // in wei or token smallest unit
  currency: 'USDC' | 'USDT' | 'DAI' | 'ETH';
  purpose: 'subscription' | 'service_fee' | 'api_access' | 'data_license' | 'reward' | 'donation';
  description?: string;
  metadata?: Record<string, any>;
}

export interface PaymentAddress {
  oneTimeAddress: string; // ERC-7962 one-time public key address
  expiresAt: Date;
  used: boolean;
  purpose: string;
}

export interface PaymentRecord {
  id: number;
  userId: number;
  traderAddress?: string;
  amount: string;
  currency: string;
  purpose: string;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  oneTimeAddress: string;
  txHash?: string;
  createdAt: Date;
  completedAt?: Date;
  description?: string;
  metadata?: Record<string, any>;
}

export interface RewardRequest {
  traderAddress: string;
  amount: string;
  currency: 'USDC' | 'USDT' | 'DAI';
  reason: 'top_trader' | 'oracle_badge' | 'whale_badge' | 'veteran_badge' | 'referral' | 'contribution';
  description?: string;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  duration: number; // days
  price: string;
  currency: string;
  features: string[];
  active: boolean;
}

export interface UserSubscription {
  userId: number;
  planId: number;
  status: 'active' | 'expired' | 'cancelled';
  startDate: Date;
  endDate: Date;
  paymentId: number;
}

export interface ServiceFeeConfig {
  apiCallFee: string; // per 1000 calls
  dataAccessFee: string; // per month
  advancedAnalyticsFee: string; // per query
  currency: string;
}

export interface DataDanceConfig {
  apiKey: string;
  network: 'polygon-mainnet' | 'polygon-testnet' | 'ethereum-mainnet' | 'ethereum-sepolia';
  rpcUrl: string;
}
