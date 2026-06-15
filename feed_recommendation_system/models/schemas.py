from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Post(BaseModel):
    post_id: int
    user_id: int
    caption: Optional[str]
    post_type: str
    category_id: Optional[int]
    interest_id: Optional[int]
    location_id: Optional[int]
    created_at: datetime
    final_score: Optional[float] = 0.0

class FeedResponse(BaseModel):
    status: str
    user_id: int
    count: int
    posts: list[Post]