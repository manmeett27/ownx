from db.connection import get_pool

async def get_interest_posts(interest_ids: list[int]):
    if not interest_ids:
        return []
    pool = await get_pool()
    if not pool:
        return [
            {"post_id": 1, "user_id": 1, "caption": "Welcome to OWNX", "post_type": "image", "category_id": 1, "interest_id": 1, "location_id": 1, "created_at": "2026-09-06T10:00:00"}
        ]
    try:
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT * FROM posts
                WHERE interest_id = ANY($1::int[])
                ORDER BY created_at DESC
                LIMIT 200
                """,
                interest_ids
            )
        return [dict(r) for r in rows]
    except Exception as e:
        print(f"[Candidate Service Error] {e}")
        return []


async def get_location_posts(location_id: int):
    if not location_id:
        return []
    pool = await get_pool()
    if not pool:
        return [
            {"post_id": 2, "user_id": 2, "caption": "Healthy food post", "post_type": "image", "category_id": 2, "interest_id": 2, "location_id": 1, "created_at": "2026-09-06T11:00:00"}
        ]
    try:
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT * FROM posts
                WHERE location_id = $1
                ORDER BY created_at DESC
                LIMIT 100
                """,
                location_id
            )
        return [dict(r) for r in rows]
    except Exception as e:
        print(f"[Candidate Service Error] {e}")
        return []


async def get_trending_posts():
    pool = await get_pool()
    if not pool:
        return [
            {"post_id": 1, "user_id": 1, "caption": "Trending Post", "post_type": "image", "category_id": 1, "interest_id": 1, "location_id": 1, "created_at": "2026-09-06T09:00:00"}
        ]
    try:
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT p.*, COUNT(l.like_id) AS like_count
                FROM posts p
                LEFT JOIN likes l ON l.post_id = p.post_id
                GROUP BY p.post_id
                ORDER BY like_count DESC, p.created_at DESC
                LIMIT 100
                """
            )
        return [dict(r) for r in rows]
    except Exception as e:
        print(f"[Candidate Service Error] {e}")
        return []


def merge_candidates(*arrays) -> list:
    seen = set()
    merged = []
    for posts in arrays:
        for post in posts:
            if post["post_id"] not in seen:
                seen.add(post["post_id"])
                merged.append(post)
    return merged