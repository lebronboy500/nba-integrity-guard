"""
Flask API Server for ML Service
Provides HTTP endpoints for model training and predictions
"""

import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from ml_service import MLService

app = Flask(__name__)
CORS(app)

# Initialize ML service
ml_service = MLService()

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'ml-service',
        'model_loaded': ml_service.model is not None
    }), 200


@app.route('/api/ml/train', methods=['POST'])
def train_model():
    """
    Train a new RandomForest model
    POST /api/ml/train
    """
    try:
        logger.info("Starting model training...")
        result = ml_service.train_model()
        return jsonify(result), 200 if result['success'] else 400
    except Exception as e:
        logger.error(f"Training error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/ml/predict', methods=['POST'])
def predict():
    """
    Make prediction for a signal
    POST /api/ml/predict
    Body: {
        "rigging_index": 0.75,
        "anomaly_score": 0.82,
        "tweet_count": 150,
        "avg_sentiment": 0.45
    }
    """
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['rigging_index', 'anomaly_score']
        if not all(field in data for field in required_fields):
            return jsonify({
                'success': False,
                'error': 'Missing required fields: rigging_index, anomaly_score'
            }), 400

        # Get optional fields
        tweet_count = data.get('tweet_count', 0)
        avg_sentiment = data.get('avg_sentiment', 0)

        result = ml_service.predict(
            rigging_index=float(data['rigging_index']),
            anomaly_score=float(data['anomaly_score']),
            tweet_count=int(tweet_count),
            avg_sentiment=float(avg_sentiment)
        )

        return jsonify(result), 200 if result['success'] else 400
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/ml/batch-predict', methods=['POST'])
def batch_predict():
    """
    Make predictions for multiple signals
    POST /api/ml/batch-predict
    Body: {
        "signals": [
            {"rigging_index": 0.75, "anomaly_score": 0.82, ...},
            ...
        ]
    }
    """
    try:
        data = request.get_json()
        signals = data.get('signals', [])

        if not isinstance(signals, list) or not signals:
            return jsonify({
                'success': False,
                'error': 'signals must be a non-empty array'
            }), 400

        predictions = []
        for signal in signals:
            result = ml_service.predict(
                rigging_index=float(signal.get('rigging_index', 0)),
                anomaly_score=float(signal.get('anomaly_score', 0)),
                tweet_count=int(signal.get('tweet_count', 0)),
                avg_sentiment=float(signal.get('avg_sentiment', 0))
            )
            if result['success']:
                predictions.append(result)

        return jsonify({
            'success': True,
            'predictions': predictions,
            'count': len(predictions)
        }), 200

    except Exception as e:
        logger.error(f"Batch prediction error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/ml/model-info', methods=['GET'])
def model_info():
    """Get information about the current model"""
    if ml_service.model is None:
        ml_service._load_latest_model()

    return jsonify({
        'success': True,
        'model_loaded': ml_service.model is not None,
        'model_version': ml_service.model_version,
        'features': ml_service.features
    }), 200


@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500


if __name__ == '__main__':
    logger.info("Starting ML Service API Server...")
    app.run(host='0.0.0.0', port=5000, debug=False)
