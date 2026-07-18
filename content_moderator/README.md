# Running the AI Content Moderation Service

This guide provides the simple commands to run the content moderation service.

## Option 1: Automated Run (Express + AI Service)
From the root folder (`ownx`), run the consolidated batch file:
```cmd
run_moderator.bat
```
This automatically handles environment activations, checks/trains the model, starts the Express app (port 5000), and starts the FastAPI server (port 5001).

---

## Option 2: Manual Run (AI Service Only)

### 1. Activate the Virtual Environment
```cmd
recommendation_engine\.venv\Scripts\activate
```

### 2. Install Dependencies (If needed)
```cmd
pip install -r content_moderator\requirements.txt
```

### 3. Run the FastAPI Server
```cmd
python content_moderator\main.py
```
*The AI service will start listening on `http://127.0.0.1:5001`.*
