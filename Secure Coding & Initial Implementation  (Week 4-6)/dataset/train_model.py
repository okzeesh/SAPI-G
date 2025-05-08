import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.ensemble import RandomForestClassifier
import joblib
from datetime import datetime
import re
from joblib import parallel_backend
import warnings
import os
import matplotlib.pyplot as plt
import seaborn as sns
warnings.filterwarnings('ignore', category=UserWarning, module='joblib')

def extract_features(df):
    """Extract and engineer features from raw data"""
    
     # Copy the dataframe to avoid modifying the original
    df = df.copy()
    
   # 1. Basic text features
    df['email_length'] = df['email'].str.len()
    df['password_length'] = df['password'].str.len().fillna(0)
    df['password_special_chars'] = df['password'].str.count(r'[^a-zA-Z0-9]').fillna(0)
    df['is_post'] = 1  # All requests in dataset are POST
    df['is_login_endpoint'] = (df['endpoint'] == '/api/login').astype(int)
    df['user_agent_length'] = df['user_agent'].str.len().fillna(0)
    
    # 2. IP-based features
    ip_parts = df['ip'].str.split('.', expand=True)
    df['ip_octet_1'] = ip_parts[0].astype(float).fillna(0).astype(int)
    df['ip_octet_2'] = ip_parts[1].astype(float).fillna(0).astype(int)
    df['ip_octet_3'] = ip_parts[2].astype(float).fillna(0).astype(int)
    df['ip_octet_4'] = ip_parts[3].astype(float).fillna(0).astype(int)
    
     # 3. Time-based features
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df['time_since_last'] = df.groupby('ip')['timestamp'].diff().dt.total_seconds().fillna(0)
    df['time_since_last'] = df['time_since_last'].clip(0, 3600)  # Cap at 1 hour
    
    # 4. Request features
    df['body_field_count'] = 2  # email and password fields
    
     # 5. Attack pattern features
    sql_pattern = r'(?:select|union|where|from|or|and|exec|execute|insert|update|delete|drop|table|database)'
    xss_pattern = r'(?:<script|javascript:|onerror=|onload=|onmouseover=|alert\(|document\.|window\.)'
    
    df['has_sql'] = df['password'].str.contains(sql_pattern, case=False, na=False).astype(int)
    df['has_script'] = df['password'].str.contains(xss_pattern, case=False, na=False).astype(int)
    
    # 6. Time features
    df['hour'] = df['timestamp'].dt.hour
    df['day'] = df['timestamp'].dt.dayofweek
    
     # 7. Email domain features
    df['is_gmail'] = df['email'].str.endswith('@gmail.com').astype(int)
    df['is_yahoo'] = df['email'].str.endswith('@yahoo.com').astype(int)
    df['is_outlook'] = df['email'].str.endswith('@outlook.com').astype(int)
    
    # 8. Dummy feature
    df['dummy'] = 0
    
    return df

def preprocess_data(df):
    """Preprocess the data for model training"""
    # Extract features
    df = extract_features(df)
    # Define feature order to match backend
    feature_order = [
        'email_length', 'password_length', 'password_special_chars', 'is_post', 'is_login_endpoint',
        'user_agent_length', 'ip_octet_1', 'ip_octet_2', 'ip_octet_3', 'ip_octet_4',
        'time_since_last', 'body_field_count', 'has_sql', 'has_script', 'hour', 'day',
        'is_gmail', 'is_yahoo', 'is_outlook', 'dummy'
    ]
    
     # Separate features and target
    X = df[feature_order]
    y = df['label']
    
    # Encode target variable
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )