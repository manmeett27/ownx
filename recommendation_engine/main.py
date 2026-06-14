from fastapi import FastAPI
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from recommender import ImplicitSocialRecommender

app = FastAPI(title="Social Media Recommender Network API")
engine = None 

@app.on_event("startup")
def startup_event():
    global engine
    print("Spinning up environment and initializing mock dataset logs...")
    
    # Build 50 simulated app users divided across Lucknow and Delhi
    users_df = pd.DataFrame({
        'username': [f'user_{i}' for i in range(50)],
        'location': np.random.choice(['Lucknow', 'Delhi'], 50)
    })
    
    # Build 1,500 random clickstream logs mapping users to post IDs (numbered 1000-1200)
    mock_logs = []
    for _ in range(1500):
        mock_logs.append({
            'username': np.random.choice(users_df['username']),
            'post_id': np.random.randint(1000, 1200),
            'weight': np.random.choice([1, 3, 5], p=[0.7, 0.2, 0.1]), # views, likes, shares
            'created_at': datetime.now() - timedelta(days=np.random.randint(0, 5))
        })
    interactions_df = pd.DataFrame(mock_logs)
    
    # Initialize engine and fit the model
    engine = ImplicitSocialRecommender(users_df, interactions_df)
    engine.prepare_sparse_matrices()
    engine.train_als_model()
    print("Recommendation system trained and actively waiting for network requests.")

@app.get("/feed")
def get_user_feed(username: str, location: str):
    """Web endpoint to fetch a customized home feed for a user."""
    result = engine.get_recommendations(username, location)
    return {
        "username": username,
        "location": location,
        "recommendation_type": result["type"],
        "recommended_post_ids": result["posts"]
    }