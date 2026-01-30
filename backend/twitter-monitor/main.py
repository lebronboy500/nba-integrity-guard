"""
Twitter Monitor - NBA Integrity Guard
Monitors Twitter for NBA-related sentiment and calculates rigging index

Phase 1 改进:
- 真实Twitter API支持（带降级处理）
- 增强的错误处理和重试机制
- 错误计数和告警
- 速率限制管理
"""

import os
import sys
import time
import logging
from datetime import datetime, timedelta
from collections import defaultdict
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_exponential

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from tweepy_client import TwitterClient
from sentiment_analyzer import SentimentAnalyzer
from database import DatabaseManager

# 结构化日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv()


class ErrorHandler:
    """管理错误和告警"""

    def __init__(self, alert_threshold=5):
        self.error_counts = defaultdict(int)
        self.alert_threshold = alert_threshold
        self.fallback_mode = False
        self.last_alert_time = {}

    def record_error(self, error_type: str, error: Exception):
        """记录错误并检查是否需要告警"""
        self.error_counts[error_type] += 1

        logger.error(
            f"Error Type: {error_type} | "
            f"Count: {self.error_counts[error_type]} | "
            f"Error: {str(error)}"
        )

        # 如果错误计数超过阈值，触发告警
        if self.error_counts[error_type] >= self.alert_threshold:
            self._trigger_alert(error_type)

    def _trigger_alert(self, error_type: str):
        """触发告警（可以集成PagerDuty、钉钉等）"""
        # 防止告警风暴，5分钟内最多告警一次
        last_alert = self.last_alert_time.get(error_type, 0)
        if time.time() - last_alert < 300:
            return

        logger.warning(f"🚨 ALERT: Error {error_type} occurred {self.error_counts[error_type]} times!")
        self.last_alert_time[error_type] = time.time()

        # TODO: 集成告警通知 (Email, Slack, DingTalk等)
        # self.send_alert_notification(error_type)

    def reset_errors(self, error_type: str):
        """重置错误计数"""
        self.error_counts[error_type] = 0

    def enable_fallback_mode(self):
        """启用降级模式"""
        if not self.fallback_mode:
            logger.warning("📉 Enabling fallback mode with mock data")
            self.fallback_mode = True

    def disable_fallback_mode(self):
        """禁用降级模式"""
        if self.fallback_mode:
            logger.info("📈 Disabling fallback mode, resuming normal operation")
            self.fallback_mode = False


class TwitterMonitor:
    """Main Twitter monitoring service with Phase 1 improvements"""

    def __init__(self):
        self.twitter_client = TwitterClient()
        self.sentiment_analyzer = SentimentAnalyzer()
        self.db = DatabaseManager()
        self.error_handler = ErrorHandler(alert_threshold=5)
        self.poll_interval = 30  # seconds

        self.keywords = [
            '#NBA',
            '#FixedGame',
            '#RefereeBias',
            '#NBA比赛',
            'NBA rigged',
            'referee corruption'
        ]

        # 统计信息
        self.stats = {
            'total_tweets_processed': 0,
            'total_errors': 0,
            'last_successful_run': None
        }

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    def fetch_tweets(self, keyword: str, max_results: int = 100) -> list:
        """
        使用重试机制获取推文
        真实API或降级处理
        """
        try:
            # 如果处于降级模式，使用Mock数据
            if self.error_handler.fallback_mode:
                logger.info(f"Using mock data for keyword: {keyword}")
                return self._get_mock_tweets(keyword)

            # 尝试真实API
            tweets = self.twitter_client.search_recent_tweets(
                query=keyword,
                max_results=min(max_results, 100),
                tweet_fields=['created_at', 'public_metrics', 'author_id']
            )

            if tweets:
                self.error_handler.reset_errors('twitter_api')
                self.error_handler.disable_fallback_mode()

            return tweets if tweets else []

        except Exception as e:
            self.error_handler.record_error('twitter_api', e)

            # 如果是速率限制错误，启用降级模式
            if 'rate limit' in str(e).lower():
                self.error_handler.enable_fallback_mode()

            raise

    def _get_mock_tweets(self, keyword: str) -> list:
        """降级处理：返回Mock数据"""
        import random

        mock_texts = [
            "This game is totally rigged. The refs are favoring the Lakers again.",
            "Did you see that call? This NBA game is fixed for sure.",
            "The officiating is corrupted. How is this even allowed?",
            "Basketball refs are clearly biased. Game is rigged.",
            "NBA needs better referees. Too many controversial calls."
        ]

        return [
            {
                'id': f"mock_{random.randint(10000, 99999)}",
                'text': random.choice(mock_texts),
                'created_at': datetime.utcnow().isoformat(),
                'public_metrics': {
                    'retweet_count': random.randint(0, 100),
                    'like_count': random.randint(0, 500)
                }
            }
            for _ in range(random.randint(5, 15))
        ]

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
        """
        Process tweets for a specific game
        Phase 1改进：批量处理，完善错误处理
        """
        logger.info(f"📊 Processing tweets for game: {game_id}")

        all_tweets = []
        all_sentiments = []
        keyword_stats = {}

        # Fetch tweets for each keyword with error handling
        for keyword in self.keywords:
            try:
                tweets = self.fetch_tweets(keyword)
                keyword_tweets_count = len(tweets)
                all_tweets.extend(tweets)

                # 记录每个关键词的统计
                keyword_stats[keyword] = keyword_tweets_count

                # Analyze sentiment (批量处理)
                texts = [tweet.get('text', '') for tweet in tweets]
                sentiments = self.sentiment_analyzer.analyze_batch(texts)
                all_sentiments.extend(sentiments)

                logger.info(f"  ✓ {keyword}: {keyword_tweets_count} tweets")

            except Exception as e:
                self.error_handler.record_error(f'keyword_{keyword}', e)
                logger.warning(f"  ✗ {keyword}: Failed to fetch - {str(e)[:50]}")
                continue

        # Update stats
        self.stats['total_tweets_processed'] += len(all_tweets)

        # Calculate rigging index
        metrics = self.calculate_rigging_index(all_tweets, all_sentiments)

        # Prepare result with additional metadata
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
            ],
            # Phase 1 新增：关键词统计
            'keyword_stats': keyword_stats,
            'fallback_mode': self.error_handler.fallback_mode
        }

        # Store in database with error handling
        try:
            self.db.insert_twitter_data(result)
            self.stats['last_successful_run'] = datetime.utcnow()
            logger.info(
                f"✓ Stored twitter data for {game_id}: "
                f"rigging_index={metrics['rigging_index']} "
                f"(mode: {'FALLBACK' if self.error_handler.fallback_mode else 'LIVE'})"
            )
        except Exception as e:
            self.error_handler.record_error('database', e)
            self.stats['total_errors'] += 1
            logger.error(f"✗ Error storing twitter data: {e}")

        return result

    def run(self):
        """Main monitoring loop with health checks"""
        logger.info("🚀 Starting Twitter Monitor (Phase 1 Enhanced)...")
        logger.info("📋 Features: Real API with Fallback | Error Handling | Retry Logic")

        # Example game ID (in production, this would come from a schedule)
        game_id = f"NBA_{datetime.utcnow().strftime('%Y%m%d')}_LAL_BOS"

        consecutive_failures = 0
        max_consecutive_failures = 5

        try:
            while True:
                try:
                    # 健康检查：检查数据库连接
                    if not self._health_check():
                        logger.warning("⚠️ Health check failed, retrying in 60 seconds...")
                        time.sleep(60)
                        continue

                    # Process tweets
                    self.process_tweets(game_id)
                    consecutive_failures = 0

                    # Print stats every 10 iterations
                    if self.stats['total_tweets_processed'] % (10 * len(self.keywords)) == 0:
                        self._print_stats()

                    logger.info(f"💤 Sleeping for {self.poll_interval} seconds...")
                    time.sleep(self.poll_interval)

                except Exception as e:
                    consecutive_failures += 1
                    self.stats['total_errors'] += 1

                    logger.error(
                        f"❌ Monitoring loop error (attempt {consecutive_failures}/{max_consecutive_failures}): {e}"
                    )

                    # 如果连续失败达到阈值，启用降级模式
                    if consecutive_failures >= 3:
                        self.error_handler.enable_fallback_mode()

                    # 如果连续失败过多，退出
                    if consecutive_failures >= max_consecutive_failures:
                        logger.critical("🛑 Too many consecutive failures. Exiting.")
                        break

                    # 指数退避
                    wait_time = min(60 * (2 ** (consecutive_failures - 1)), 300)
                    logger.info(f"⏳ Waiting {wait_time}s before retry...")
                    time.sleep(wait_time)

        except KeyboardInterrupt:
            logger.info("⏹️ Twitter Monitor stopped by user")
        finally:
            self._shutdown()

    def _health_check(self) -> bool:
        """检查系统健康状态"""
        try:
            # 检查数据库连接
            self.db.ping()
            return True
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False

    def _print_stats(self):
        """打印统计信息"""
        uptime = datetime.utcnow() - self.stats['last_successful_run'] \
            if self.stats['last_successful_run'] else "N/A"

        logger.info(
            f"\n📊 === Twitter Monitor Stats ===\n"
            f"  📈 Total tweets processed: {self.stats['total_tweets_processed']}\n"
            f"  ❌ Total errors: {self.stats['total_errors']}\n"
            f"  ⏱️ Last successful run: {uptime} ago\n"
            f"  🔄 Fallback mode: {'ON' if self.error_handler.fallback_mode else 'OFF'}\n"
            f"  🚨 Error counts: {dict(self.error_handler.error_counts)}\n"
            f"================================\n"
        )

    def _shutdown(self):
        """优雅关闭"""
        logger.info("🧹 Shutting down Twitter Monitor...")
        try:
            self._print_stats()
            self.db.close()
            logger.info("✓ Database connection closed")
        except Exception as e:
            logger.error(f"Error during shutdown: {e}")



if __name__ == '__main__':
    monitor = TwitterMonitor()
    monitor.run()
