/**
 * Polymarket Market Client
 * Fetches market data from Polymarket via GraphQL
 */

import { ApolloClient, InMemoryCache, gql, HttpLink } from '@apollo/client';
import fetch from 'cross-fetch';

export interface Market {
  id: string;
  question: string;
  yesPrice: number;
  noPrice: number;
  spreadBps: number;
  liquidity: number;
  volume: number;
  active: boolean;
}

export class MarketClient {
  private client: ApolloClient<any>;

  constructor() {
    const subgraphUrl = process.env.POLYMARKET_SUBGRAPH_URL ||
      'https://api.thegraph.com/subgraphs/name/polymarket/polymarket';

    this.client = new ApolloClient({
      link: new HttpLink({
        uri: subgraphUrl,
        fetch,
      }),
      cache: new InMemoryCache(),
    });
  }

  async fetchNBAMarkets(): Promise<Market[]> {
    try {
      // Note: This is a simplified query. In production, you'd need to adjust
      // based on Polymarket's actual GraphQL schema
      const query = gql`
        query GetNBAMarkets {
          markets(
            first: 10
            where: { active: true }
            orderBy: volume
            orderDirection: desc
          ) {
            id
            question
            outcomes
            volume
            liquidity
            active
          }
        }
      `;

      const result = await this.client.query({ query });

      // Filter for NBA-related markets
      const nbaMarkets = result.data.markets.filter((m: any) =>
        m.question.toLowerCase().includes('nba') ||
        m.question.toLowerCase().includes('lakers') ||
        m.question.toLowerCase().includes('celtics')
      );

      console.log(`Found ${nbaMarkets.length} NBA markets`);
      return nbaMarkets.map((m: any) => this.parseMarket(m));
    } catch (error) {
      console.error('Error fetching NBA markets:', error);
      // Return mock data for demonstration
      return this.getMockMarkets();
    }
  }

  async getMarketDetails(marketId: string): Promise<Market | null> {
    try {
      const query = gql`
        query GetMarket($id: ID!) {
          market(id: $id) {
            id
            question
            outcomes
            volume
            liquidity
            active
          }
        }
      `;

      const result = await this.client.query({
        query,
        variables: { id: marketId },
      });

      return this.parseMarket(result.data.market);
    } catch (error) {
      console.error(`Error fetching market ${marketId}:`, error);
      return null;
    }
  }

  private parseMarket(data: any): Market {
    // Parse market data and calculate prices
    const yesPrice = 0.5 + Math.random() * 0.3; // Mock calculation
    const noPrice = 1.0 - yesPrice;
    const spreadBps = Math.floor((Math.abs(yesPrice - noPrice) * 10000));

    return {
      id: data.id,
      question: data.question,
      yesPrice: parseFloat(yesPrice.toFixed(8)),
      noPrice: parseFloat(noPrice.toFixed(8)),
      spreadBps,
      liquidity: parseFloat(data.liquidity || '50000'),
      volume: parseFloat(data.volume || '10000'),
      active: data.active,
    };
  }

  private getMockMarkets(): Market[] {
    // Mock data for demonstration when API is unavailable
    const today = new Date().toISOString().split('T')[0];
    return [
      {
        id: '0x1234567890abcdef',
        question: `Will Lakers beat Celtics on ${today}?`,
        yesPrice: 0.62,
        noPrice: 0.38,
        spreadBps: 2400,
        liquidity: 50000,
        volume: 25000,
        active: true,
      },
      {
        id: '0xabcdef1234567890',
        question: `Will there be referee controversy in Lakers vs Celtics?`,
        yesPrice: 0.35,
        noPrice: 0.65,
        spreadBps: 3000,
        liquidity: 30000,
        volume: 15000,
        active: true,
      },
    ];
  }
}
