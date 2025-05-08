import pandas as pd
import numpy as np
import joblib
import logging
import time
from datetime import datetime
import os
from flask import Flask, request, jsonify
import threading
import queue
from pymongo import MongoClient
from bson.json_util import dumps
from sklearn.preprocessing import StandardScaler, LabelEncoder

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('detection.log'),
        logging.StreamHandler()
    ]
)

class HTTPAttackDetector:
    def __init__(self):
        # Initialize MongoDB connection
        self.mongo_client = MongoClient('mongodb://localhost:27017/')
        self.db = self.mongo_client['threat_detection']
        self.threats_collection = self.db['threats']

        # Create indexes for faster queries
        self.threats_collection.create_index([('timestamp', -1)])
        self.threats_collection.create_index([('ip', 1)])
        self.threats_collection.create_index([('attack_type', 1)])

        # Define label mapping
        self.label_mapping = {
            'PortScan': 'Port scan',
            'SQLi': 'SQL Injection',
            'XSS': 'XSS Attack',
            'BruteForce': 'Brute Force',
            'benign': 'BENIGN'
        }

        # Get the latest model files from dataset/models
        model_dir = 'dataset/models'
        model_files = [f for f in os.listdir(model_dir) if f.startswith('security_model_')]
        if not model_files:
            raise FileNotFoundError("No model files found in dataset/models directory")
        
        # Sort by timestamp and get the latest
        latest_model = sorted(model_files)[-1]
        # Extract the full timestamp from the filename (e.g., '20250502_205949')
        timestamp = '_'.join(latest_model.split('_')[2:]).split('.')[0]

        # Load the model, scaler, and label encoder
        self.model = joblib.load(os.path.join(model_dir, f'security_model_{timestamp}.joblib'))
        self.scaler = joblib.load(os.path.join(model_dir, f'scaler_{timestamp}.joblib'))
        self.label_encoder = joblib.load(os.path.join(model_dir, f'label_encoder_{timestamp}.joblib'))

        self.request_queue = queue.Queue()
        self.detection_thread = None
        self.is_running = False
        
        # Create alerts directory if it doesn't exist
        os.makedirs('alerts', exist_ok=True)

        logging.info("Security Attack Detector initialized")

    def extract_features(self, request_data):
        """Extract features from HTTP request data"""
        try:
            # Log the raw request data
            logging.debug(f"Raw request data: {request_data}")

            # If features are already provided in the request, use them
            if 'features' in request_data:
                features = request_data['features']
                # Convert to DataFrame with exact same column order as training
                feature_order = [
                    'email_length', 'password_length', 'password_special_chars', 'is_post', 'is_login_endpoint',
                    'user_agent_length', 'ip_octet_1', 'ip_octet_2', 'ip_octet_3', 'ip_octet_4',
                    'time_since_last', 'body_field_count', 'has_sql', 'has_script', 'hour', 'day',
                    'is_gmail', 'is_yahoo', 'is_outlook', 'dummy'
                ]
                features_df = pd.DataFrame([features])[feature_order]
            else:
                # Extract features from request data
                features = {
                    'email_length': len(request_data.get('email', '')),
                    'password_length': len(request_data.get('password', '')),
                    'password_special_chars': len([c for c in request_data.get('password', '') if not c.isalnum()]),
                    'is_post': 1 if request_data.get('method') == 'POST' else 0,
                    'is_login_endpoint': 1 if request_data.get('endpoint') == '/api/login' else 0,
                    'user_agent_length': len(request_data.get('user_agent', '')),
                    'ip_octet_1': int(request_data.get('ip', '0.0.0.0').split('.')[0]),
                    'ip_octet_2': int(request_data.get('ip', '0.0.0.0').split('.')[1]),
                    'ip_octet_3': int(request_data.get('ip', '0.0.0.0').split('.')[2]),
                    'ip_octet_4': int(request_data.get('ip', '0.0.0.0').split('.')[3]),
                    'time_since_last': request_data.get('time_since_last', 0),
                    'body_field_count': len(request_data.get('body', {})),
                    'has_sql': 1 if any(kw in request_data.get('password', '').lower() 
                                      for kw in ['select', 'union', 'where', 'from', 'or', 'and', 
                                               'exec', 'execute', 'insert', 'update', 'delete',
                                               'drop', 'table', 'database']) else 0,
                    'has_script': 1 if any(pattern in request_data.get('password', '').lower() 
                                         for pattern in ['<script', 'javascript:', 'onerror=', 'onload=',
                                                        'onmouseover=', 'alert(', 'document.', 'window.']) else 0,
                    'hour': datetime.now().hour,
                    'day': datetime.now().weekday(), 
                    'is_gmail': 1 if request_data.get('email', '').endswith('@gmail.com') else 0,
                    'is_yahoo': 1 if request_data.get('email', '').endswith('@yahoo.com') else 0,
                    'is_outlook': 1 if request_data.get('email', '').endswith('@outlook.com') else 0,
                    'dummy': 0
                }

                # Convert to DataFrame with exact same column order as training
                feature_order = [
                    'email_length', 'password_length', 'password_special_chars', 'is_post', 'is_login_endpoint',
                    'user_agent_length', 'ip_octet_1', 'ip_octet_2', 'ip_octet_3', 'ip_octet_4',
                    'time_since_last', 'body_field_count', 'has_sql', 'has_script', 'hour', 'day',
                    'is_gmail', 'is_yahoo', 'is_outlook', 'dummy'
                ]
                features_df = pd.DataFrame([features])[feature_order]
            
            # Log the DataFrame before scaling
            logging.debug(f"Features DataFrame: {features_df}")

            # Scale the features
            features_scaled = self.scaler.transform(features_df)

            # Log the scaled features for debugging
            logging.debug(f"Scaled features: {features_scaled}")

            return features_scaled
        except Exception as e:
            logging.error(f"Error extracting features: {str(e)}")
            return None
        
    def map_label_to_threat_type(self, label):
        """Map model labels to backend threat types"""
        return self.label_mapping.get(label, 'UNKNOWN')
    
    def detect_attack(self, request_data):
        """Detect if the request is an attack using the trained model"""
        try:
            # Extract and scale features
            features = self.extract_features(request_data)
            if features is None:
                return None, None
            
            # Make prediction
            prediction = self.model.predict(features)[0]
            probabilities = self.model.predict_proba(features)[0]

            # Convert prediction back to original label
            prediction_label = self.label_encoder.inverse_transform([prediction])[0]

            # Map to threat type
            threat_type = self.map_label_to_threat_type(prediction_label)

            # Get the confidence for the predicted class
            confidence = float(probabilities[prediction])

            # Log the raw model output
            logging.debug(f"Raw model prediction: {prediction}")
            logging.debug(f"Raw prediction label: {prediction_label}")
            logging.debug(f"Raw probabilities: {dict(zip(self.label_encoder.classes_, probabilities))}")
            logging.debug(f"Model classes: {self.label_encoder.classes_}")
            logging.debug(f"Selected confidence: {confidence}")

            # If confidence is too low, default to BENIGN
            if confidence < 0.5:
                threat_type = 'BENIGN'
                confidence = 1.0 - confidence

            return threat_type, confidence
        except Exception as e:
            logging.error(f"Error in attack detection: {str(e)}")
            return None, None
        
    def log_to_mongodb(self, request_data, prediction, probability):
        """Log the threat to MongoDB"""
        try:
            threat_document = {
                'timestamp': datetime.now(),
                'ip': request_data.get('ip'),
                'endpoint': request_data.get('endpoint'),
                'method': request_data.get('method'),
                'threatType': prediction,  # Changed from attack_type to threatType
                'probability': float(max(probability)) if probability is not None else 0.0,
                'email': request_data.get('email'),
                'user_agent': request_data.get('user_agent'),
                'request_data': request_data
            }
            
            # Insert into MongoDB
            self.threats_collection.insert_one(threat_document)
            logging.info(f"Threat logged to MongoDB: {prediction} from IP {request_data.get('ip')}")
        except Exception as e:
            logging.error(f"Error logging to MongoDB: {str(e)}")

    def log_alert(self, request_data, prediction, probability):
        """Log detected attacks"""
        try:
            # Log to CSV file
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            alert_data = {
                'timestamp': timestamp,
                'ip': request_data.get('ip'),
                'endpoint': request_data.get('endpoint'),
                'method': request_data.get('method'),

