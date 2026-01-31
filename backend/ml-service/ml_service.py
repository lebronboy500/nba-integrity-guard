"""
RandomForest ML Service for NBA Integrity Guard
Trains and evaluates models on game rigging signals
"""

import os
import json
import pickle
import logging
from datetime import datetime
from typing import Dict, List, Tuple, Any
import numpy as np
import pandas as pd
import psycopg2
from psycopg2.extras import RealDictCursor
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import joblib
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

class MLService:
    """
    RandomForest-based ML service for signal classification
    """

    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.model_version = None
        self.features = [
            'rigging_index',
            'anomaly_score',
            'tweet_count',
            'avg_sentiment',
            'hour_of_day',
            'day_of_week'
        ]
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': int(os.getenv('DB_PORT', 5432)),
            'database': os.getenv('DB_NAME', 'nba_integrity'),
            'user': os.getenv('DB_USER', 'admin'),
            'password': os.getenv('DB_PASSWORD', 'password')
        }

    def load_training_data(self) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Load labeled signals from signal_ground_truth table
        """
        try:
            conn = psycopg2.connect(**self.db_config)
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            query = """
            SELECT
                sgt.rigging_index,
                sgt.anomaly_score,
                COALESCE(td.tweet_count, 0) as tweet_count,
                COALESCE(td.avg_sentiment, 0) as avg_sentiment,
                EXTRACT(HOUR FROM sgt.timestamp)::int as hour_of_day,
                EXTRACT(DOW FROM sgt.timestamp)::int as day_of_week,
                sgt.manual_label as label
            FROM signal_ground_truth sgt
            LEFT JOIN twitter_data td ON sgt.game_id = td.game_id
            WHERE sgt.manual_label IS NOT NULL
            ORDER BY sgt.labeled_at DESC
            """

            cursor.execute(query)
            rows = cursor.fetchall()
            conn.close()

            if not rows:
                logger.warning("No labeled data found in database")
                return None, None

            df = pd.DataFrame(rows)
            X = df[self.features]
            y = df['label'].astype(int)

            logger.info(f"Loaded {len(df)} labeled signals for training")
            logger.info(f"Class distribution: {y.value_counts().to_dict()}")

            return X, y

        except Exception as e:
            logger.error(f"Error loading training data: {e}")
            raise

    def train_model(self, test_size=0.2, random_state=42) -> Dict[str, Any]:
        """
        Train RandomForest classifier on labeled signals
        """
        try:
            X, y = self.load_training_data()

            if X is None or y is None:
                return {
                    'success': False,
                    'error': 'Insufficient labeled data for training'
                }

            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=random_state, stratify=y
            )

            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)

            # Train RandomForest
            self.model = RandomForestClassifier(
                n_estimators=100,
                max_depth=15,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=random_state,
                n_jobs=-1,
                class_weight='balanced'
            )

            self.model.fit(X_train_scaled, y_train)

            # Evaluate
            train_pred = self.model.predict(X_train_scaled)
            test_pred = self.model.predict(X_test_scaled)

            metrics = {
                'training_accuracy': float(accuracy_score(y_train, train_pred)),
                'training_precision': float(precision_score(y_train, train_pred, zero_division=0)),
                'training_recall': float(recall_score(y_train, train_pred, zero_division=0)),
                'training_f1_score': float(f1_score(y_train, train_pred, zero_division=0)),
                'validation_accuracy': float(accuracy_score(y_test, test_pred)),
                'validation_f1_score': float(f1_score(y_test, test_pred, zero_division=0))
            }

            logger.info(f"Training complete. Metrics: {metrics}")

            # Save model version to database
            self.model_version = self._save_model_version(metrics, len(X))

            return {
                'success': True,
                'model_version': self.model_version,
                'metrics': metrics,
                'training_samples': len(X_train),
                'validation_samples': len(X_test)
            }

        except Exception as e:
            logger.error(f"Error training model: {e}")
            return {'success': False, 'error': str(e)}

    def predict(self, rigging_index: float, anomaly_score: float,
                tweet_count: int = 0, avg_sentiment: float = 0) -> Dict[str, Any]:
        """
        Predict label for a signal
        """
        try:
            if self.model is None:
                # Try to load from disk
                self._load_latest_model()

            if self.model is None:
                return {
                    'success': False,
                    'error': 'No trained model available'
                }

            # Get temporal features from current time
            from datetime import datetime
            now = datetime.utcnow()
            hour_of_day = now.hour
            day_of_week = now.weekday()

            # Create feature vector
            features = np.array([[
                rigging_index,
                anomaly_score,
                tweet_count,
                avg_sentiment,
                hour_of_day,
                day_of_week
            ]])

            features_scaled = self.scaler.transform(features)

            prediction = self.model.predict(features_scaled)[0]
            probability = self.model.predict_proba(features_scaled)[0]
            confidence = float(max(probability))

            # Get feature importance
            feature_importance = dict(zip(
                self.features,
                self.model.feature_importances_.tolist()
            ))

            return {
                'success': True,
                'prediction': bool(prediction),  # True = rigged, False = normal
                'confidence': confidence,
                'probability_normal': float(probability[0]),
                'probability_rigged': float(probability[1]),
                'feature_importance': feature_importance,
                'model_version': self.model_version
            }

        except Exception as e:
            logger.error(f"Error making prediction: {e}")
            return {'success': False, 'error': str(e)}

    def _save_model_version(self, metrics: Dict, training_samples: int) -> int:
        """
        Save model version to database
        """
        try:
            conn = psycopg2.connect(**self.db_config)
            cursor = conn.cursor()

            query = """
            INSERT INTO model_versions (
                model_name, model_type, version_number,
                training_data_count,
                training_accuracy, training_precision, training_recall, training_f1_score,
                validation_accuracy, validation_f1_score,
                hyperparameters, feature_list, is_active, deployed_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            RETURNING id
            """

            hyperparams = {
                'n_estimators': 100,
                'max_depth': 15,
                'min_samples_split': 5,
                'min_samples_leaf': 2,
                'class_weight': 'balanced'
            }

            cursor.execute(query, (
                'random_forest_rigging_detector',
                'random_forest',
                1,
                training_samples,
                metrics['training_accuracy'],
                metrics['training_precision'],
                metrics['training_recall'],
                metrics['training_f1_score'],
                metrics['validation_accuracy'],
                metrics['validation_f1_score'],
                json.dumps(hyperparams),
                json.dumps(self.features),
                True
            ))

            model_id = cursor.fetchone()[0]
            conn.commit()

            # Save model to disk
            model_path = f'/models/random_forest_v{model_id}.pkl'
            os.makedirs('/models', exist_ok=True)
            joblib.dump(self.model, model_path)
            joblib.dump(self.scaler, f'/models/scaler_v{model_id}.pkl')

            # Update model_path in database
            update_query = "UPDATE model_versions SET model_path = %s WHERE id = %s"
            cursor.execute(update_query, (model_path, model_id))
            conn.commit()
            conn.close()

            logger.info(f"Model version {model_id} saved successfully")
            return model_id

        except Exception as e:
            logger.error(f"Error saving model version: {e}")
            return None

    def _load_latest_model(self):
        """
        Load the latest active model from database
        """
        try:
            conn = psycopg2.connect(**self.db_config)
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            query = """
            SELECT id, model_path FROM model_versions
            WHERE is_active = TRUE
            ORDER BY deployed_at DESC
            LIMIT 1
            """

            cursor.execute(query)
            result = cursor.fetchone()
            conn.close()

            if result and result['model_path'] and os.path.exists(result['model_path']):
                self.model = joblib.load(result['model_path'])
                scaler_path = result['model_path'].replace('random_forest', 'scaler')
                if os.path.exists(scaler_path):
                    self.scaler = joblib.load(scaler_path)
                self.model_version = result['id']
                logger.info(f"Loaded model version {self.model_version}")
            else:
                logger.warning("No active model found in database")

        except Exception as e:
            logger.error(f"Error loading latest model: {e}")


def get_service() -> MLService:
    """Factory function to get MLService instance"""
    return MLService()
