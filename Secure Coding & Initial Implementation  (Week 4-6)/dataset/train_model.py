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
    