"""
NBA Integrity Guard - CLI Dashboard
Real-time monitoring of system status
"""

import os
import sys
import time
import psycopg2
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()


class Dashboard:
    """CLI Dashboard for monitoring NBA Integrity Guard"""

    def __init__(self):
        self.conn = None
        self.connect()

    def connect(self):
        """Connect to PostgreSQL database"""
        try:
            self.conn = psycopg2.connect(
                host=os.getenv('POSTGRES_HOST', 'localhost'),
                port=os.getenv('POSTGRES_PORT', 5432),
                database=os.getenv('POSTGRES_DB', 'nba_integrity'),
                user=os.getenv('POSTGRES_USER', 'admin'),
                password=os.getenv('POSTGRES_PASSWORD', 'password')
            )
        except Exception as e:
            print(f"Error connecting to database: {e}")
            sys.exit(1)

    def get_latest_twitter_data(self):
        """Get latest Twitter sentiment data"""
        try:
            cursor = self.conn.cursor()
            cursor.execute("""
                SELECT rigging_index, tweet_count, avg_sentiment, timestamp
                FROM twitter_data
                ORDER BY timestamp DESC
                LIMIT 1
            """)
            result = cursor.fetchone()
            cursor.close()
            return result
        except Exception as e:
            print(f"Error fetching twitter data: {e}")
            return None

    def get_latest_market_data(self):
        """Get latest market anomaly data"""
        try:
            cursor = self.conn.cursor()
            cursor.execute("""
                SELECT yes_price, no_price, anomaly_score, anomaly_detected, timestamp
                FROM market_data
                ORDER BY timestamp DESC
                LIMIT 1
            """)
            result = cursor.fetchone()
            cursor.close()
            return result
        except Exception as e:
            print(f"Error fetching market data: {e}")
            return None

    def get_recent_trades(self, limit=5):
        """Get recent trades"""
        try:
            cursor = self.conn.cursor()
            cursor.execute("""
                SELECT trade_id, signal_type, action, amount, estimated_payout, status, timestamp
                FROM trades
                ORDER BY timestamp DESC
                LIMIT %s
            """, (limit,))
            results = cursor.fetchall()
            cursor.close()
            return results
        except Exception as e:
            print(f"Error fetching trades: {e}")
            return []

    def get_signal_logs(self, limit=5):
        """Get recent signal logs"""
        try:
            cursor = self.conn.cursor()
            cursor.execute("""
                SELECT signal_type, rigging_index, anomaly_score, timestamp
                FROM signal_logs
                ORDER BY timestamp DESC
                LIMIT %s
            """, (limit,))
            results = cursor.fetchall()
            cursor.close()
            return results
        except Exception as e:
            print(f"Error fetching signal logs: {e}")
            return []

    def clear_screen(self):
        """Clear terminal screen"""
        os.system('clear' if os.name == 'posix' else 'cls')

    def display_dashboard(self):
        """Display the dashboard"""
        while True:
            self.clear_screen()

            print("┌" + "─" * 58 + "┐")
            print("│" + " NBA Integrity Guard - Live Dashboard ".center(58) + "│")
            print("└" + "─" * 58 + "┘")
            print()

            # Twitter Data
            print("📱 Twitter Sentiment Analysis (Last 5 min):")
            twitter_data = self.get_latest_twitter_data()
            if twitter_data:
                rigging_index, tweet_count, avg_sentiment, timestamp = twitter_data
                trend = "↑" if rigging_index > 0.5 else "↓"
                print(f"   Rigging Index: {rigging_index:.4f} {trend}")
                print(f"   Tweet Count: {tweet_count}")
                print(f"   Avg Sentiment: {avg_sentiment:.4f}")
                print(f"   Updated: {timestamp}")
            else:
                print("   No data available")
            print()

            # Market Data
            print("📊 Polymarket Anomaly Detection:")
            market_data = self.get_latest_market_data()
            if market_data:
                yes_price, no_price, anomaly_score, anomaly_detected, timestamp = market_data
                status = "⚠️  ANOMALY DETECTED" if anomaly_detected else "✓ Normal"
                print(f"   Status: {status}")
                print(f"   Yes Price: {yes_price:.8f}")
                print(f"   No Price: {no_price:.8f}")
                print(f"   Anomaly Score: {anomaly_score:.4f}")
                print(f"   Updated: {timestamp}")
            else:
                print("   No data available")
            print()

            # Recent Trades
            print("💰 Recent Trades:")
            trades = self.get_recent_trades(5)
            if trades:
                for trade in trades:
                    trade_id, signal_type, action, amount, payout, status, timestamp = trade
                    status_icon = "✓" if status == "EXECUTED" else "⏳"
                    print(f"   {status_icon} {trade_id} | {signal_type} | {action} | ${amount}")
            else:
                print("   No trades yet")
            print()

            # Signal Logs
            print("🔔 Recent Signals:")
            signals = self.get_signal_logs(5)
            if signals:
                for signal in signals:
                    signal_type, rigging_index, anomaly_score, timestamp = signal
                    print(f"   [{signal_type}] Rigging: {rigging_index:.4f}, Anomaly: {anomaly_score:.4f}")
            else:
                print("   No signals yet")
            print()

            print("─" * 60)
            print(f"Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print("Press Ctrl+C to exit")
            print()

            time.sleep(5)  # Refresh every 5 seconds

    def run(self):
        """Run the dashboard"""
        try:
            self.display_dashboard()
        except KeyboardInterrupt:
            print("\nDashboard stopped")
            self.conn.close()
            sys.exit(0)


if __name__ == '__main__':
    dashboard = Dashboard()
    dashboard.run()
