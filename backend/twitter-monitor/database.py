"""
Database Manager for Twitter Monitor - Phase 1 Enhanced
Handles PostgreSQL connections and data storage with archiving and health checks
"""

import os
import logging
import psycopg2
from psycopg2.extras import Json
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class DatabaseManager:
    """
    Manages database connections and operations
    Phase 1改进: 数据归档, 健康检查, 连接池概念
    """

    def __init__(self, max_retries=3):
        """Initialize database connection"""
        self.conn = None
        self.max_retries = max_retries
        self.connect()
        self.stats = {'inserts': 0, 'errors': 0}

    def connect(self):
        """Establish database connection with retry"""
        for attempt in range(self.max_retries):
            try:
                self.conn = psycopg2.connect(
                    host=os.getenv('POSTGRES_HOST', 'localhost'),
                    port=int(os.getenv('POSTGRES_PORT', 5432)),
                    database=os.getenv('POSTGRES_DB', 'nba_integrity'),
                    user=os.getenv('POSTGRES_USER', 'admin'),
                    password=os.getenv('POSTGRES_PASSWORD', 'password'),
                    connect_timeout=5
                )
                logger.info(f"✓ Connected to PostgreSQL database (attempt {attempt + 1})")
                return
            except Exception as e:
                logger.warning(f"⚠️ Connection attempt {attempt + 1}/{self.max_retries} failed: {e}")
                if attempt == self.max_retries - 1:
                    logger.error("❌ Failed to connect to database after all retries")
                    raise
                import time
                time.sleep(2 ** attempt)  # Exponential backoff

    def ping(self) -> bool:
        """Check if database connection is alive"""
        try:
            cursor = self.conn.cursor()
            cursor.execute("SELECT 1")
            cursor.close()
            return True
        except Exception as e:
            logger.warning(f"⚠️ Database ping failed: {e}")
            try:
                self.connect()
                return True
            except:
                return False

    def insert_twitter_data(self, data: dict) -> bool:
        """
        Insert Twitter data into database with enhanced error handling

        Phase 1改进: 添加关键词统计和模式标记
        """
        try:
            cursor = self.conn.cursor()

            query = """
                INSERT INTO twitter_data
                (game_id, rigging_index, tweet_count, avg_sentiment, sample_tweets, timestamp)
                VALUES (%s, %s, %s, %s, %s, %s)
            """

            cursor.execute(query, (
                data['game_id'],
                data['rigging_index'],
                data['tweet_count'],
                data['avg_sentiment'],
                Json({
                    'tweets': data['sample_tweets'],
                    'keywords': data.get('keyword_stats', {}),
                    'fallback_mode': data.get('fallback_mode', False)
                }),
                data['timestamp']
            ))

            self.conn.commit()
            cursor.close()

            self.stats['inserts'] += 1
            logger.info(
                f"✓ Inserted twitter data for {data['game_id']} | "
                f"Rigging: {data['rigging_index']:.4f} | "
                f"Tweets: {data['tweet_count']}"
            )
            return True

        except psycopg2.OperationalError as e:
            logger.error(f"❌ Operational error (will retry): {e}")
            self.stats['errors'] += 1
            try:
                self.conn.rollback()
                self.connect()  # Try to reconnect
            except:
                pass
            return False

        except Exception as e:
            logger.error(f"❌ Error inserting twitter data: {e}")
            self.stats['errors'] += 1
            try:
                self.conn.rollback()
            except:
                pass
            return False

    def archive_old_data(self, days_old=7) -> bool:
        """
        Archive data older than N days
        Phase 1新增: 数据归档防止表过大
        """
        try:
            cursor = self.conn.cursor()
            cutoff_date = datetime.utcnow() - timedelta(days=days_old)

            # 创建归档表（如果不存在）
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS twitter_data_archive AS
                SELECT * FROM twitter_data WHERE 1=0
            """)

            # 移动旧数据到归档表
            cursor.execute("""
                INSERT INTO twitter_data_archive
                SELECT * FROM twitter_data
                WHERE timestamp < %s
            """, (cutoff_date,))

            archived_count = cursor.rowcount

            # 删除已归档的数据
            cursor.execute("""
                DELETE FROM twitter_data
                WHERE timestamp < %s
            """, (cutoff_date,))

            self.conn.commit()
            cursor.close()

            if archived_count > 0:
                logger.info(f"📦 Archived {archived_count} old records (>{days_old} days)")

            return True

        except Exception as e:
            logger.error(f"❌ Error archiving data: {e}")
            self.conn.rollback()
            return False

    def get_stats(self) -> dict:
        """Get database operation statistics"""
        return self.stats

    def close(self):
        """Close database connection gracefully"""
        if self.conn:
            try:
                self.conn.close()
                logger.info(f"✓ Database connection closed | Stats: {self.stats}")
            except Exception as e:
                logger.error(f"❌ Error closing connection: {e}")
