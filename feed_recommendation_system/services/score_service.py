from db.connection import get_pool

async def get_post_stats(post_ids: list[str]) -> dict:
    if not post_ids:
        return {}
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT
                p.post_id,
                COUNT(DISTINCT l.like_id)    AS likes,
                COUNT(DISTINCT c.comment_id) AS comments,
                COUNT(DISTINCT s.share_id)   AS shares
            FROM posts p
            LEFT JOIN likes    l ON l.post_id = p.post_id
            LEFT JOIN comments c ON c.post_id = p.post_id
            LEFT JOIN shares   s ON s.post_id = p.post_id
            WHERE p.post_id = ANY($1::int[])
            GROUP BY p.post_id
            """,
            post_ids
        )
    return {r["post_id"]: dict(r) for r in rows}


def calculate_scores(
    posts: list[dict],
    user_interests: list[dict],
    user_location_id: str,
    stats: dict
) -> list[dict]:

    interest_ids = {i["interest_id"] for i in user_interests}

    scored = []
    for post in posts:
        # ── Interest score (50%) ──────────────────
        interest_score = 1.0 if post.get("interest_id") in interest_ids else 0.0

        # ── Activity score (30%) ─────────────────
        s = stats.get(post["post_id"], {})
        raw = (
            int(s.get("likes", 0)) +
            int(s.get("comments", 0)) * 2 +
            int(s.get("shares", 0)) * 3
        )
        activity_score = min(raw / 1000, 1.0)

        # ── Location score (20%) ─────────────────
        location_score = 1.0 if post.get("location_id") == user_location_id else 0.0

        # ── Final weighted score ──────────────────
        final_score = (
            interest_score  * 0.5 +
            activity_score  * 0.3 +
            location_score  * 0.2
        )

        scored.append({**post, "final_score": round(final_score, 4)})

    return scored