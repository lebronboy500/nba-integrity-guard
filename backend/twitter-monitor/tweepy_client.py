"""
Twitter API Client using Tweepy
Handles authentication and tweet fetching
"""

import os
import logging
import tweepy
from typing import Optional, List, Dict

logger = logging.getLogger(__name__)


class TwitterClient:
    """Wrapper around Tweepy for Twitter API v2"""

    def __init__(self):
        """Initialize Twitter API client"""
        self.bearer_token = os.getenv('TWITTER_BEARER_TOKEN')

        if not self.bearer_token:
            logger.warning("TWITTER_BEARER_TOKEN not set. Twitter monitoring will be limited.")
            self.client = None
        else:
            self.client = tweepy.Client(
                bearer_token=self.bearer_token,
                wait_on_rate_limit=True
            )

    def search_recent_tweets(
        self,
        query: str,
        max_results: int = 100,
        tweet_fields: Optional[List[str]] = None
    ) -> List[Dict]:
        """
        Search for recent tweets matching a query

        Args:
            query: Search query string
            max_results: Maximum number of results (max 100)
            tweet_fields: Additional fields to retrieve

        Returns:
            List of tweet dictionaries
        """
        if not self.client:
            logger.warning("Twitter client not initialized")
            return []

        try:
            # Default fields
            if tweet_fields is None:
                tweet_fields = ['created_at', 'public_metrics', 'author_id']

            # Search tweets
            response = self.client.search_recent_tweets(
                query=query,
                max_results=min(max_results, 100),
                tweet_fields=tweet_fields,
                expansions=['author_id'],
                user_fields=['username', 'public_metrics']
            )

            if response.data is None:
                return []

            # Convert to list of dictionaries
            tweets = []
            for tweet in response.data:
                tweet_dict = tweet.data
                tweets.append(tweet_dict)

            logger.info(f"Fetched {len(tweets)} tweets for query: {query}")
            return tweets

        except tweepy.TweepyException as e:
            logger.error(f"Tweepy error: {e}")
            return []
        except Exception as e:
            logger.error(f"Error searching tweets: {e}")
            return []

    def get_tweet(self, tweet_id: str) -> Optional[Dict]:
        """Get a specific tweet by ID"""
        if not self.client:
            return None

        try:
            response = self.client.get_tweet(
                id=tweet_id,
                tweet_fields=['created_at', 'public_metrics']
            )
            return response.data.data if response.data else None
        except Exception as e:
            logger.error(f"Error getting tweet {tweet_id}: {e}")
            return None
