import asyncio
from fastapi import APIRouter, HTTPException
from services.user_service      import fetch_user, fetch_user_interests
from services.candidate_service import get_interest_posts, get_location_posts, get_trending_posts, merge_candidates
from services.score_service     import get_post_stats, calculate_scores

router = APIRouter()

@router.get("/{user_id}")
async def get_feed(user_id: int):

    # 1. Fetch user + interests in parallel
    user, interests = await asyncio.gather(
        fetch_user(user_id),
        fetch_user_interests(user_id)
    )

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    interest_ids  = [i["interest_id"] for i in interests]
    location_id   = user.get("location_id")

    # 2. Generate candidates in parallel
    interest_posts, location_posts, trending_posts = await asyncio.gather(
        get_interest_posts(interest_ids),
        get_location_posts(location_id),
        get_trending_posts()
    )

    # 3. Merge + deduplicate
    candidates = merge_candidates(interest_posts, location_posts, trending_posts)

    # 4. Fetch engagement stats
    post_ids = [p["post_id"] for p in candidates]
    stats    = await get_post_stats(post_ids)

    # 5. Score all candidates
    scored = calculate_scores(candidates, interests, location_id, stats)

    # 6. Rank + take top 30
    top30 = sorted(scored, key=lambda x: x["final_score"], reverse=True)[:30]

    # 7. Return JSON
    return {
        "status":  "success",
        "user_id": user_id,
        "count":   len(top30),
        "posts":   top30
    }