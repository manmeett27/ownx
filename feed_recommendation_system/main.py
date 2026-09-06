import os
import sys

# Ensure service directory is on sys.path for relative module imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from routes.feed import router as feed_router

app = FastAPI(title="OWNX Feed Recommendation System API", version="1.0")

app.include_router(feed_router, prefix="/feed")

@app.get("/")
async def root():
    return {"service": "OWNX Feed Recommendation System API", "status": "online"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5002)