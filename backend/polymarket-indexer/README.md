# Polymarket Indexer - Week 1 Implementation

## Overview

This module implements Polymarket chain data decoding and indexing for NBA Integrity Guard.

**Week 1 Focus**: Polymarket Data Decoding Module

### Components

#### 1. Trade Decoder (`src/decoder/tradeDecoder.ts`)

Decodes Polymarket `OrderFilled` events from Polygon transactions.

**Features**:
- Extracts trade details from transaction logs
- Calculates price from USDC and token amounts
- Determines side (BUY/SELL) and outcome (YES/NO)
- Supports both CTF Exchange and NegRisk Exchange
- Batch scanning of blocks

**Key Methods**:
```typescript
async decodeTxHash(txHash: string): Promise<DecodedTrade[]>
async scanBlocks(fromBlock: number, toBlock: number): Promise<DecodedTrade[]>
decodeLog(log: ethers.Log, blockNumber: number): DecodedTrade
```

**Exchange Addresses**:
- CTF Exchange: `0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E`
- NegRisk Exchange: `0xC5d563A36AE78145C45a50134d48A1215220f80a`

#### 2. Market Decoder (`src/decoder/marketDecoder.ts`)

Calculates YES/NO token IDs using Gnosis Conditional Token Framework.

**Features**:
- Calculates tokenId from conditionId
- Verifies against Gamma API data
- Determines outcome from tokenId
- Creates market parameters

**Key Methods**:
```typescript
calculateTokenIds(conditionId: string): TokenIdCalculation
verifyTokenIds(conditionId: string, gammaYesTokenId: string, gammaNoTokenId: string)
determineOutcome(tokenId: string, market): 'YES' | 'NO'
```

**Algorithm** (Gnosis CTF):
```
collectionId = keccak256(parentCollectionId, conditionId, indexSet)
tokenId = keccak256(collateralToken, collectionId)

For binary markets:
- YES: indexSet = 0b01 = 1
- NO:  indexSet = 0b10 = 2
```

#### 3. Gamma API Client (`src/api/gammaClient.ts`)

HTTP client for Polymarket Gamma API.

**Features**:
- Fetch events, markets, orderbooks, trades, prices
- Search and filter markets
- Health checks
- Automatic error handling and logging

**Key Methods**:
```typescript
async fetchEvent(slug: string): Promise<GammaEvent>
async fetchMarket(slug: string): Promise<GammaMarket>
async fetchMarketsByEvent(eventSlug: string): Promise<GammaMarket[]>
async fetchMarkets(options?): Promise<GammaMarket[]>
async fetchMarketOrderbook(marketSlug: string): Promise<any>
```

### Type Definitions

See `src/types/index.ts` for complete type definitions:
- `DecodedTrade` - Decoded trade details
- `MarketParams` - Market blockchain parameters
- `GammaMarket` - Gamma API market response
- `GammaEvent` - Gamma API event response
- Database schema types

### Usage Example

```typescript
import { TradeDecoder } from './decoder/tradeDecoder';
import { MarketDecoder } from './decoder/marketDecoder';
import { GammaClient } from './api/gammaClient';

// Initialize components
const tradeDecoder = new TradeDecoder(process.env.POLYGON_RPC_URL);
const marketDecoder = new MarketDecoder();
const gammaClient = new GammaClient();

// 1. Fetch market from Gamma API
const market = await gammaClient.fetchMarket('will-usd-be-devalued-before-2030');
console.log('Market:', market.title);

// 2. Create market parameters and verify tokenIds
const marketParams = marketDecoder.createMarketParams(
  market.conditionId,
  market.questionId,
  market.oracle,
  market.clobTokenIds
);

// 3. Decode a trade transaction
const trades = await tradeDecoder.decodeTxHash(
  '0x916cad96dd5c219997638133512fd17fe7c1ce72b830157e4fd5323cf4f19946'
);

// 4. Determine outcome
const outcome = marketDecoder.determineOutcome(
  trades[0].tokenId,
  { yes_token_id: marketParams.yesTokenId, no_token_id: marketParams.noTokenId }
);

console.log('Trade outcome:', outcome);
```

### Testing

Key test scenarios (to be implemented):

1. **Trade Decoder**:
   - Decode sample transaction with multiple OrderFilled events
   - Verify price calculations (USDC/token ratio)
   - Verify side determination (BUY/SELL)
   - Skip internal transfers (taker == exchange)

2. **Market Decoder**:
   - Calculate tokenIds and verify against Gamma data
   - Determine outcome from tokenId
   - Handle mismatches gracefully

3. **Gamma Client**:
   - Fetch events and markets
   - Search functionality
   - Error handling

### Next Steps (Week 2)

- Market Discovery Service - Store markets from Gamma in database
- Trades Indexer - Scan blocks and store decoded trades
- Query API - RESTful endpoints for querying indexed data

---

**Status**: ✅ Week 1 Complete
**Lines of Code**: ~600 (decoder + API client)
**Test Coverage**: Ready for integration tests
