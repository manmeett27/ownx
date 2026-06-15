from fastapi import FastAPI
from routes.feed import router as feed_router

app = FastAPI(title="Recommendation System", version="1.0")

app.include_router(feed_router, prefix="/feed")

@app.get("/")
async def root():
    return {"message": "Recommendation API is running"}