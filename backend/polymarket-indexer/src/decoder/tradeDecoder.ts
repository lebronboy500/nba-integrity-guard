/**
 * Trade Decoder
 * Decodes Polymarket OrderFilled events from transaction receipts
 */

import { ethers } from 'ethers';
import {
  OrderFilledEvent,
  DecodedTrade,
  PriceCalculation
} from '../types';

export class TradeDecoder {
  private provider: ethers.JsonRpcProvider;

  // Exchange addresses
  private readonly EXCHANGE_ADDRESSES = {
    CTF_EXCHANGE: '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E',
    NEGRISK_EXCHANGE: '0xC5d563A36AE78145C45a50134d48A1215220f80a'
  };

  // OrderFilled event signature
  // OrderFilled(bytes32 indexed orderHash, address indexed maker, address indexed taker,
  //             uint256 makerAssetId, uint256 takerAssetId, uint256 makerAmountFilled,
  //             uint256 takerAmountFilled, uint256 fee)
  private readonly ORDER_FILLED_TOPIC = ethers.id(
    'OrderFilled(bytes32,address,address,uint256,uint256,uint256,uint256,uint256)'
  );

  // USDC precision (6 decimals)
  private readonly USDC_DECIMALS = 6;

  constructor(rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  /**
   * Decode a transaction hash to extract all OrderFilled events
   */
  async decodeTxHash(txHash: string): Promise<DecodedTrade[]> {
    try {
      console.log(`[TradeDecoder] Decoding transaction: ${txHash}`);

      // Get transaction receipt
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt) {
        throw new Error(`Transaction not found: ${txHash}`);
      }

      // Filter OrderFilled events
      const orderFilledLogs = receipt.logs.filter(log =>
        log.topics[0] === this.ORDER_FILLED_TOPIC &&
        (log.address.toLowerCase() === this.EXCHANGE_ADDRESSES.CTF_EXCHANGE.toLowerCase() ||
         log.address.toLowerCase() === this.EXCHANGE_ADDRESSES.NEGRISK_EXCHANGE.toLowerCase())
      );

      console.log(`[TradeDecoder] Found ${orderFilledLogs.length} OrderFilled events`);

      // Decode each log
      const trades: DecodedTrade[] = [];
      for (const log of orderFilledLogs) {
        const decoded = this.decodeLog(log, receipt.blockNumber);

        // Skip if taker is the exchange (these are internal transfers)
        if (decoded.taker.toLowerCase() === log.address.toLowerCase()) {
          console.log(`[TradeDecoder] Skipping internal transfer (taker == exchange)`);
          continue;
        }

        trades.push(decoded);
      }

      return trades;
    } catch (error) {
      console.error(`[TradeDecoder] Error decoding tx ${txHash}:`, error);
      throw error;
    }
  }

  /**
   * Decode a single log entry
   */
  decodeLog(log: ethers.Log, blockNumber: number): DecodedTrade {
    // Parse topics
    const orderHash = log.topics[1]; // indexed bytes32
    const maker = ethers.getAddress('0x' + log.topics[2].slice(26)); // indexed address
    const taker = ethers.getAddress('0x' + log.topics[3].slice(26)); // indexed address

    // Parse data (non-indexed parameters)
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    const decoded = abiCoder.decode(
      ['uint256', 'uint256', 'uint256', 'uint256', 'uint256'],
      log.data
    );

    const makerAssetId = decoded[0].toString();
    const takerAssetId = decoded[1].toString();
    const makerAmountFilled = decoded[2].toString();
    const takerAmountFilled = decoded[3].toString();
    const fee = decoded[4].toString();

    // Calculate price, tokenId, and side
    const { price, tokenId, side } = this.calculatePrice(
      makerAssetId,
      takerAssetId,
      makerAmountFilled,
      takerAmountFilled
    );

    // Determine size (token amount, not USDC amount)
    const size = side === 'BUY' ? takerAmountFilled : makerAmountFilled;

    return {
      txHash: log.transactionHash,
      logIndex: log.index,
      blockNumber,
      exchange: log.address,
      orderHash,
      maker,
      taker,
      makerAssetId,
      takerAssetId,
      makerAmount: makerAmountFilled,
      takerAmount: takerAmountFilled,
      fee,
      price,
      size,
      tokenId,
      side
    };
  }

  /**
   * Calculate price, tokenId, and side from asset IDs and amounts
   *
   * Logic:
   * - If makerAssetId = 0: Maker is providing USDC -> BUY
   * - If takerAssetId = 0: Taker is providing USDC -> SELL
   */
  private calculatePrice(
    makerAssetId: string,
    takerAssetId: string,
    makerAmount: string,
    takerAmount: string
  ): PriceCalculation {
    const ZERO_ASSET = '0';

    if (makerAssetId === ZERO_ASSET) {
      // BUY: maker provides USDC, taker provides tokens
      const price = this.formatPrice(
        BigInt(makerAmount),
        BigInt(takerAmount)
      );

      return {
        price,
        tokenId: takerAssetId,
        side: 'BUY'
      };
    } else if (takerAssetId === ZERO_ASSET) {
      // SELL: taker provides USDC, maker provides tokens
      const price = this.formatPrice(
        BigInt(takerAmount),
        BigInt(makerAmount)
      );

      return {
        price,
        tokenId: makerAssetId,
        side: 'SELL'
      };
    } else {
      throw new Error(`Invalid asset IDs: neither makerAssetId nor takerAssetId is 0 (USDC)`);
    }
  }

  /**
   * Format price from USDC amount and token amount
   * Price = USDC_amount / token_amount
   *
   * Note: Both USDC and tokens use 6 decimals, so we can divide directly
   */
  private formatPrice(usdcAmount: bigint, tokenAmount: bigint): string {
    if (tokenAmount === 0n) {
      throw new Error('Token amount cannot be zero');
    }

    // Convert to human-readable format (divide by 1e6)
    const usdcFloat = Number(usdcAmount) / 10 ** this.USDC_DECIMALS;
    const tokenFloat = Number(tokenAmount) / 10 ** this.USDC_DECIMALS;

    const price = usdcFloat / tokenFloat;

    // Return price with 6 decimal places
    return price.toFixed(6);
  }

  /**
   * Get block timestamp for a given block number
   */
  async getBlockTimestamp(blockNumber: number): Promise<number> {
    const block = await this.provider.getBlock(blockNumber);
    if (!block) {
      throw new Error(`Block ${blockNumber} not found`);
    }
    return block.timestamp;
  }

  /**
   * Scan blocks for OrderFilled events
   */
  async scanBlocks(fromBlock: number, toBlock: number): Promise<DecodedTrade[]> {
    console.log(`[TradeDecoder] Scanning blocks ${fromBlock} - ${toBlock}...`);

    const logs = await this.provider.getLogs({
      address: [
        this.EXCHANGE_ADDRESSES.CTF_EXCHANGE,
        this.EXCHANGE_ADDRESSES.NEGRISK_EXCHANGE
      ],
      topics: [this.ORDER_FILLED_TOPIC],
      fromBlock,
      toBlock
    });

    console.log(`[TradeDecoder] Found ${logs.length} OrderFilled events`);

    // Decode logs
    const trades: DecodedTrade[] = [];
    for (const log of logs) {
      try {
        const decoded = this.decodeLog(log, log.blockNumber);

        // Skip internal transfers
        if (decoded.taker.toLowerCase() === log.address.toLowerCase()) {
          continue;
        }

        trades.push(decoded);
      } catch (error) {
        console.error(`[TradeDecoder] Error decoding log at block ${log.blockNumber}:`, error);
      }
    }

    return trades;
  }

  /**
   * Get current block number
   */
  async getCurrentBlock(): Promise<number> {
    return await this.provider.getBlockNumber();
  }
}
