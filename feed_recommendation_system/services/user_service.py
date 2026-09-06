from db.connection import get_pool

async def fetch_user(user_id: int):
    pool = await get_pool()
    if not pool:
        return {"user_id": user_id, "username": f"user_{user_id}", "location_id": 1, "location_name": "Lucknow"}
    try:
        async with pool.acquire() as conn:
            user = await conn.fetchrow(
                """
                SELECT u.*, l.location_name
                FROM users u
                LEFT JOIN locations l ON u.location_id = l.location_id
                WHERE u.user_id = $1
                """,
                user_id
            )
        return dict(user) if user else None
    except Exception as e:
        print(f"[User Service Error] {e}")
        return {"user_id": user_id, "username": f"user_{user_id}", "location_id": 1, "location_name": "Lucknow"}


async def fetch_user_interests(user_id: int):
    pool = await get_pool()
    if not pool:
        return [{"interest_id": 1, "interest_name": "Technology", "score": 0.8}, {"interest_id": 2, "interest_name": "Food & Health", "score": 0.5}]
    try:
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT i.interest_id, i.interest_name, uis.score
                FROM user_interests ui
                JOIN interests i ON ui.interest_id = i.interest_id
                LEFT JOIN user_interest_scores uis
                       ON uis.user_id = ui.user_id
                      AND uis.category_id = i.interest_id
                WHERE ui.user_id = $1
                """,
                user_id
            )
        return [dict(r) for r in rows] if rows else [{"interest_id": 1, "interest_name": "Technology", "score": 0.8}]
    except Exception as e:
        print(f"[User Service Error] {e}")
        return [{"interest_id": 1, "interest_name": "Technology", "score": 0.8}]