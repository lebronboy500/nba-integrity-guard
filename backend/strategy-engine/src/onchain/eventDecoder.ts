/**
 * Polymarket Event Decoder
 * 解析 Polygon 链上的 Polymarket 交易事件
 */

import { ethers, EventLog } from 'ethers';

export interface DecodedEvent {
  eventType: string;
  blockNumber: number;
  transactionHash: string;
  address: string;
  timestamp: number;
  data: Record<string, any>;
}

export interface OrderFilledEvent extends DecodedEvent {
  eventType: 'OrderFilled';
  data: {
    orderHash: string;
    maker: string;
    taker: string;
    tokenId: string;
    makerAsset: string;
    takerAsset: string;
    makerAmount: string;
    takerAmount: string;
    price: number;
    isBuy: boolean;
  };
}

export interface TokenTransferEvent extends DecodedEvent {
  eventType: 'TokenTransfer';
  data: {
    from: string;
    to: string;
    tokenId: string;
    amount: string;
  };
}

export interface MarketCreatedEvent extends DecodedEvent {
  eventType: 'MarketCreated';
  data: {
    marketId: string;
    question: string;
    outcomes: string[];
    tokenId: string;
    creator: string;
    initialOdds: number[];
  };
}

export class EventDecoder {
  private provider: ethers.JsonRpcProvider;
  private polymarketAddress: string;
  private ctfAddress: string; // Conditional Token Framework

  // ABI 片段用于解码事件
  private readonly POLYMARKET_ABI = [
    'event OrderFilled(bytes32 indexed orderHash, address indexed maker, address indexed taker, bytes32 tokenId, address makerAsset, address takerAsset, uint256 makerAmount, uint256 takerAmount)',
    'event MarketCreated(bytes32 indexed marketId, string question, address[] outcomes, bytes32 tokenId, address creator)',
  ];

  private readonly CTF_ABI = [
    'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
    'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)',
  ];

  constructor(
    rpcUrl: string = process.env.POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology',
    polymarketAddress: string = '0x4d97DCd97eB9859e653da19fc63A4b33633e53cb', // Amoy
    ctfAddress: string = '0xf86b02d36380d26e2137F4DB0b27FCa58A29aB38' // Amoy
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.polymarketAddress = polymarketAddress;
    this.ctfAddress = ctfAddress;
  }

  /**
   * 监听 OrderFilled 事件
   */
  async watchOrderFilledEvents(
    fromBlock: number = 'latest',
    toBlock?: number
  ): Promise<OrderFilledEvent[]> {
    try {
      const filter = {
        address: this.polymarketAddress,
        topics: [
          ethers.id('OrderFilled(bytes32,address,address,bytes32,address,address,uint256,uint256)'),
        ],
        fromBlock: typeof fromBlock === 'string' ? fromBlock : fromBlock,
        toBlock: toBlock || 'latest',
      };

      const logs = await this.provider.getLogs(filter);
      return await Promise.all(
        logs.map(async (log) => this.decodeOrderFilledEvent(log))
      );
    } catch (error) {
      console.error('Error watching OrderFilled events:', error);
      return [];
    }
  }

  /**
   * 监听 TokenTransfer 事件（CTF ERC1155）
   */
  async watchTokenTransferEvents(
    fromBlock: number = 'latest',
    toBlock?: number
  ): Promise<TokenTransferEvent[]> {
    try {
      const filter = {
        address: this.ctfAddress,
        topics: [
          ethers.id('TransferSingle(address,address,address,uint256,uint256)'),
        ],
        fromBlock: typeof fromBlock === 'string' ? fromBlock : fromBlock,
        toBlock: toBlock || 'latest',
      };

      const logs = await this.provider.getLogs(filter);
      return await Promise.all(
        logs.map(async (log) => this.decodeTokenTransferEvent(log))
      );
    } catch (error) {
      console.error('Error watching TokenTransfer events:', error);
      return [];
    }
  }

  /**
   * 解码 OrderFilled 事件
   */
  private async decodeOrderFilledEvent(log: EventLog): Promise<OrderFilledEvent> {
    const blockNumber = log.blockNumber;
    const block = await this.provider.getBlock(blockNumber);
    const timestamp = block?.timestamp || 0;

    // 手动解析事件数据
    const iface = new ethers.Interface(this.POLYMARKET_ABI);
    const decoded = iface.parseLog(log);

    if (!decoded) {
      throw new Error('Failed to decode OrderFilled event');
    }

    const makerAmount = BigInt(decoded.args[6]);
    const takerAmount = BigInt(decoded.args[7]);
    const price =
      Number(takerAmount) / (Number(makerAmount) + Number(takerAmount));

    return {
      eventType: 'OrderFilled',
      blockNumber,
      transactionHash: log.transactionHash,
      address: log.address,
      timestamp,
      data: {
        orderHash: decoded.args[0],
        maker: decoded.args[1],
        taker: decoded.args[2],
        tokenId: decoded.args[3],
        makerAsset: decoded.args[4],
        takerAsset: decoded.args[5],
        makerAmount: makerAmount.toString(),
        takerAmount: takerAmount.toString(),
        price,
        isBuy: takerAmount > makerAmount,
      },
    };
  }

  /**
   * 解码 TokenTransfer 事件
   */
  private async decodeTokenTransferEvent(
    log: EventLog
  ): Promise<TokenTransferEvent> {
    const blockNumber = log.blockNumber;
    const block = await this.provider.getBlock(blockNumber);
    const timestamp = block?.timestamp || 0;

    const iface = new ethers.Interface(this.CTF_ABI);
    const decoded = iface.parseLog(log);

    if (!decoded) {
      throw new Error('Failed to decode TokenTransfer event');
    }

    return {
      eventType: 'TokenTransfer',
      blockNumber,
      transactionHash: log.transactionHash,
      address: log.address,
      timestamp,
      data: {
        from: decoded.args[1],
        to: decoded.args[2],
        tokenId: decoded.args[3].toString(),
        amount: decoded.args[4].toString(),
      },
    };
  }

  /**
   * 获取最近N个区块的所有交易事件
   */
  async getRecentTradeEvents(blockCount: number = 100): Promise<{
    orderFilled: OrderFilledEvent[];
    tokenTransfers: TokenTransferEvent[];
  }> {
    const currentBlock = await this.provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - blockCount);

    const [orderFilled, tokenTransfers] = await Promise.all([
      this.watchOrderFilledEvents(fromBlock, currentBlock),
      this.watchTokenTransferEvents(fromBlock, currentBlock),
    ]);

    return { orderFilled, tokenTransfers };
  }

  /**
   * 订阅实时事件
   */
  subscribeToOrderFilledEvents(
    callback: (event: OrderFilledEvent) => void
  ): ethers.EventFilter {
    const filter = {
      address: this.polymarketAddress,
      topics: [
        ethers.id('OrderFilled(bytes32,address,address,bytes32,address,address,uint256,uint256)'),
      ],
    };

    this.provider.on(filter, async (log) => {
      try {
        const event = await this.decodeOrderFilledEvent(log as EventLog);
        callback(event);
      } catch (error) {
        console.error('Error processing OrderFilled event:', error);
      }
    });

    return filter;
  }

  /**
   * 获取特定交易地址的所有历史交易
   */
  async getAddressTrades(
    address: string,
    fromBlock: number = 0
  ): Promise<OrderFilledEvent[]> {
    try {
      // 查询该地址作为 maker
      const makerFilter = {
        address: this.polymarketAddress,
        topics: [
          ethers.id('OrderFilled(bytes32,address,address,bytes32,address,address,uint256,uint256)'),
          null, // orderHash
          ethers.zeroPadValue(address, 32),
        ],
        fromBlock,
        toBlock: 'latest',
      };

      // 查询该地址作为 taker
      const takerFilter = {
        address: this.polymarketAddress,
        topics: [
          ethers.id('OrderFilled(bytes32,address,address,bytes32,address,address,uint256,uint256)'),
          null, // orderHash
          null, // maker
          ethers.zeroPadValue(address, 32),
        ],
        fromBlock,
        toBlock: 'latest',
      };

      const [makerLogs, takerLogs] = await Promise.all([
        this.provider.getLogs(makerFilter),
        this.provider.getLogs(takerFilter),
      ]);

      const allLogs = [...makerLogs, ...takerLogs];
      const decodedEvents = await Promise.all(
        allLogs.map((log) => this.decodeOrderFilledEvent(log as EventLog))
      );

      // 按时间排序
      return decodedEvents.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('Error fetching address trades:', error);
      return [];
    }
  }

  /**
   * 计算代币 ID（Polymarket 中 YES/NO token 的ID）
   */
  static calculateTokenId(marketId: string, outcomeIndex: number): string {
    // Polymarket 使用 Conditional Token Framework
    // tokenId = keccak256(abi.encode(conditionId, outcomeIndex))
    return ethers.solidityPacked(
      ['bytes32', 'uint256'],
      [marketId, outcomeIndex]
    );
  }

  /**
   * 验证交易签名（用于离链数据）
   */
  static verifyOrderSignature(
    orderHash: string,
    signature: string,
    maker: string
  ): boolean {
    try {
      const recovered = ethers.recoverAddress(orderHash, signature);
      return recovered.toLowerCase() === maker.toLowerCase();
    } catch {
      return false;
    }
  }
}
