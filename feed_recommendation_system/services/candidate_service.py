from db.connection import get_pool

async def get_interest_posts(interest_ids: list[int]):
    if not interest_ids:
        return []
    pool = await get_pool()
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


async def get_location_posts(location_id: int):
    if not location_id:
        return []
    pool = await get_pool()
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


async def get_trending_posts():
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT p.*, COUNT(l.like_id) AS like_count
            FROM posts p
            JOIN likes l ON l.post_id = p.post_id
            WHERE l.created_at > NOW() - INTERVAL '24 hours'
            GROUP BY p.post_id
            ORDER BY like_count DESC
            LIMIT 100
            """
        )
    return [dict(r) for r in rows]


def merge_candidates(*arrays) -> list:
    seen = set()
    merged = []
    for posts in arrays:
        for post in posts:
            if post["post_id"] not in seen:
                seen.add(post["post_id"])
                merged.append(post)
    return merged