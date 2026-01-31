/**
 * On-chain Data Processing Module
 * 链上数据解码、验证和预言机集成
 */

export { EventDecoder, DecodedEvent, OrderFilledEvent, TokenTransferEvent, MarketCreatedEvent } from './eventDecoder';
export { DataValidator, ValidationResult, MarketDataSnapshot } from './dataValidator';
export { OracleAdapter, OracleRequest, OracleResponse } from './oracleAdapter';
