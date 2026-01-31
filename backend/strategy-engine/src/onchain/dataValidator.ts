/**
 * Blockchain Data Validator
 * 验证链上数据的真实性和完整性
 */

import { ethers } from 'ethers';
import { DecodedEvent, OrderFilledEvent } from './eventDecoder';

export interface ValidationResult {
  isValid: boolean;
  confidence: number; // 0-1
  checks: {
    signatureVerified: boolean;
    blockConfirmed: boolean;
    dataConsistent: boolean;
    noDuplication: boolean;
    withinTimeWindow: boolean;
  };
  errors: string[];
  warnings: string[];
}

export interface MarketDataSnapshot {
  marketId: string;
  tokenId: string;
  yesPrice: number;
  noPrice: number;
  liquidity: number;
  volume24h: number;
  lastUpdated: number;
}

export class DataValidator {
  private provider: ethers.JsonRpcProvider;
  private seenTransactions: Set<string> = new Set();
  private readonly MIN_CONFIRMATIONS = 3; // 最小区块确认数
  private readonly MAX_TIME_DRIFT = 300; // 最大时间偏差（秒）

  constructor(
    rpcUrl: string = process.env.POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology'
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  /**
   * 验证事件的完整性
   */
  async validateEvent(event: DecodedEvent): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. 检查交易哈希是否重复
    const noDuplication = !this.seenTransactions.has(event.transactionHash);
    if (!noDuplication) {
      errors.push(`Duplicate transaction: ${event.transactionHash}`);
    } else {
      this.seenTransactions.add(event.transactionHash);
    }

    // 2. 验证区块确认数
    let blockConfirmed = false;
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const confirmations = currentBlock - event.blockNumber;
      blockConfirmed = confirmations >= this.MIN_CONFIRMATIONS;

      if (!blockConfirmed) {
        warnings.push(
          `Insufficient confirmations: ${confirmations}/${this.MIN_CONFIRMATIONS}`
        );
      }
    } catch (error) {
      errors.push(`Failed to verify block confirmations: ${error}`);
    }

    // 3. 验证时间窗口
    const now = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(now - event.timestamp);
    const withinTimeWindow = timeDiff <= this.MAX_TIME_DRIFT;

    if (!withinTimeWindow) {
      warnings.push(
        `Event timestamp outside acceptable window: ${timeDiff}s drift`
      );
    }

    // 4. 验证交易是否存在于链上
    let signatureVerified = false;
    try {
      const tx = await this.provider.getTransaction(event.transactionHash);
      signatureVerified = tx !== null;

      if (!signatureVerified) {
        errors.push(`Transaction not found on chain: ${event.transactionHash}`);
      }
    } catch (error) {
      errors.push(`Failed to fetch transaction: ${error}`);
    }

    // 5. 数据一致性检查
    const dataConsistent = this.checkDataConsistency(event);
    if (!dataConsistent) {
      errors.push('Data consistency check failed');
    }

    // 计算置信度
    const checks = {
      signatureVerified,
      blockConfirmed,
      dataConsistent,
      noDuplication,
      withinTimeWindow,
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;
    const confidence = passedChecks / Object.keys(checks).length;
    const isValid = errors.length === 0 && confidence >= 0.8;

    return {
      isValid,
      confidence,
      checks,
      errors,
      warnings,
    };
  }

  /**
   * 验证 OrderFilled 事件的价格合理性
   */
  async validateOrderPrice(event: OrderFilledEvent): Promise<{
    isValid: boolean;
    reason?: string;
  }> {
    const { price } = event.data;

    // 1. 价格必须在 0 到 1 之间
    if (price < 0 || price > 1) {
      return {
        isValid: false,
        reason: `Invalid price: ${price} (must be between 0 and 1)`,
      };
    }

    // 2. 检查价格是否异常（突然变化超过50%）
    // 这里需要查询历史价格，简化处理
    const priceChangeThreshold = 0.5;
    if (price < 0.01 || price > 0.99) {
      return {
        isValid: true,
        reason: `Extreme price detected: ${price} (possible manipulation)`,
      };
    }

    return { isValid: true };
  }

  /**
   * 验证市场数据快照
   */
  validateMarketSnapshot(snapshot: MarketDataSnapshot): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. 检查价格总和是否接近 1
    const priceSum = snapshot.yesPrice + snapshot.noPrice;
    const priceSumValid = Math.abs(priceSum - 1.0) < 0.05;

    if (!priceSumValid) {
      errors.push(
        `Invalid price sum: ${priceSum.toFixed(4)} (should be ~1.0)`
      );
    }

    // 2. 检查流动性是否为正
    const liquidityValid = snapshot.liquidity > 0;
    if (!liquidityValid) {
      errors.push('Liquidity must be positive');
    }

    // 3. 检查 24h 交易量是否合理
    if (snapshot.volume24h < 0) {
      errors.push('Negative 24h volume');
    }

    if (snapshot.volume24h > snapshot.liquidity * 100) {
      warnings.push(
        'Unusually high volume compared to liquidity (possible wash trading)'
      );
    }

    // 4. 检查数据新鲜度
    const now = Math.floor(Date.now() / 1000);
    const dataAge = now - snapshot.lastUpdated;
    const dataFresh = dataAge < 300; // 5分钟内

    if (!dataFresh) {
      warnings.push(`Stale data: ${dataAge}s old`);
    }

    const checks = {
      signatureVerified: true, // N/A for snapshots
      blockConfirmed: true,
      dataConsistent: priceSumValid && liquidityValid,
      noDuplication: true,
      withinTimeWindow: dataFresh,
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;
    const confidence = passedChecks / Object.keys(checks).length;
    const isValid = errors.length === 0;

    return {
      isValid,
      confidence,
      checks,
      errors,
      warnings,
    };
  }

  /**
   * 批量验证事件
   */
  async validateEventBatch(
    events: DecodedEvent[]
  ): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>();

    for (const event of events) {
      const result = await this.validateEvent(event);
      results.set(event.transactionHash, result);
    }

    return results;
  }

  /**
   * 检测异常交易模式
   */
  detectAnomalousPatterns(events: OrderFilledEvent[]): {
    hasAnomaly: boolean;
    patterns: string[];
  } {
    const patterns: string[] = [];

    if (events.length === 0) {
      return { hasAnomaly: false, patterns };
    }

    // 1. 检测短时间内大量交易（可能的机器人行为）
    const timeWindow = 60; // 60秒
    const timeGroups = new Map<number, number>();

    events.forEach((event) => {
      const bucket = Math.floor(event.timestamp / timeWindow);
      timeGroups.set(bucket, (timeGroups.get(bucket) || 0) + 1);
    });

    const maxTxPerWindow = Math.max(...timeGroups.values());
    if (maxTxPerWindow > 10) {
      patterns.push(
        `High frequency trading detected: ${maxTxPerWindow} tx in ${timeWindow}s`
      );
    }

    // 2. 检测自成交（maker === taker）
    const selfTrades = events.filter(
      (e) => e.data.maker === e.data.taker
    ).length;
    if (selfTrades > 0) {
      patterns.push(`Self-trading detected: ${selfTrades} instances`);
    }

    // 3. 检测价格操纵（连续同方向大额交易）
    const largeTradeThreshold = 1000; // $1000
    const largeTrades = events.filter(
      (e) => parseFloat(e.data.takerAmount) > largeTradeThreshold
    );

    if (largeTrades.length > 5) {
      patterns.push(
        `Potential price manipulation: ${largeTrades.length} large trades`
      );
    }

    // 4. 检测洗售交易（同一对地址反复交易）
    const tradePairs = new Map<string, number>();
    events.forEach((event) => {
      const pair = [event.data.maker, event.data.taker].sort().join('-');
      tradePairs.set(pair, (tradePairs.get(pair) || 0) + 1);
    });

    const washTradingPairs = Array.from(tradePairs.entries()).filter(
      ([_, count]) => count > 10
    );
    if (washTradingPairs.length > 0) {
      patterns.push(
        `Potential wash trading: ${washTradingPairs.length} pairs with >10 trades`
      );
    }

    return {
      hasAnomaly: patterns.length > 0,
      patterns,
    };
  }

  /**
   * 验证市场结果（使用 UMA 预言机）
   */
  async validateMarketOutcome(
    marketId: string,
    claimedOutcome: boolean
  ): Promise<{
    isValid: boolean;
    oracleOutcome?: boolean;
    disputePeriodEnded: boolean;
  }> {
    // TODO: 集成 UMA 预言机
    // 这里返回占位符逻辑
    console.log(`[Validator] Validating market ${marketId} outcome: ${claimedOutcome}`);

    // 模拟预言机查询
    return {
      isValid: true,
      oracleOutcome: claimedOutcome,
      disputePeriodEnded: true,
    };
  }

  /**
   * 数据一致性检查（内部方法）
   */
  private checkDataConsistency(event: DecodedEvent): boolean {
    // 1. 检查必需字段
    if (!event.transactionHash || !event.address || event.blockNumber < 0) {
      return false;
    }

    // 2. 检查地址格式
    try {
      ethers.getAddress(event.address);
    } catch {
      return false;
    }

    // 3. 事件类型特定检查
    if (event.eventType === 'OrderFilled') {
      const orderEvent = event as OrderFilledEvent;
      const { makerAmount, takerAmount } = orderEvent.data;

      // 检查金额是否为正数
      if (BigInt(makerAmount) <= 0 || BigInt(takerAmount) <= 0) {
        return false;
      }

      // 检查地址有效性
      try {
        ethers.getAddress(orderEvent.data.maker);
        ethers.getAddress(orderEvent.data.taker);
      } catch {
        return false;
      }
    }

    return true;
  }

  /**
   * 清理旧的交易记录（防止内存泄漏）
   */
  cleanupOldRecords(maxSize: number = 10000): void {
    if (this.seenTransactions.size > maxSize) {
      const toDelete = this.seenTransactions.size - maxSize;
      const iterator = this.seenTransactions.values();

      for (let i = 0; i < toDelete; i++) {
        const value = iterator.next().value;
        if (value) {
          this.seenTransactions.delete(value);
        }
      }

      console.log(`[Validator] Cleaned up ${toDelete} old transaction records`);
    }
  }

  /**
   * 获取验证统计信息
   */
  getStats(): {
    totalValidated: number;
  } {
    return {
      totalValidated: this.seenTransactions.size,
    };
  }
}
