/**
 * ML Service Module
 * Integrates AdaptiveThreshold for signal evaluation
 */

import { AdaptiveThreshold } from './adaptiveThreshold';
import { DatabaseManager } from '../database';

export interface EvaluationResult {
  gameId: string;
  riggingIndex: number;
  anomalyScore: number;
  shouldTrigger: boolean;
  thresholdEvaluation: {
    riggingThreshold: number;
    anomalyThreshold: number;
    confidence: number;
    reason: string;
  };
  timestamp: string;
}

export class MLService {
  private adaptiveThreshold: AdaptiveThreshold;

  constructor(db: DatabaseManager) {
    this.adaptiveThreshold = new AdaptiveThreshold(db, 30, 3600000);
  }

  /**
   * Evaluate signal with adaptive thresholds
   */
  async evaluateSignal(
    gameId: string,
    riggingIndex: number,
    anomalyScore: number
  ): Promise<EvaluationResult> {
    const evaluation = await this.adaptiveThreshold.shouldTriggerSignal(
      riggingIndex,
      anomalyScore
    );

    return {
      gameId,
      riggingIndex,
      anomalyScore,
      shouldTrigger: evaluation.shouldTrigger,
      thresholdEvaluation: {
        riggingThreshold: evaluation.thresholds.riggingIndexThreshold,
        anomalyThreshold: evaluation.thresholds.anomalyScoreThreshold,
        confidence: evaluation.thresholds.confidence,
        reason: evaluation.reason
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get current threshold statistics
   */
  async getThresholdStats() {
    return this.adaptiveThreshold.getStats();
  }

  /**
   * Force threshold recalculation
   */
  async updateThresholds() {
    return this.adaptiveThreshold.forceUpdate();
  }
}
