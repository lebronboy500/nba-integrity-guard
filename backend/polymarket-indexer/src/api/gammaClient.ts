/**
 * Gamma API Client
 * Queries the official Polymarket Gamma API for market and event data
 */

import axios, { AxiosInstance } from 'axios';
import { GammaMarket, GammaEvent } from '../types';

export class GammaClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl: string = 'https://gamma-api.polymarket.com') {
    this.baseUrl = baseUrl;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NBA-Integrity-Guard/1.0'
      }
    });

    // Add request logging
    this.client.interceptors.request.use(config => {
      console.log(`[GammaClient] GET ${config.url}`);
      return config;
    });

    // Add response logging and error handling
    this.client.interceptors.response.use(
      response => {
        console.log(`[GammaClient] Response: ${response.status} from ${response.config.url}`);
        return response;
      },
      error => {
        console.error(`[GammaClient] Error: ${error.message}`);
        throw error;
      }
    );
  }

  /**
   * Fetch event details by slug
   */
  async fetchEvent(slug: string): Promise<GammaEvent> {
    try {
      const response = await this.client.get<GammaEvent>(`/events/${slug}`);
      return response.data;
    } catch (error) {
      console.error(`[GammaClient] Error fetching event ${slug}:`, error);
      throw error;
    }
  }

  /**
   * Fetch all events with optional filtering
   */
  async fetchEvents(limit: number = 100, offset: number = 0): Promise<GammaEvent[]> {
    try {
      const response = await this.client.get<GammaEvent[]>('/events', {
        params: { limit, offset }
      });
      return response.data;
    } catch (error) {
      console.error('[GammaClient] Error fetching events:', error);
      throw error;
    }
  }

  /**
   * Fetch market details by slug
   */
  async fetchMarket(slug: string): Promise<GammaMarket> {
    try {
      const response = await this.client.get<GammaMarket>(`/markets/${slug}`);
      return response.data;
    } catch (error) {
      console.error(`[GammaClient] Error fetching market ${slug}:`, error);
      throw error;
    }
  }

  /**
   * Fetch all markets for an event
   */
  async fetchMarketsByEvent(eventSlug: string): Promise<GammaMarket[]> {
    try {
      const response = await this.client.get<GammaMarket[]>(
        `/events/${eventSlug}/markets`
      );
      return response.data;
    } catch (error) {
      console.error(`[GammaClient] Error fetching markets for event ${eventSlug}:`, error);
      throw error;
    }
  }

  /**
   * Fetch markets with optional filtering
   */
  async fetchMarkets(
    options?: {
      limit?: number;
      offset?: number;
      status?: string;
      category?: string;
    }
  ): Promise<GammaMarket[]> {
    try {
      const response = await this.client.get<GammaMarket[]>('/markets', {
        params: {
          limit: options?.limit || 100,
          offset: options?.offset || 0,
          status: options?.status || 'active',
          category: options?.category
        }
      });
      return response.data;
    } catch (error) {
      console.error('[GammaClient] Error fetching markets:', error);
      throw error;
    }
  }

  /**
   * Search markets by keyword
   */
  async searchMarkets(keyword: string): Promise<GammaMarket[]> {
    try {
      const response = await this.client.get<GammaMarket[]>('/markets/search', {
        params: { q: keyword }
      });
      return response.data;
    } catch (error) {
      console.error(`[GammaClient] Error searching markets for "${keyword}":`, error);
      throw error;
    }
  }

  /**
   * Get market orderbook/liquidity data
   */
  async fetchMarketOrderbook(marketSlug: string): Promise<any> {
    try {
      const response = await this.client.get(
        `/markets/${marketSlug}/orderbook`
      );
      return response.data;
    } catch (error) {
      console.error(`[GammaClient] Error fetching orderbook for ${marketSlug}:`, error);
      throw error;
    }
  }

  /**
   * Get market trades (recent trades on market)
   */
  async fetchMarketTrades(
    marketSlug: string,
    limit: number = 100
  ): Promise<any[]> {
    try {
      const response = await this.client.get<any[]>(
        `/markets/${marketSlug}/trades`,
        { params: { limit } }
      );
      return response.data;
    } catch (error) {
      console.error(`[GammaClient] Error fetching trades for ${marketSlug}:`, error);
      throw error;
    }
  }

  /**
   * Get market prices (historical OHLCV data)
   */
  async fetchMarketPrices(
    marketSlug: string,
    interval: string = '1h',
    limit: number = 100
  ): Promise<any[]> {
    try {
      const response = await this.client.get(
        `/markets/${marketSlug}/prices`,
        { params: { interval, limit } }
      );
      return response.data;
    } catch (error) {
      console.error(
        `[GammaClient] Error fetching prices for ${marketSlug}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get market position data
   */
  async fetchMarketPositions(
    marketSlug: string,
    limit: number = 100
  ): Promise<any[]> {
    try {
      const response = await this.client.get(
        `/markets/${marketSlug}/positions`,
        { params: { limit } }
      );
      return response.data;
    } catch (error) {
      console.error(
        `[GammaClient] Error fetching positions for ${marketSlug}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get market by condition ID (useful for contract events)
   */
  async fetchMarketByConditionId(conditionId: string): Promise<GammaMarket | null> {
    try {
      // This endpoint may not exist in Gamma API, so we fetch markets and filter
      const markets = await this.fetchMarkets({ limit: 1000 });
      return markets.find(m => m.conditionId.toLowerCase() === conditionId.toLowerCase()) || null;
    } catch (error) {
      console.error(
        `[GammaClient] Error fetching market by conditionId ${conditionId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('[GammaClient] Health check failed:', error);
      return false;
    }
  }
}
