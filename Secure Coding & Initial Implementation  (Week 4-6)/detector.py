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
