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
