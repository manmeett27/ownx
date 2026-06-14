import os
import pandas as pd
import numpy as np
import scipy.sparse as sparse
import implicit
from datetime import datetime, timedelta

os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"

class ImplicitSocialRecommender:
    def __init__(self, users_df, interactions_df):
        self.users = users_df
        self.interactions = interactions_df
        self.user_to_idx = {}
        self.idx_to_user = {}
        self.post_to_idx = {}
        self.idx_to_post = {}
        self.user_items_sparse = None
        self.model = None

    def prepare_sparse_matrices(self):
        """Compresses behavioral tables into small matrix representations."""
        if self.interactions.empty:
            return

        # Aggregate interaction tracking weights per user-post pair
        grouped = self.interactions.groupby(['username', 'post_id'])['weight'].sum().reset_index()

        grouped['username'] = grouped['username'].astype('category')
        grouped['post_id'] = grouped['post_id'].astype('category')

        # Build translation tables between string names and integer matrix coordinates
        self.user_to_idx = dict(enumerate(grouped['username'].cat.categories))
        self.user_to_idx = {v: k for k, v in self.user_to_idx.items()}
        self.idx_to_user = {k: v for k, v in self.user_to_idx.items()}

        self.post_to_idx = dict(enumerate(grouped['post_id'].cat.categories))
        self.post_to_idx = {v: k for k, v in self.post_to_idx.items()}
        self.idx_to_post = {k: v for k, v in self.post_to_idx.items()}

        # Generate memory-efficient Compressed Sparse Row matrix
        self.user_items_sparse = sparse.csr_matrix(
            (grouped['weight'].astype(np.float32), 
            (grouped['username'].cat.codes, grouped['post_id'].cat.codes)),
            shape=(len(self.user_to_idx), len(self.post_to_idx))
        )

    def train_als_model(self):
        """Runs Alternating Least Squares matrix factorization optimization."""
        if self.user_items_sparse is None:
            return
        
        self.model = implicit.als.AlternatingLeastSquares(
            factors=64, 
            regularization=0.1, 
            iterations=15, 
            random_state=42
        )
        self.model.fit(self.user_items_sparse, show_progress=False)

    def get_recommendations(self, username, location, num_recs=5):
        """Routes request to Geographic Popularity or Personalization."""
        # Phase 1: New User Cold Start
        if username not in self.user_to_idx or self.model is None:
            return {"type": "location_trending", "posts": self._get_location_trending(location, num_recs)}

        # Phase 2: Implicit Collaborative Filtering
        user_idx = self.user_to_idx[username]
        ids, _ = self.model.recommend(
            userid=user_idx, 
            user_items=self.user_items_sparse[user_idx], 
            N=num_recs, 
            filter_already_liked_items=True
        )
        return {"type": "personalized", "posts": [self.idx_to_post[idx] for idx in ids]}

    def _get_location_trending(self, location, num_recs):
        """Calculates trending posts inside a specific geographic region over 7 days."""
        seven_days_ago = datetime.now() - timedelta(days=7)
        merged = self.interactions.merge(self.users, on='username')
        
        local_recent = merged[(merged['location'] == location) & (merged['created_at'] >= seven_days_ago)]
        if local_recent.empty:
            local_recent = self.interactions[self.interactions['created_at'] >= seven_days_ago]
            
        trending = local_recent.groupby('post_id')['weight'].sum().reset_index()
        trending = trending.sort_values(by='weight', ascending=False)
        return trending['post_id'].head(num_recs).tolist()