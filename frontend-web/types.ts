export interface FeedItem {
  id: string;
  timestamp: string;
  event: string;
  severity: 'low' | 'medium' | 'high';
  value: string;
}

export interface LogItem {
  id: string;
  timestamp: string;
  action: string;
  hash: string;
  status: 'pending' | 'success' | 'failed';
}

export interface MetricPoint {
  time: string;
  integrityScore: number;
  bettingVolume: number;
}