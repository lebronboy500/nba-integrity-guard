/**
 * Market Discovery Service
 * Discovers and stores markets from Gamma API
 */

import { GammaClient } from '../api/gammaClient';
import { MarketDecoder } from '../decoder/marketDecoder';
import { Database } from '../db/database';
import { DatabaseEvent, DatabaseMarket } from '../types';

export class MarketDiscoveryService {
  private gammaClient: GammaClient;
  private marketDecoder: MarketDecoder;
  private db: Database;

  constructor(gammaClient: GammaClient, marketDecoder: MarketDecoder, db: Database) {
    this.gammaClient = gammaClient;
    this.marketDecoder = marketDecoder;
    this.db = db;
  }

  /**
   * Discover and store markets for a given event
   */
  async discoverEventMarkets(eventSlug: string): Promise<number> {
    try {
      console.log(`[MarketDiscovery] Discovering markets for event: ${eventSlug}`);

      // 1. Fetch event from Gamma API
      const event = await this.gammaClient.fetchEvent(eventSlug);
      console.log(`[MarketDiscovery] Event: ${event.title}`);

      // 2. Store event in database
      const eventId = await this.storeEvent(event);
      console.log(`[MarketDiscovery] Stored event with ID: ${eventId}`);

      // 3. Fetch markets for this event
      const markets = await this.gammaClient.fetchMarketsByEvent(eventSlug);
      console.log(`[MarketDiscovery] Found ${markets.length} markets`);

      // 4. Process and store each market
      let stored = 0;
      for (const market of markets) {
        try {
          // Create market parameters (calculate TokenIds)
          const marketParams = this.marketDecoder.createMarketParams(
            market.conditionId,
            market.questionId,
            market.oracle,
            market.clobTokenIds
          );

          // Store market in database
          await this.storeMarket(eventId, market, marketParams);
          stored++;

          console.log(
            `[MarketDiscovery] ✅ Stored market: ${market.slug}`
          );
        } catch (error) {
          console.error(
            `[MarketDiscovery] ❌ Error storing market ${market.slug}:`,
            error
          );
        }
      }

      console.log(
        `[MarketDiscovery] ✅ Discovery complete: ${stored}/${markets.length} markets stored`
      );
      return stored;
    } catch (error) {
      console.error(
        `[MarketDiscovery] ❌ Error discovering markets for ${eventSlug}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Discover all active events and their markets
   */
  async discoverAllMarkets(limit: number = 100): Promise<{ events: number; markets: number }> {
    try {
      console.log(`[MarketDiscovery] Discovering all events (limit: ${limit})...`);

      // Fetch all events
      const events = await this.gammaClient.fetchEvents(limit);
      console.log(`[MarketDiscovery] Found ${events.length} events`);

      let totalMarkets = 0;

      for (const event of events) {
        try {
          const count = await this.discoverEventMarkets(event.slug);
          totalMarkets += count;
        } catch (error) {
          console.error(
            `[MarketDiscovery] Error discovering event ${event.slug}:`,
            error
          );
        }
      }

      console.log(
        `[MarketDiscovery] ✅ Full discovery complete: ${events.length} events, ${totalMarkets} markets`
      );
      return { events: events.length, markets: totalMarkets };
    } catch (error) {
      console.error('[MarketDiscovery] ❌ Error in full discovery:', error);
      throw error;
    }
  }

  /**
   * Store event in database
   */
  private async storeEvent(event: any): Promise<number> {
    const query = `
      INSERT INTO events (slug, title, description, category, image_url, enable_neg_risk, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (slug) DO UPDATE SET
        title = $2, description = $3, updated_at = NOW()
      RETURNING id
    `;

    const result = await this.db.query(query, [
      event.slug,
      event.title,
      event.description || null,
      event.category || null,
      event.imageUrl || null,
      event.negRisk || false,
      event.status || 'active'
    ]);

    return result.rows[0].id;
  }

  /**
   * Store market in database
   */
  private async storeMarket(
    eventId: number,
    gammaMarket: any,
    marketParams: any
  ): Promise<number> {
    const query = `
      INSERT INTO markets (
        event_id, slug, condition_id, question_id, oracle, collateral_token,
        yes_token_id, no_token_id, question, status, enable_order_book
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (condition_id) DO UPDATE SET
        slug = $2, question = $9, status = $10, updated_at = NOW()
      RETURNING id
    `;

    const result = await this.db.query(query, [
      eventId,
      gammaMarket.slug,
      marketParams.conditionId,
      marketParams.questionId,
      marketParams.oracle,
      marketParams.collateralToken,
      marketParams.yesTokenId,
      marketParams.noTokenId,
      gammaMarket.question || gammaMarket.title,
      gammaMarket.status || 'active',
      gammaMarket.enableOrderBook !== false
    ]);

    return result.rows[0].id;
  }

  /**
   * Update market status based on resolution
   */
  async updateMarketStatus(marketSlug: string, status: string): Promise<void> {
    const query = `
      UPDATE markets SET status = $1, updated_at = NOW()
      WHERE slug = $2
    `;

    await this.db.query(query, [status, marketSlug]);
    console.log(`[MarketDiscovery] Updated market ${marketSlug} status to ${status}`);
  }

  /**
   * Get stored market by slug
   */
  async getMarket(slug: string): Promise<DatabaseMarket | null> {
    const query = `
      SELECT * FROM markets WHERE slug = $1
    `;

    const result = await this.db.query(query, [slug]);
    return result.rows[0] || null;
  }

  /**
   * Get stored event by slug
   */
  async getEvent(slug: string): Promise<DatabaseEvent | null> {
    const query = `
      SELECT * FROM events WHERE slug = $1
    `;

    const result = await this.db.query(query, [slug]);
    return result.rows[0] || null;
  }

  /**
   * Get market by condition ID
   */
  async getMarketByConditionId(conditionId: string): Promise<DatabaseMarket | null> {
    const query = `
      SELECT * FROM markets WHERE condition_id = $1
    `;

    const result = await this.db.query(query, [conditionId]);
    return result.rows[0] || null;
  }

  /**
   * Get market by token ID
   */
  async getMarketByTokenId(tokenId: string): Promise<DatabaseMarket | null> {
    const query = `
      SELECT * FROM markets
      WHERE yes_token_id = $1 OR no_token_id = $1
      LIMIT 1
    `;

    const result = await this.db.query(query, [tokenId]);
    return result.rows[0] || null;
  }
}
