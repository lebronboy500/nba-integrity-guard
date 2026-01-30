"""
Sentiment Analysis Module - Phase 1 Enhanced
Uses TextBlob and VADER for sentiment analysis with caching and batch processing
"""

import logging
from textblob import TextBlob
from nltk.sentiment import SentimentIntensityAnalyzer
import nltk
from functools import lru_cache
import hashlib

logger = logging.getLogger(__name__)

# Download required NLTK data
try:
    nltk.data.find('sentiment/vader_lexicon')
except LookupError:
    nltk.download('vader_lexicon')


class SentimentAnalyzer:
    """
    Analyzes sentiment of text using multiple methods with caching
    Phase 1改进: 缓存常见推文, 批量处理, 更好的错误处理
    """

    def __init__(self, cache_size=1000):
        """Initialize sentiment analyzer with caching"""
        self.vader = SentimentIntensityAnalyzer()
        self.cache = {}
        self.cache_size = cache_size
        self.cache_hits = 0
        self.cache_misses = 0

    def _get_cache_key(self, text: str) -> str:
        """生成缓存键"""
        return hashlib.md5(text.encode()).hexdigest()

    def analyze(self, text: str) -> float:
        """
        Analyze sentiment of text with caching

        Returns:
            Sentiment score in range [-1.0, 1.0]
            -1.0 = very negative (high rigging suspicion)
            0.0 = neutral
            1.0 = very positive
        """
        if not text or not isinstance(text, str):
            return 0.0

        # 检查缓存
        cache_key = self._get_cache_key(text)
        if cache_key in self.cache:
            self.cache_hits += 1
            return self.cache[cache_key]

        self.cache_misses += 1

        try:
            # Use VADER for social media text (最适合推文)
            vader_scores = self.vader.polarity_scores(text)
            vader_sentiment = vader_scores['compound']  # Range: [-1, 1]

            # Use TextBlob as secondary method
            try:
                blob = TextBlob(text)
                textblob_sentiment = blob.sentiment.polarity  # Range: [-1, 1]
            except Exception as e:
                logger.debug(f"TextBlob error: {e}, using VADER only")
                textblob_sentiment = vader_sentiment

            # Average the two methods
            combined_sentiment = (vader_sentiment + textblob_sentiment) / 2.0
            result = round(combined_sentiment, 4)

            # 缓存结果
            if len(self.cache) >= self.cache_size:
                # LRU清理：删除最旧的缓存
                oldest_key = next(iter(self.cache))
                del self.cache[oldest_key]

            self.cache[cache_key] = result
            return result

        except Exception as e:
            logger.error(f"❌ Error analyzing sentiment for text '{text[:50]}...': {e}")
            return 0.0

    def analyze_batch(self, texts: list) -> list:
        """
        Analyze sentiment for multiple texts with batch statistics

        Phase 1改进: 返回详细统计信息
        """
        if not texts:
            return []

        try:
            scores = [self.analyze(text) for text in texts]

            # 计算统计信息
            if len(scores) > 0:
                avg_score = sum(scores) / len(scores)
                negative_count = sum(1 for s in scores if s < -0.3)
                positive_count = sum(1 for s in scores if s > 0.3)

                # 每处理100条日志一次缓存统计
                if (self.cache_hits + self.cache_misses) % 100 == 0:
                    hit_rate = self.cache_hits / (self.cache_hits + self.cache_misses) * 100
                    logger.debug(
                        f"📊 Cache Stats: Hit Rate={hit_rate:.1f}% "
                        f"(Hits={self.cache_hits}, Misses={self.cache_misses})"
                    )

                logger.debug(
                    f"📈 Batch Analysis: Texts={len(texts)}, "
                    f"Avg={avg_score:.4f}, "
                    f"Negative={negative_count}, "
                    f"Positive={positive_count}"
                )

            return scores

        except Exception as e:
            logger.error(f"❌ Error in batch analysis: {e}")
            return [0.0] * len(texts)

    def get_cache_stats(self) -> dict:
        """获取缓存统计"""
        total = self.cache_hits + self.cache_misses
        hit_rate = (self.cache_hits / total * 100) if total > 0 else 0

        return {
            'cache_size': len(self.cache),
            'cache_max_size': self.cache_size,
            'cache_hits': self.cache_hits,
            'cache_misses': self.cache_misses,
            'cache_hit_rate': f"{hit_rate:.1f}%"
        }
