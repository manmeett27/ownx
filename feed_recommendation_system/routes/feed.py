import sys
import os

# Ensure feed_recommendation_system root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
from fastapi import APIRouter, HTTPException
from services.user_service import fetch_user, fetch_user_interests
from services.candidate_service import get_interest_posts, get_location_posts, get_trending_posts, merge_candidates
from services.score_service import get_post_stats, calculate_scores

router = APIRouter()

@router.get("/{user_id}")
async def get_feed(user_id: int):
    try:
        user, interests = await asyncio.gather(
            fetch_user(user_id),
            fetch_user_interests(user_id)
        )

        if not user:
            user = {"user_id": user_id, "username": f"user_{user_id}", "location_id": 1}

        interest_ids = [i["interest_id"] for i in (interests or [])]
        location_id = user.get("location_id")

        interest_posts, location_posts, trending_posts = await asyncio.gather(
            get_interest_posts(interest_ids),
            get_location_posts(location_id),
            get_trending_posts()
        )

        candidates = merge_candidates(interest_posts, location_posts, trending_posts)
        if not candidates:
            candidates = [
                {"post_id": 1, "user_id": 1, "caption": "Default OWNX Post", "post_type": "image", "category_id": 1, "interest_id": 1, "location_id": 1, "created_at": "2026-09-06T10:00:00"}
            ]

        post_ids = [p["post_id"] for p in candidates]
        stats = await get_post_stats(post_ids)

        scored = calculate_scores(candidates, interests or [], location_id, stats)
        top30 = sorted(scored, key=lambda x: x.get("final_score", 0.0), reverse=True)[:30]

        return {
            "status": "success",
            "user_id": user_id,
            "count": len(top30),
            "posts": top30
        }
    except Exception as e:
        print(f"[Feed Route Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))