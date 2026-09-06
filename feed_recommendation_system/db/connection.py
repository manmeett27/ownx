import os

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

try:
    import asyncpg
except ImportError:
    asyncpg = None

_pool = None

async def get_pool():
    global _pool
    if asyncpg is None:
        return None
    if _pool is None:
        try:
            db_host = os.getenv("DB_HOST", "localhost")
            db_port = int(os.getenv("DB_PORT", 5432))
            db_user = os.getenv("DB_USER", "postgres")
            db_pass = os.getenv("DB_PASSWORD") or os.getenv("DB_PASS", "010203")
            db_name = os.getenv("DB_NAME", "postgres")

            is_remote = db_host not in ["localhost", "127.0.0.1"]
            ssl_mode = "require" if is_remote else None

            _pool = await asyncpg.create_pool(
                host=db_host,
                port=db_port,
                user=db_user,
                password=db_pass,
                database=db_name,
                ssl=ssl_mode,
                min_size=1,
                max_size=10,
                timeout=5.0
            )
        except Exception as e:
            print(f"[Feed DB Warning] Could not connect to PostgreSQL database: {e}")
            _pool = None
    return _pool