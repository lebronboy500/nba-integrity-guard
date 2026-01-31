/**
 * Market Decoder
 * Calculates YES/NO token IDs from conditionId using Gnosis Conditional Token Framework
 */

import { ethers } from 'ethers';
import { MarketParams, TokenIdCalculation } from '../types';

export class MarketDecoder {
  // Polygon USDC address (USDC.e)
  private readonly USDC_ADDRESS = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';

  // Parent collection ID (bytes32(0) for root level)
  private readonly PARENT_COLLECTION_ID = '0x' + '0'.repeat(64);

  constructor() {}

  /**
   * Calculate YES and NO token IDs from a conditionId
   *
   * Gnosis Conditional Token Framework:
   * 1. collectionId = keccak256(parentCollectionId, conditionId, indexSet)
   * 2. tokenId = keccak256(collateralToken, collectionId)
   *
   * For binary markets:
   * - YES: indexSet = 0b01 = 1
   * - NO:  indexSet = 0b10 = 2
   */
  calculateTokenIds(conditionId: string): TokenIdCalculation {
    // Calculate YES collection ID
    const collectionIdYes = this.calculateCollectionId(conditionId, 1);

    // Calculate NO collection ID
    const collectionIdNo = this.calculateCollectionId(conditionId, 2);

    // Calculate token IDs
    const yesTokenId = this.calculateTokenId(collectionIdYes);
    const noTokenId = this.calculateTokenId(collectionIdNo);

    return {
      yesTokenId,
      noTokenId
    };
  }

  /**
   * Calculate collection ID
   * collectionId = keccak256(parentCollectionId, conditionId, indexSet)
   */
  private calculateCollectionId(conditionId: string, indexSet: number): string {
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();

    const encoded = abiCoder.encode(
      ['bytes32', 'bytes32', 'uint256'],
      [this.PARENT_COLLECTION_ID, conditionId, indexSet]
    );

    return ethers.keccak256(encoded);
  }

  /**
   * Calculate token ID
   * tokenId = keccak256(collateralToken, collectionId)
   */
  private calculateTokenId(collectionId: string): string {
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();

    const encoded = abiCoder.encode(
      ['address', 'bytes32'],
      [this.USDC_ADDRESS, collectionId]
    );

    return ethers.keccak256(encoded);
  }

  /**
   * Verify token IDs against Gamma API data
   */
  verifyTokenIds(
    conditionId: string,
    gammaYesTokenId: string,
    gammaNoTokenId: string
  ): { isValid: boolean; localYesTokenId: string; localNoTokenId: string } {
    const { yesTokenId, noTokenId } = this.calculateTokenIds(conditionId);

    const isValid =
      yesTokenId.toLowerCase() === gammaYesTokenId.toLowerCase() &&
      noTokenId.toLowerCase() === gammaNoTokenId.toLowerCase();

    if (!isValid) {
      console.warn(`⚠️  TokenId mismatch for conditionId ${conditionId}`);
      console.warn(`   Local YES: ${yesTokenId}`);
      console.warn(`   Gamma YES: ${gammaYesTokenId}`);
      console.warn(`   Local NO:  ${noTokenId}`);
      console.warn(`   Gamma NO:  ${gammaNoTokenId}`);
    }

    return {
      isValid,
      localYesTokenId: yesTokenId,
      localNoTokenId: noTokenId
    };
  }

  /**
   * Create market parameters from Gamma API data
   */
  createMarketParams(
    conditionId: string,
    questionId: string,
    oracle: string,
    gammaTokenIds?: [string, string]
  ): MarketParams {
    const { yesTokenId, noTokenId } = this.calculateTokenIds(conditionId);

    // Verify against Gamma if provided
    if (gammaTokenIds) {
      const verification = this.verifyTokenIds(conditionId, gammaTokenIds[0], gammaTokenIds[1]);
      if (!verification.isValid) {
        console.error(`❌ TokenId verification failed for conditionId ${conditionId}`);
      }
    }

    return {
      conditionId,
      questionId,
      oracle,
      collateralToken: this.USDC_ADDRESS,
      yesTokenId,
      noTokenId
    };
  }

  /**
   * Calculate conditionId from oracle, questionId, and outcomeSlotCount
   * conditionId = keccak256(oracle, questionId, outcomeSlotCount)
   *
   * Note: This is useful for verifying conditionId from event logs
   */
  calculateConditionId(
    oracle: string,
    questionId: string,
    outcomeSlotCount: number = 2
  ): string {
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();

    const encoded = abiCoder.encode(
      ['address', 'bytes32', 'uint256'],
      [oracle, questionId, outcomeSlotCount]
    );

    return ethers.keccak256(encoded);
  }

  /**
   * Determine outcome (YES or NO) from tokenId and market params
   */
  determineOutcome(tokenId: string, market: { yes_token_id: string; no_token_id: string }): 'YES' | 'NO' {
    const tokenIdLower = tokenId.toLowerCase();

    if (tokenIdLower === market.yes_token_id.toLowerCase()) {
      return 'YES';
    } else if (tokenIdLower === market.no_token_id.toLowerCase()) {
      return 'NO';
    } else {
      throw new Error(`TokenId ${tokenId} does not match YES or NO token for this market`);
    }
  }
}
