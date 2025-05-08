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
