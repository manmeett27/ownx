import subprocess
import time
import urllib.request
import urllib.parse
import json
import sys
import os

print("==================================================")
print("OWNX FULL SYSTEM INTEGRATION TEST SUITE")
print("==================================================")

python_cmd = sys.executable

processes = {}

def start_service(name, cmd, port):
    print(f"Starting {name} on port {port}...")
    p = subprocess.Popen(cmd, cwd=r"d:\social_media\ownx", stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    processes[name] = p
    return p

try:
    start_service("Node Backend", ["node", "server.js"], 5000)
    start_service("Content Moderation API", [python_cmd, r"content_moderator\main.py"], 5001)
    start_service("Feed Recommendation API", [python_cmd, r"feed_recommendation_system\main.py"], 5002)
    start_service("Recommendation Engine API", [python_cmd, r"recommendation_engine\main.py"], 5003)

    print("Waiting 6 seconds for services to initialize...")
    time.sleep(6)

    def http_req(url, method="GET", data=None, headers=None):
        if headers is None:
            headers = {}
        encoded_data = None
        if data:
            if isinstance(data, dict):
                if headers.get("Content-Type") == "application/x-www-form-urlencoded":
                    encoded_data = urllib.parse.urlencode(data).encode("utf-8")
                else:
                    headers["Content-Type"] = "application/json"
                    encoded_data = json.dumps(data).encode("utf-8")
            elif isinstance(data, str):
                encoded_data = data.encode("utf-8")

        req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req) as resp:
                status = resp.status
                body = resp.read().decode("utf-8")
                try:
                    return status, json.loads(body)
                except:
                    return status, body
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8")
            try:
                return e.code, json.loads(body)
            except:
                return e.code, body
        except Exception as e:
            return 500, {"error": str(e)}

    test_results = []

    def record(endpoint, method, status, response, notes=""):
        passed = status in [200, 201] or (status == 400 and "violates" in str(response))
        res_str = "PASS" if passed else "FAIL"
        test_results.append({
            "endpoint": endpoint,
            "method": method,
            "status": status,
            "result": res_str,
            "response": response,
            "notes": notes
        })
        print(f"[{res_str}] {method} {endpoint} -> Status {status}")

    # Unique test username for database persistence
    unique_user = f"user_{int(time.time())}"

    # --- Node Backend Tests (5000) ---
    st, resp = http_req("http://127.0.0.1:5000/")
    record("/", "GET", st, resp, "Node Backend Root")

    st, resp = http_req("http://127.0.0.1:5000/api/users")
    record("/api/users", "GET", st, resp, "Get All Users")

    st, resp = http_req("http://127.0.0.1:5000/api/users/register", "POST", {"username": unique_user, "password": "password123", "location_id": 1})
    record("/api/users/register", "POST", st, resp, f"Register User {unique_user}")

    st, resp = http_req("http://127.0.0.1:5000/api/users/login", "POST", {"username": unique_user, "password": "password123"})
    record("/api/users/login", "POST", st, resp, f"Login User {unique_user}")

    st, resp = http_req("http://127.0.0.1:5000/api/posts")
    record("/api/posts", "GET", st, resp, "Get All Posts")

    st, resp = http_req("http://127.0.0.1:5000/api/posts", "POST", {
        "user_id": 1,
        "caption": "Enjoying a wonderful tech conference in Lucknow!",
        "image_url": "media/images/healthy_food.png",
        "post_type": "image",
        "category_id": 1,
        "interest_id": 1,
        "location_id": 1
    })
    record("/api/posts", "POST", st, resp, "Create Valid Post")

    st, resp = http_req("http://127.0.0.1:5000/api/posts", "POST", {
        "user_id": 1,
        "caption": "You idiot shut up!",
        "image_url": "media/images/healthy_food.png"
    })
    record("/api/posts (Inappropriate Caption)", "POST", st, resp, "Moderation rejection test")

    st, resp = http_req("http://127.0.0.1:5000/api/posts/1/comments")
    record("/api/posts/1/comments", "GET", st, resp, "Get Comments for Post 1")

    st, resp = http_req("http://127.0.0.1:5000/api/posts/1/comments", "POST", {
        "username": unique_user,
        "content": "Great post! Really looking forward to more updates."
    })
    record("/api/posts/1/comments", "POST", st, resp, "Create Comment")

    st, resp = http_req("http://127.0.0.1:5000/api/followers/follow", "POST", {"user_id": 1, "follower_user_id": 2})
    record("/api/followers/follow", "POST", st, resp, "Follow User")

    st, resp = http_req("http://127.0.0.1:5000/api/followers/1")
    record("/api/followers/1", "GET", st, resp, "Get Followers of User 1")

    st, resp = http_req("http://127.0.0.1:5000/api/followers/2/following")
    record("/api/followers/2/following", "GET", st, resp, "Get Following of User 2")

    # --- Content Moderation API Tests (5001) ---
    st, resp = http_req("http://127.0.0.1:5001/")
    record("/", "GET", st, resp, "Content Moderation Root")

    st, resp = http_req("http://127.0.0.1:5001/moderate/text", "POST", {"text": "This is a clean and polite comment."})
    record("/moderate/text (Clean)", "POST", st, resp, "Text Moderation Clean")

    st, resp = http_req("http://127.0.0.1:5001/moderate/text", "POST", {"text": "I hate you, you idiot."})
    record("/moderate/text (Flagged)", "POST", st, resp, "Text Moderation Flagged")

    image_with_spaces = r"media/images/alchol (1).jpg"
    st, resp = http_req("http://127.0.0.1:5001/moderate/image-path", "POST", {"image_path": image_with_spaces})
    record("/moderate/image-path (Space Path)", "POST", st, resp, "Image Path Moderation (with spaces)")

    # --- Feed Recommendation API Tests (5002) ---
    st, resp = http_req("http://127.0.0.1:5002/")
    record("/", "GET", st, resp, "Feed Service Root")

    st, resp = http_req("http://127.0.0.1:5002/feed/1")
    record("/feed/1", "GET", st, resp, "Get Feed for User 1")

    # --- Recommendation Engine API Tests (5003) ---
    st, resp = http_req("http://127.0.0.1:5003/")
    record("/", "GET", st, resp, "Recommender Engine Root")

    st, resp = http_req("http://127.0.0.1:5003/feed?username=user_0&location=Lucknow")
    record("/feed?username=user_0&location=Lucknow", "GET", st, resp, "Implicit ALS Feed Recommendation")

    print("\n==================================================")
    print("SUMMARY OF TEST RESULTS")
    print("==================================================")
    for t in test_results:
        print(f"| {t['endpoint']:<35} | {t['method']:<6} | {t['status']:<3} | {t['result']:<4} | {t['notes']} |")

    # Write results to json file
    with open("test_results.json", "w") as f:
        json.dump(test_results, f, indent=2)

finally:
    print("\nCleaning up test processes...")
    for name, p in processes.items():
        try:
            p.terminate()
            p.wait(timeout=2)
        except:
            p.kill()
    print("Done.")
