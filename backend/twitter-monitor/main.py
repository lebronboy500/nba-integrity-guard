"""
Twitter Monitor - NBA Integrity Guard
Monitors Twitter for NBA-related sentiment and calculates rigging index
"""

import os
import sys
import time
import logging
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from tweepy_client import TwitterClient
from sentiment_analyzer import SentimentAnalyzer
from database import DatabaseManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv()


class TwitterMonitor:
    """Main Twitter monitoring service"""

    def __init__(self):
        self.twitter_client = TwitterClient()
        self.sentiment_analyzer = SentimentAnalyzer()
        self.db = DatabaseManager()
        self.poll_interval = 30  # seconds
        self.keywords = [
            '#NBA',
            '#FixedGame',
            '#RefereeBias',
            '#NBA比赛',
            'NBA rigged',
            'referee corruption'
        ]

    def fetch_tweets(self, keyword: str, max_results: int = 100) -> list:
        """Fetch recent tweets for a keyword"""
        try:
            tweets = self.twitter_client.search_recent_tweets(
                query=keyword,
                max_results=min(max_results, 100),
                tweet_fields=['created_at', 'public_metrics', 'author_id']
            )
            return tweets if tweets else []
        except Exception as e:
            logger.error(f"Error fetching tweets for {keyword}: {e}")
            return []

    def calculate_rigging_index(self, tweets: list, sentiment_scores: list) -> dict:
        """
        Calculate rigging index based on:
        - Tweet count in last 5 minutes
        - Average sentiment score
        - Retweet velocity

        Formula:
        Rigging Index = (tweet_count * 0.4) + (avg_sentiment * -0.3) + (retweet_velocity * 0.3)
        """
        if not tweets or not sentiment_scores:
            return {
                'rigging_index': 0.0,
                'tweet_count': 0,
                'avg_sentiment': 0.0,
                'retweet_velocity': 0.0
            }

        tweet_count = len(tweets)
        avg_sentiment = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0.0

        # Calculate retweet velocity (retweets per minute)
        total_retweets = sum(t.get('public_metrics', {}).get('retweet_count', 0) for t in tweets)
        retweet_velocity = total_retweets / 5.0 if tweet_count > 0 else 0.0

        # Normalize values to 0-1 range
        normalized_tweet_count = min(tweet_count / 1000.0, 1.0)
        normalized_sentiment = (avg_sentiment + 1.0) / 2.0  # Convert from [-1, 1] to [0, 1]
        normalized_velocity = min(retweet_velocity / 100.0, 1.0)

        rigging_index = (
            normalized_tweet_count * 0.4 +
            (1.0 - normalized_sentiment) * 0.3 +  # Negative sentiment increases index
            normalized_velocity * 0.3
        )

        return {
            'rigging_index': round(rigging_index, 4),
            'tweet_count': tweet_count,
            'avg_sentiment': round(avg_sentiment, 4),
            'retweet_velocity': round(retweet_velocity, 2)
        }

    def process_tweets(self, game_id: str) -> dict:
        """Process tweets for a specific game"""
        logger.info(f"Processing tweets for game: {game_id}")

        all_tweets = []
        all_sentiments = []

        # Fetch tweets for each keyword
        for keyword in self.keywords:
            tweets = self.fetch_tweets(keyword)
            all_tweets.extend(tweets)

            # Analyze sentiment
            for tweet in tweets:
                text = tweet.get('text', '')
                sentiment = self.sentiment_analyzer.analyze(text)
                all_sentiments.append(sentiment)

        # Calculate rigging index
        metrics = self.calculate_rigging_index(all_tweets, all_sentiments)

        # Prepare result
        result = {
            'game_id': game_id,
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'rigging_index': metrics['rigging_index'],
            'tweet_count': metrics['tweet_count'],
            'avg_sentiment': metrics['avg_sentiment'],
            'retweet_velocity': metrics['retweet_velocity'],
            'sample_tweets': [
                {
                    'text': t.get('text', '')[:100],
                    'created_at': t.get('created_at', ''),
                    'retweets': t.get('public_metrics', {}).get('retweet_count', 0)
                }
                for t in all_tweets[:5]
            ]
        }

        # Store in database
        try:
            self.db.insert_twitter_data(result)
            logger.info(f"Stored twitter data for {game_id}: rigging_index={metrics['rigging_index']}")
        except Exception as e:
            logger.error(f"Error storing twitter data: {e}")

        return result

    def run(self):
        """Main monitoring loop"""
        logger.info("Starting Twitter Monitor...")

        # Example game ID (in production, this would come from a schedule)
        game_id = f"NBA_{datetime.utcnow().strftime('%Y%m%d')}_LAL_BOS"

        try:
            while True:
                try:
                    self.process_tweets(game_id)
                    logger.info(f"Sleeping for {self.poll_interval} seconds...")
                    time.sleep(self.poll_interval)
                except Exception as e:
                    logger.error(f"Error in monitoring loop: {e}")
                    time.sleep(self.poll_interval)
        except KeyboardInterrupt:
            logger.info("Twitter Monitor stopped")
            self.db.close()


if __name__ == '__main__':
    monitor = TwitterMonitor()
    monitor.run()
