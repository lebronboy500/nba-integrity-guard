"""
Database Manager for Twitter Monitor
Handles PostgreSQL connections and data storage
"""

import os
import logging
import psycopg2
from psycopg2.extras import Json
from datetime import datetime

logger = logging.getLogger(__name__)


class DatabaseManager:
    """Manages database connections and operations"""

    def __init__(self):
        """Initialize database connection"""
        self.conn = None
        self.connect()

    def connect(self):
        """Establish database connection"""
        try:
            self.conn = psycopg2.connect(
                host=os.getenv('POSTGRES_HOST', 'localhost'),
                port=os.getenv('POSTGRES_PORT', 5432),
                database=os.getenv('POSTGRES_DB', 'nba_integrity'),
                user=os.getenv('POSTGRES_USER', 'admin'),
                password=os.getenv('POSTGRES_PASSWORD', 'password')
            )
            logger.info("Connected to PostgreSQL database")
        except Exception as e:
            logger.error(f"Error connecting to database: {e}")
            raise

    def insert_twitter_data(self, data: dict) -> bool:
        """Insert Twitter data into database"""
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
                Json(data['sample_tweets']),
                data['timestamp']
            ))

            self.conn.commit()
            cursor.close()
            logger.info(f"Inserted twitter data for {data['game_id']}")
            return True

        except Exception as e:
            logger.error(f"Error inserting twitter data: {e}")
            self.conn.rollback()
            return False

    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            logger.info("Database connection closed")
