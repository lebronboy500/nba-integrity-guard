/**
 * Labels API Routes
 * Manages ground truth labels for ML training
 */

import express from 'express';
import { Pool } from 'pg';

const router = express.Router();

interface LabelRequest {
  signal_id: number;
  manual_label: boolean;
  label_confidence: number;
  label_notes?: string;
}

interface UnlabeledSignal {
  id: number;
  game_id: string;
  rigging_index: number;
  anomaly_score: number;
  timestamp: string;
  tweet_count: number;
  avg_sentiment: number;
}

interface LabelStats {
  total_signals: number;
  labeled_count: number;
  unlabeled_count: number;
  accuracy_by_confidence: any[];
  labeling_progress: number;
}

/**
 * GET /api/labels/unlabeled
 * Get signals that need labeling
 */
router.get('/unlabeled', async (req: any, res: any) => {
  try {
    const db: Pool = req.app.locals.db;
    const limit = parseInt(req.query.limit || '20');
    const offset = parseInt(req.query.offset || '0');

    const query = `
      SELECT
        sl.id,
        sl.game_id,
        sl.rigging_index,
        sl.anomaly_score,
        sl.timestamp,
        td.tweet_count,
        td.avg_sentiment
      FROM signal_logs sl
      LEFT JOIN signal_ground_truth sgt ON sl.id = sgt.signal_id
      LEFT JOIN twitter_data td ON sl.game_id = td.game_id
      WHERE sgt.manual_label IS NULL
      ORDER BY sl.timestamp DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await db.query(query, [limit, offset]);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('[Labels API] Error fetching unlabeled signals:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/labels/create
 * Create a new label for a signal
 * Requires authentication and reputation > 50
 */
router.post('/create', async (req: any, res: any) => {
  try {
    const db: Pool = req.app.locals.db;
    const {
      signal_id,
      manual_label,
      label_confidence,
      label_notes
    }: LabelRequest = req.body;

    // Get labeler info from JWT token
    const labelerAddress = req.user?.address || 'anonymous';
    const labelerReputation = req.user?.reputation || 0;

    // Validation
    if (!signal_id || typeof manual_label !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'signal_id and manual_label are required'
      });
    }

    if (label_confidence < 0 || label_confidence > 1) {
      return res.status(400).json({
        success: false,
        error: 'label_confidence must be between 0 and 1'
      });
    }

    // Minimum reputation requirement
    if (labelerReputation < 50) {
      return res.status(403).json({
        success: false,
        error: 'Minimum reputation of 50 required to label signals'
      });
    }

    // Check if signal exists
    const signalCheck = await db.query(
      'SELECT id FROM signal_logs WHERE id = $1',
      [signal_id]
    );

    if (signalCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Signal not found'
      });
    }

    // Check if already labeled
    const existingLabel = await db.query(
      'SELECT id FROM signal_ground_truth WHERE signal_id = $1 AND manual_label IS NOT NULL',
      [signal_id]
    );

    if (existingLabel.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'This signal has already been labeled'
      });
    }

    // Get signal details
    const signalQuery = `
      SELECT sl.*, td.game_id
      FROM signal_logs sl
      LEFT JOIN twitter_data td ON sl.game_id = td.game_id
      WHERE sl.id = $1
    `;
    const signalResult = await db.query(signalQuery, [signal_id]);
    const signal = signalResult.rows[0];

    // Insert label
    const insertQuery = `
      INSERT INTO signal_ground_truth (
        signal_id,
        game_id,
        rigging_index,
        anomaly_score,
        manual_label,
        labeler_address,
        labeler_reputation,
        label_confidence,
        label_notes,
        timestamp,
        labeled_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING *
    `;

    const result = await db.query(insertQuery, [
      signal_id,
      signal.game_id,
      signal.rigging_index,
      signal.anomaly_score,
      manual_label,
      labelerAddress,
      labelerReputation,
      label_confidence,
      label_notes || null,
      signal.timestamp
    ]);

    console.log(`[Labels API] Label created for signal ${signal_id} by ${labelerAddress}`);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('[Labels API] Error creating label:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/labels/stats
 * Get labeling progress statistics
 */
router.get('/stats', async (req: any, res: any) => {
  try {
    const db: Pool = req.app.locals.db;

    // Total signals with available labels
    const totalQuery = `
      SELECT COUNT(*) as count
      FROM signal_logs sl
      LEFT JOIN signal_ground_truth sgt ON sl.id = sgt.signal_id
    `;

    // Labeled signals
    const labeledQuery = `
      SELECT COUNT(*) as count
      FROM signal_ground_truth
      WHERE manual_label IS NOT NULL
    `;

    // Unlabeled signals
    const unlabeledQuery = `
      SELECT COUNT(*) as count
      FROM signal_logs sl
      LEFT JOIN signal_ground_truth sgt ON sl.id = sgt.signal_id
      WHERE sgt.manual_label IS NULL
    `;

    // Accuracy by confidence
    const confidenceQuery = `
      SELECT
        ROUND(label_confidence::numeric, 1) as confidence_bucket,
        COUNT(*) as label_count,
        SUM(CASE WHEN actual_outcome = manual_label THEN 1 ELSE 0 END)::float /
          NULLIF(COUNT(*), 0) as accuracy
      FROM signal_ground_truth
      WHERE manual_label IS NOT NULL AND actual_outcome IS NOT NULL
      GROUP BY confidence_bucket
      ORDER BY confidence_bucket DESC
    `;

    const [totalResult, labeledResult, unlabeledResult, confidenceResult] =
      await Promise.all([
        db.query(totalQuery),
        db.query(labeledQuery),
        db.query(unlabeledQuery),
        db.query(confidenceQuery)
      ]);

    const total = parseInt(totalResult.rows[0].count);
    const labeled = parseInt(labeledResult.rows[0].count);
    const unlabeled = parseInt(unlabeledResult.rows[0].count);

    const stats: LabelStats = {
      total_signals: total,
      labeled_count: labeled,
      unlabeled_count: unlabeled,
      accuracy_by_confidence: confidenceResult.rows,
      labeling_progress: total > 0 ? Math.round((labeled / total) * 100) : 0
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[Labels API] Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/labels/leaderboard
 * Get top labelers by contribution and accuracy
 */
router.get('/leaderboard', async (req: any, res: any) => {
  try {
    const db: Pool = req.app.locals.db;
    const limit = parseInt(req.query.limit || '20');

    const query = `
      SELECT
        labeler_address,
        COUNT(*) as labels_created,
        AVG(label_confidence)::decimal(5,2) as avg_confidence,
        SUM(CASE WHEN actual_outcome = manual_label THEN 1 ELSE 0 END)::float /
          NULLIF(COUNT(*), 0) as accuracy,
        MAX(labeled_at) as last_labeled
      FROM signal_ground_truth
      WHERE labeler_address IS NOT NULL AND manual_label IS NOT NULL
      GROUP BY labeler_address
      ORDER BY labels_created DESC
      LIMIT $1
    `;

    const result = await db.query(query, [limit]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('[Labels API] Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/labels/batch
 * Batch create labels (for testing/migration)
 */
router.post('/batch', async (req: any, res: any) => {
  try {
    const db: Pool = req.app.locals.db;
    const { labels }: { labels: LabelRequest[] } = req.body;

    const labelerAddress = req.user?.address || 'admin';
    const labelerReputation = req.user?.reputation || 100;

    if (!Array.isArray(labels) || labels.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'labels must be a non-empty array'
      });
    }

    const inserted: any[] = [];
    const errors: any[] = [];

    for (const label of labels) {
      try {
        const signalResult = await db.query(
          'SELECT id, game_id, rigging_index, anomaly_score, timestamp FROM signal_logs WHERE id = $1',
          [label.signal_id]
        );

        if (signalResult.rows.length === 0) {
          errors.push({
            signal_id: label.signal_id,
            error: 'Signal not found'
          });
          continue;
        }

        const signal = signalResult.rows[0];

        const insertQuery = `
          INSERT INTO signal_ground_truth (
            signal_id, game_id, rigging_index, anomaly_score,
            manual_label, labeler_address, labeler_reputation,
            label_confidence, label_notes, timestamp, labeled_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
          ON CONFLICT DO NOTHING
          RETURNING *
        `;

        const result = await db.query(insertQuery, [
          label.signal_id,
          signal.game_id,
          signal.rigging_index,
          signal.anomaly_score,
          label.manual_label,
          labelerAddress,
          labelerReputation,
          label.label_confidence,
          label.label_notes || null,
          signal.timestamp
        ]);

        if (result.rows.length > 0) {
          inserted.push(result.rows[0]);
        }
      } catch (err) {
        errors.push({
          signal_id: label.signal_id,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    console.log(`[Labels API] Batch insert: ${inserted.length} created, ${errors.length} errors`);

    res.json({
      success: errors.length === 0,
      data: {
        inserted_count: inserted.length,
        error_count: errors.length,
        inserted: inserted.slice(0, 5), // Return first 5 for preview
        errors: errors
      }
    });
  } catch (error) {
    console.error('[Labels API] Error in batch insert:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
