/**
 * Oracle Adapter for UMA Integration
 * 集成 UMA 预言机用于验证比赛结果和争议解决
 */

import { ethers } from 'ethers';

export interface OracleRequest {
  identifier: string;
  timestamp: number;
  ancillaryData: string;
  bond: bigint;
}

export interface OracleResponse {
  requestId: string;
  resolvedPrice: bigint;
  resolvedTimestamp: number;
  disputeResolved: boolean;
}

export class OracleAdapter {
  private provider: ethers.JsonRpcProvider;
  private oracleContract: ethers.Contract;
  private finderContract: ethers.Contract;

  // UMA Optimistic Oracle V3 地址（Polygon Amoy）
  private readonly ORACLE_ADDRESS = '0x...'; // TODO: 填入实际地址
  private readonly FINDER_ADDRESS = '0x...'; // TODO: 填入实际地址

  // ABI 片段
  private readonly ORACLE_ABI = [
    'function requestPrice(bytes32 identifier, uint256 timestamp, bytes ancillaryData) external returns (uint256)',
    'function proposePrice(address requester, bytes32 identifier, uint256 timestamp, bytes ancillaryData, int256 proposedPrice) external returns (uint256)',
    'function disputePrice(address requester, bytes32 identifier, uint256 timestamp, bytes ancillaryData) external returns (uint256)',
    'function settle(address requester, bytes32 identifier, uint256 timestamp, bytes ancillaryData) external returns (int256)',
    'function hasPrice(address requester, bytes32 identifier, uint256 timestamp, bytes ancillaryData) external view returns (bool)',
    'function getRequest(address requester, bytes32 identifier, uint256 timestamp, bytes ancillaryData) external view returns (tuple(bool settled, int256 proposedPrice, int256 resolvedPrice, uint256 expirationTime, uint256 reward, uint256 finalFee, uint256 bond, address proposer, address disputer))',
    'event PriceRequested(address indexed requester, bytes32 indexed identifier, uint256 timestamp, bytes ancillaryData, uint256 reward)',
    'event PriceProposed(address indexed requester, bytes32 indexed identifier, uint256 timestamp, bytes ancillaryData, int256 proposedPrice, uint256 expirationTime, address proposer)',
    'event PriceDisputed(address indexed requester, bytes32 indexed identifier, uint256 timestamp, bytes ancillaryData, int256 proposedPrice, address disputer)',
    'event PriceSettled(address indexed requester, bytes32 indexed identifier, uint256 timestamp, bytes ancillaryData, int256 price)',
  ];

  constructor(
    rpcUrl: string = process.env.POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology',
    oracleAddress?: string,
    finderAddress?: string
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.oracleContract = new ethers.Contract(
      oracleAddress || this.ORACLE_ADDRESS,
      this.ORACLE_ABI,
      this.provider
    );
    // Finder 合约用于获取其他 UMA 合约地址
    this.finderContract = new ethers.Contract(
      finderAddress || this.FINDER_ADDRESS,
      ['function getImplementationAddress(bytes32 interfaceName) external view returns (address)'],
      this.provider
    );
  }

  /**
   * 请求预言机验证市场结果
   */
  async requestMarketOutcome(
    marketId: string,
    gameId: string,
    question: string,
    timestamp: number
  ): Promise<string> {
    const signer = await this.getSigner();
    const contractWithSigner = this.oracleContract.connect(signer);

    // 构建 ancillaryData（包含问题和市场信息）
    const ancillaryData = this.buildAncillaryData({
      marketId,
      gameId,
      question,
    });

    // 标识符（YES_OR_NO_QUERY）
    const identifier = ethers.id('YES_OR_NO_QUERY');

    try {
      const tx = await contractWithSigner.requestPrice(
        identifier,
        timestamp,
        ancillaryData
      );

      const receipt = await tx.wait();
      console.log(`[Oracle] Price request submitted: ${receipt.hash}`);

      return receipt.hash;
    } catch (error) {
      console.error('[Oracle] Failed to request price:', error);
      throw error;
    }
  }

  /**
   * 提出价格（结果）
   */
  async proposePrice(
    requester: string,
    marketId: string,
    gameId: string,
    question: string,
    timestamp: number,
    outcome: boolean // true = YES won, false = NO won
  ): Promise<string> {
    const signer = await this.getSigner();
    const contractWithSigner = this.oracleContract.connect(signer);

    const ancillaryData = this.buildAncillaryData({
      marketId,
      gameId,
      question,
    });
    const identifier = ethers.id('YES_OR_NO_QUERY');
    const proposedPrice = outcome ? ethers.parseEther('1') : ethers.parseEther('0');

    try {
      const tx = await contractWithSigner.proposePrice(
        requester,
        identifier,
        timestamp,
        ancillaryData,
        proposedPrice
      );

      const receipt = await tx.wait();
      console.log(`[Oracle] Price proposed: ${receipt.hash}`);

      return receipt.hash;
    } catch (error) {
      console.error('[Oracle] Failed to propose price:', error);
      throw error;
    }
  }

  /**
   * 发起争议
   */
  async disputePrice(
    requester: string,
    marketId: string,
    gameId: string,
    question: string,
    timestamp: number
  ): Promise<string> {
    const signer = await this.getSigner();
    const contractWithSigner = this.oracleContract.connect(signer);

    const ancillaryData = this.buildAncillaryData({
      marketId,
      gameId,
      question,
    });
    const identifier = ethers.id('YES_OR_NO_QUERY');

    try {
      const tx = await contractWithSigner.disputePrice(
        requester,
        identifier,
        timestamp,
        ancillaryData
      );

      const receipt = await tx.wait();
      console.log(`[Oracle] Price disputed: ${receipt.hash}`);

      return receipt.hash;
    } catch (error) {
      console.error('[Oracle] Failed to dispute price:', error);
      throw error;
    }
  }

  /**
   * 结算请求（获取最终结果）
   */
  async settleRequest(
    requester: string,
    marketId: string,
    gameId: string,
    question: string,
    timestamp: number
  ): Promise<boolean> {
    const signer = await this.getSigner();
    const contractWithSigner = this.oracleContract.connect(signer);

    const ancillaryData = this.buildAncillaryData({
      marketId,
      gameId,
      question,
    });
    const identifier = ethers.id('YES_OR_NO_QUERY');

    try {
      const tx = await contractWithSigner.settle(
        requester,
        identifier,
        timestamp,
        ancillaryData
      );

      const receipt = await tx.wait();
      console.log(`[Oracle] Request settled: ${receipt.hash}`);

      // 从事件日志中提取结果
      const settledEvent = receipt.logs.find(
        (log: any) => log.eventName === 'PriceSettled'
      );

      if (settledEvent) {
        const price = settledEvent.args.price;
        return price > 0; // 1 = YES, 0 = NO
      }

      throw new Error('Settlement event not found');
    } catch (error) {
      console.error('[Oracle] Failed to settle request:', error);
      throw error;
    }
  }

  /**
   * 检查是否有可用的价格
   */
  async hasPrice(
    requester: string,
    marketId: string,
    gameId: string,
    question: string,
    timestamp: number
  ): Promise<boolean> {
    const ancillaryData = this.buildAncillaryData({
      marketId,
      gameId,
      question,
    });
    const identifier = ethers.id('YES_OR_NO_QUERY');

    try {
      return await this.oracleContract.hasPrice(
        requester,
        identifier,
        timestamp,
        ancillaryData
      );
    } catch (error) {
      console.error('[Oracle] Failed to check price availability:', error);
      return false;
    }
  }

  /**
   * 获取请求详情
   */
  async getRequest(
    requester: string,
    marketId: string,
    gameId: string,
    question: string,
    timestamp: number
  ): Promise<any> {
    const ancillaryData = this.buildAncillaryData({
      marketId,
      gameId,
      question,
    });
    const identifier = ethers.id('YES_OR_NO_QUERY');

    try {
      const request = await this.oracleContract.getRequest(
        requester,
        identifier,
        timestamp,
        ancillaryData
      );

      return {
        settled: request.settled,
        proposedPrice: request.proposedPrice.toString(),
        resolvedPrice: request.resolvedPrice.toString(),
        expirationTime: Number(request.expirationTime),
        reward: request.reward.toString(),
        finalFee: request.finalFee.toString(),
        bond: request.bond.toString(),
        proposer: request.proposer,
        disputer: request.disputer,
      };
    } catch (error) {
      console.error('[Oracle] Failed to get request:', error);
      throw error;
    }
  }

  /**
   * 订阅预言机事件
   */
  async subscribeToEvents(
    callback: (eventType: string, eventData: any) => void
  ): Promise<void> {
    // 监听 PriceRequested 事件
    this.oracleContract.on('PriceRequested', (requester, identifier, timestamp, ancillaryData, reward, event) => {
      callback('PriceRequested', {
        requester,
        identifier,
        timestamp: Number(timestamp),
        ancillaryData,
        reward: reward.toString(),
        txHash: event.log.transactionHash,
      });
    });

    // 监听 PriceProposed 事件
    this.oracleContract.on('PriceProposed', (requester, identifier, timestamp, ancillaryData, proposedPrice, expirationTime, proposer, event) => {
      callback('PriceProposed', {
        requester,
        identifier,
        timestamp: Number(timestamp),
        ancillaryData,
        proposedPrice: proposedPrice.toString(),
        expirationTime: Number(expirationTime),
        proposer,
        txHash: event.log.transactionHash,
      });
    });

    // 监听 PriceDisputed 事件
    this.oracleContract.on('PriceDisputed', (requester, identifier, timestamp, ancillaryData, proposedPrice, disputer, event) => {
      callback('PriceDisputed', {
        requester,
        identifier,
        timestamp: Number(timestamp),
        ancillaryData,
        proposedPrice: proposedPrice.toString(),
        disputer,
        txHash: event.log.transactionHash,
      });
    });

    // 监听 PriceSettled 事件
    this.oracleContract.on('PriceSettled', (requester, identifier, timestamp, ancillaryData, price, event) => {
      callback('PriceSettled', {
        requester,
        identifier,
        timestamp: Number(timestamp),
        ancillaryData,
        price: price.toString(),
        outcome: price > 0,
        txHash: event.log.transactionHash,
      });
    });

    console.log('[Oracle] Subscribed to all events');
  }

  /**
   * 构建 ancillaryData
   */
  private buildAncillaryData(data: {
    marketId: string;
    gameId: string;
    question: string;
  }): string {
    const jsonData = {
      marketId: data.marketId,
      gameId: data.gameId,
      question: data.question,
      source: 'NBA_INTEGRITY_GUARD',
      timestamp: Math.floor(Date.now() / 1000),
    };

    return ethers.toUtf8Bytes(JSON.stringify(jsonData));
  }

  /**
   * 获取 Signer（从环境变量）
   */
  private async getSigner(): Promise<ethers.Wallet> {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('PRIVATE_KEY not set in environment');
    }

    return new ethers.Wallet(privateKey, this.provider);
  }

  /**
   * 估算 Bond 金额
   */
  async estimateBond(): Promise<bigint> {
    // 从 Store 合约获取最终费用
    // 简化处理：返回固定值
    return ethers.parseEther('100'); // 100 USDC bond
  }

  /**
   * 验证市场结果（包装方法）
   */
  async verifyMarketOutcome(
    marketId: string,
    gameId: string,
    question: string,
    claimedOutcome: boolean
  ): Promise<{
    isValid: boolean;
    oracleOutcome?: boolean;
    disputePending: boolean;
  }> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const requester = await this.getSigner().then((s) => s.address);

      // 检查是否已有价格
      const hasPriceAvailable = await this.hasPrice(
        requester,
        marketId,
        gameId,
        question,
        timestamp
      );

      if (!hasPriceAvailable) {
        console.log('[Oracle] No price available yet, requesting...');
        await this.requestMarketOutcome(marketId, gameId, question, timestamp);
        return {
          isValid: false,
          disputePending: true,
        };
      }

      // 获取请求详情
      const request = await this.getRequest(
        requester,
        marketId,
        gameId,
        question,
        timestamp
      );

      if (!request.settled) {
        return {
          isValid: false,
          disputePending: true,
        };
      }

      const oracleOutcome = BigInt(request.resolvedPrice) > 0;
      return {
        isValid: oracleOutcome === claimedOutcome,
        oracleOutcome,
        disputePending: false,
      };
    } catch (error) {
      console.error('[Oracle] Failed to verify outcome:', error);
      return {
        isValid: false,
        disputePending: false,
      };
    }
  }
}
