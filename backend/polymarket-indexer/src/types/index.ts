/**
 * Type definitions for Polymarket Indexer
 */

// Trade-related types
export interface OrderFilledEvent {
  txHash: string;
  logIndex: number;
  blockNumber: number;
  blockTimestamp?: number;
  exchange: string;
  orderHash?: string;
  maker: string;
  taker: string;
  makerAssetId: string;
  takerAssetId: string;
  makerAmountFilled: string;
  takerAmountFilled: string;
  fee: string;
}

export interface DecodedTrade {
  txHash: string;
  logIndex: number;
  blockNumber: number;
  blockTimestamp?: number;
  exchange: string;
  orderHash?: string;
  maker: string;
  taker: string;
  makerAssetId: string;
  takerAssetId: string;
  makerAmount: string;
  takerAmount: string;
  fee: string;
  price: string;        // Calculated: USDC_amount / token_amount
  size: string;         // Token amount
  tokenId: string;      // Non-zero asset ID (YES or NO token)
  side: 'BUY' | 'SELL'; // BUY if makerAssetId=0, SELL if takerAssetId=0
  outcome?: 'YES' | 'NO'; // Set after market lookup
}

// Market-related types
export interface MarketParams {
  conditionId: string;
  questionId: string;
  oracle: string;
  collateralToken: string;
  yesTokenId: string;
  noTokenId: string;
}

export interface GammaMarket {
  slug: string;
  title: string;
  description?: string;
  conditionId: string;
  questionId: string;
  oracle: string;
  clobTokenIds: [string, string]; // [YES, NO]
  question: string;
  status: string;
  negRisk: boolean;
  category?: string;
  imageUrl?: string;
}

export interface GammaEvent {
  slug: string;
  title: string;
  description?: string;
  category?: string;
  status: string;
  negRisk: boolean;
  imageUrl?: string;
}

// Database schema types
export interface DatabaseEvent {
  id: number;
  slug: string;
  title: string;
  description?: string;
  category?: string;
  image_url?: string;
  enable_neg_risk: boolean;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface DatabaseMarket {
  id: number;
  event_id: number;
  slug: string;
  condition_id: string;
  question_id: string;
  oracle: string;
  collateral_token: string;
  yes_token_id: string;
  no_token_id: string;
  question: string;
  outcome_slot_count: number;
  status: string;
  enable_order_book: boolean;
  created_at: Date;
  updated_at: Date;
  closed_at?: Date;
  resolved_at?: Date;
}

export interface DatabaseTrade {
  id: number;
  market_id: number;
  user_id?: number;
  tx_hash: string;
  log_index: number;
  block_number: number;
  block_timestamp: Date;
  exchange: string;
  order_hash?: string;
  maker: string;
  taker: string;
  maker_asset_id: string;
  taker_asset_id: string;
  maker_amount: string;
  taker_amount: string;
  fee: string;
  price: string;
  size: string;
  side: 'BUY' | 'SELL';
  outcome: 'YES' | 'NO';
  token_id: string;
  created_at: Date;
}

export interface SyncState {
  id: number;
  key: string;
  last_block: number;
  last_block_hash?: string;
  updated_at: Date;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Calculation results
export interface TokenIdCalculation {
  yesTokenId: string;
  noTokenId: string;
}

export interface PriceCalculation {
  price: string;
  tokenId: string;
  side: 'BUY' | 'SELL';
}
