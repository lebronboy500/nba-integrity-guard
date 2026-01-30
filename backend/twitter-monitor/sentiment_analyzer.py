"""
Sentiment Analysis Module
Uses TextBlob and VADER for sentiment analysis
"""

import logging
from textblob import TextBlob
from nltk.sentiment import SentimentIntensityAnalyzer
import nltk

logger = logging.getLogger(__name__)

# Download required NLTK data
try:
    nltk.data.find('sentiment/vader_lexicon')
except LookupError:
    nltk.download('vader_lexicon')


class SentimentAnalyzer:
    """Analyzes sentiment of text using multiple methods"""

    def __init__(self):
        """Initialize sentiment analyzer"""
        self.vader = SentimentIntensityAnalyzer()

    def analyze(self, text: str) -> float:
        """
        Analyze sentiment of text

        Returns:
            Sentiment score in range [-1.0, 1.0]
            -1.0 = very negative (high rigging suspicion)
            0.0 = neutral
            1.0 = very positive
        """
        if not text or not isinstance(text, str):
            return 0.0

        try:
            # Use VADER for social media text
            vader_scores = self.vader.polarity_scores(text)
            vader_sentiment = vader_scores['compound']  # Range: [-1, 1]

            # Use TextBlob as secondary method
            blob = TextBlob(text)
            textblob_sentiment = blob.sentiment.polarity  # Range: [-1, 1]

            # Average the two methods
            combined_sentiment = (vader_sentiment + textblob_sentiment) / 2.0

            return round(combined_sentiment, 4)

        except Exception as e:
            logger.error(f"Error analyzing sentiment: {e}")
            return 0.0

    def analyze_batch(self, texts: list) -> list:
        """Analyze sentiment for multiple texts"""
        return [self.analyze(text) for text in texts]
