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
    
     # Scale numerical features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    return X_train_scaled, X_test_scaled, y_train, y_test, label_encoder, scaler

def train_model(X_train, y_train, X_test, y_test):
    """Train and tune the Random Forest model"""
    # Calculate class weights based on your dataset distribution
    class_weights = {
        0: 1.0,  # benign
        1: 1.2,  # SQLi
        2: 1.2,  # XSS
        3: 1.2,  # BruteForce
        4: 1.2   # PortScan - reduced from 2.0 to 1.2 to prevent bias
    }
    
    # Create sample weights based on class weights
    sample_weights = np.array([class_weights[label] for label in y_train])
     # Create base model
    model = RandomForestClassifier(
        random_state=42,
        class_weight='balanced',
        n_jobs=-1
    )
    
    # Define parameter grid for tuning
    param_grid = {
        'n_estimators': [100, 200],
        'max_depth': [4, 6],
        'min_samples_split': [2, 5],
        'min_samples_leaf': [1, 2],
        'max_features': ['sqrt', 'log2']
    }
    
    # Perform grid search with cross-validation
    try:
        print("Starting model training...")
        print(f"Total parameter combinations to try: {len(param_grid['n_estimators']) * len(param_grid['max_depth']) * len(param_grid['min_samples_split']) * len(param_grid['min_samples_leaf']) * len(param_grid['max_features'])}")
        
        grid_search = GridSearchCV(
            estimator=model,
            param_grid=param_grid,
            scoring='f1_weighted',
            cv=3,
            n_jobs=1,
            verbose=2,
            error_score='raise',
            return_train_score=True
        )
        
         # Fit the model with sample weights
        grid_search.fit(X_train, y_train, sample_weight=sample_weights)
        
        print("\nBest parameters found:")
        print(grid_search.best_params_)
        
        # Get the best model
        best_model = grid_search.best_estimator_
        
        # Train the best model
        print("\nTraining final model with best parameters...")
        best_model.fit(X_train, y_train, sample_weight=sample_weights)
        
        return best_model
    except Exception as e:
        print(f"Error during model training: {str(e)}")
        raise
    
def evaluate_model(model, X_test, y_test, label_encoder):
    """Evaluate the model performance and save plots"""
    # Create results directory if it doesn't exist
    os.makedirs('results', exist_ok=True)
    # Make predictions
    y_pred = model.predict(X_test)
    # Print classification report
    print("\nClassification Report:")
    report = classification_report(
        y_test, y_pred,
        target_names=label_encoder.classes_,
        digits=4
    )
    
    print(report)
    
    # Save classification report to file
    with open('results/classification_report.txt', 'w') as f:
        f.write(report)
        
        # Create and save confusion matrix plot
    plt.figure(figsize=(10, 8))