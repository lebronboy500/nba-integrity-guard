/**
 * Adaptive Threshold Module
 * Dynamically adjusts signal thresholds based on historical data
 */

import { DatabaseManager } from '../database';

interface SignalData {
  timestamp: string;
  riggingIndex: number;
  anomalyScore: number;
}

interface ThresholdConfig {
  riggingIndexThreshold: number;
  anomalyScoreThreshold: number;
  confidence: number;
}

export class AdaptiveThreshold {
  private db: DatabaseManager;
  private lookbackDays: number;
  private updateIntervalMs: number;
  private lastUpdate: Date;
  private currentThresholds: ThresholdConfig;

  constructor(
    db: DatabaseManager,
    lookbackDays: number = 30,
    updateIntervalMs: number = 3600000 // 1 hour
  ) {
    this.db = db;
    this.lookbackDays = lookbackDays;
    this.updateIntervalMs = updateIntervalMs;
    this.lastUpdate = new Date(0); // Force initial update
    this.currentThresholds = {
      riggingIndexThreshold: 0.65,
      anomalyScoreThreshold: 0.75,
      confidence: 0.0
    };
  }

  /**
   * Get current thresholds (updates if needed)
   */
  async getThresholds(): Promise<ThresholdConfig> {
    const now = new Date();
    const timeSinceUpdate = now.getTime() - this.lastUpdate.getTime();

    if (timeSinceUpdate > this.updateIntervalMs) {
      await this.updateThresholds();
    }

    return { ...this.currentThresholds };
  }

  /**
   * Update thresholds based on historical data
   */
  private async updateThresholds(): Promise<void> {
    try {
      console.log('[AdaptiveThreshold] Updating thresholds...');

      const historicalData = await this.loadHistoricalData();

      if (historicalData.length < 10) {
        console.log('[AdaptiveThreshold] Insufficient data, using defaults');
        return;
      }

      // Calculate 95th percentile for rigging index
      const riggingValues = historicalData
        .map(d => d.riggingIndex)
        .sort((a, b) => a - b);
      const riggingThreshold = this.calculatePercentile(riggingValues, 95);

      // Calculate 95th percentile for anomaly score
      const anomalyValues = historicalData
        .map(d => d.anomalyScore)
        .sort((a, b) => a - b);
      const anomalyThreshold = this.calculatePercentile(anomalyValues, 95);

      // Calculate confidence based on data size
      const confidence = Math.min(historicalData.length / 100, 1.0);

      this.currentThresholds = {
        riggingIndexThreshold: Number(riggingThreshold.toFixed(2)),
        anomalyScoreThreshold: Number(anomalyThreshold.toFixed(2)),
        confidence: Number(confidence.toFixed(2))
      };

      this.lastUpdate = new Date();

      console.log('[AdaptiveThreshold] Updated thresholds:', this.currentThresholds);
    } catch (error) {
      console.error('[AdaptiveThreshold] Error updating thresholds:', error);
    }
  }

  /**
   * Load historical signal data
   */
  private async loadHistoricalData(): Promise<SignalData[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.lookbackDays);

    const query = `
      SELECT
        timestamp,
        rigging_index as "riggingIndex",
        (metadata->>'anomaly_score')::decimal as "anomalyScore"
      FROM twitter_data
      WHERE timestamp > $1
        AND rigging_index IS NOT NULL
      ORDER BY timestamp DESC
      LIMIT 1000
    `;

    const result = await this.db.query(query, [cutoffDate.toISOString()]);
    return result.rows;
  }

  /**
   * Calculate percentile value from sorted array
   */
  private calculatePercentile(sortedValues: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)];
  }

  /**
   * Evaluate if signal should trigger based on adaptive thresholds
   */
  async shouldTriggerSignal(
    riggingIndex: number,
    anomalyScore: number
  ): Promise<{ shouldTrigger: boolean; reason: string; thresholds: ThresholdConfig }> {
    const thresholds = await this.getThresholds();

    const meetsRiggingThreshold = riggingIndex >= thresholds.riggingIndexThreshold;
    const meetsAnomalyThreshold = anomalyScore >= thresholds.anomalyScoreThreshold;
    const shouldTrigger = meetsRiggingThreshold && meetsAnomalyThreshold;

    let reason = '';
    if (!meetsRiggingThreshold) {
      reason = `Rigging index ${riggingIndex} below threshold ${thresholds.riggingIndexThreshold}`;
    } else if (!meetsAnomalyThreshold) {
      reason = `Anomaly score ${anomalyScore} below threshold ${thresholds.anomalyScoreThreshold}`;
    } else {
      reason = `Both thresholds met (confidence: ${thresholds.confidence})`;
    }

    return {
      shouldTrigger,
      reason,
      thresholds
    };
  }

  /**
   * Get threshold statistics
   */
  async getStats(): Promise<{
    currentThresholds: ThresholdConfig;
    lastUpdate: string;
    dataPoints: number;
  }> {
    const historicalData = await this.loadHistoricalData();

    return {
      currentThresholds: { ...this.currentThresholds },
      lastUpdate: this.lastUpdate.toISOString(),
      dataPoints: historicalData.length
    };
  }

  /**
   * Force threshold update (for manual refresh)
   */
  async forceUpdate(): Promise<ThresholdConfig> {
    await this.updateThresholds();
    return { ...this.currentThresholds };
  }
}
