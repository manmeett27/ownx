import os
import sys
import shutil

# Ensure directory is on sys.path for relative imports regardless of CWD
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
from moderator import ContentModerator

app = FastAPI(title="OWNX Content Moderation AI Service", version="1.0")

# Initialize Content Moderator
moderator = ContentModerator()

class TextModerationRequest(BaseModel):
    text: str

class ImagePathModerationRequest(BaseModel):
    image_path: str

@app.get("/")
def root():
    return {
        "service": "OWNX Content Moderation API",
        "status": "online",
        "model_loaded": moderator.model is not None,
        "keywords_loaded_count": len(moderator.keywords)
    }

@app.post("/moderate/text")
def moderate_text(request: TextModerationRequest):
    """Checks comments or captions for prohibited keywords and categories."""
    result = moderator.moderate_text(request.text)
    return result

@app.post("/moderate/image")
async def moderate_image(
    file: Optional[UploadFile] = File(None),
    image_path: Optional[str] = Form(None)
):
    """
    Checks uploaded images for prohibited content (alcohol, drugs, nudity/sexual, smoking, violence, weapons).
    Accepts direct file uploads or a local image path.
    """
    if file is not None:
        temp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "temp")
        os.makedirs(temp_dir, exist_ok=True)
        
        temp_file_path = os.path.join(temp_dir, file.filename)
        try:
            with open(temp_file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
                
            result = moderator.moderate_image(temp_file_path)
            return result
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")
        finally:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
                
    elif image_path is not None:
        result = moderator.moderate_image(image_path)
        return result
        
    else:
        raise HTTPException(status_code=400, detail="Must provide either an uploaded file or an image_path.")

@app.post("/moderate/image-path")
def moderate_image_path(request: ImagePathModerationRequest):
    """Endpoint specifically for checking images by path (used by local database integrations)."""
    result = moderator.moderate_image(request.image_path)
    return result

@app.post("/reload")
def reload_service():
    """Reloads the keyword definitions and model weights from disk."""
    global moderator
    moderator = ContentModerator()
    return {
        "status": "reloaded",
        "model_loaded": moderator.model is not None,
        "keywords_loaded_count": len(moderator.keywords)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5001)
