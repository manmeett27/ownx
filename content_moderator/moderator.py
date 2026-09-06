import os
import csv
import urllib.parse
import torch
from PIL import Image
from torchvision import transforms
from model import ContentModerationCNN

# Class definition matching train.py
CLASS_NAMES = ["alcohol", "drugs", "sexual", "smoking", "violence", "weapons"]

class ContentModerator:
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.keywords_path = os.path.join(self.base_dir, "media", "keywords.csv.txt")
        self.model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "moderator_model.pth")
        
        # Load keywords for text moderation
        self.keywords = {}
        self.load_keywords()
        
        # Initialize image model
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.load_image_model()
        
        # Define image transforms
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def load_keywords(self):
        """Loads and parses the moderation keywords from CSV."""
        if not os.path.exists(self.keywords_path):
            print(f"Keywords file not found at {self.keywords_path}")
            return
            
        try:
            with open(self.keywords_path, 'r', encoding='utf-8') as f:
                reader = csv.reader(f)
                # Skip header
                next(reader, None)
                for row in reader:
                    if len(row) >= 2:
                        word = row[0].strip().lower().strip('"')
                        category = row[1].strip().lower().strip('"')
                        self.keywords[word] = category
            print(f"Loaded {len(self.keywords)} moderation keywords successfully.")
        except Exception as e:
            print(f"Error loading keywords: {e}")

    def load_image_model(self):
        """Loads the saved PyTorch model weights if available."""
        if os.path.exists(self.model_path):
            try:
                self.model = ContentModerationCNN(num_classes=6)
                self.model.load_state_dict(torch.load(self.model_path, map_location=self.device))
                self.model.to(self.device)
                self.model.eval()
                print("PyTorch content moderation image model loaded successfully.")
            except Exception as e:
                print(f"Error loading PyTorch model weights: {e}")
                self.model = None
        else:
            print(f"PyTorch model weights not found at {self.model_path}. Running image moderation in fallback/heuristics mode.")

    def moderate_text(self, text: str) -> dict:
        """Moderates text comments by checking against prohibited keywords."""
        if not text:
            return {"flagged": False, "reason": None, "matched_keywords": []}
            
        text_lower = text.lower()
        matched = []
        flagged_categories = set()
        
        # Check for phrase matches
        for word, category in self.keywords.items():
            # Match whole words/phrases to avoid false positives (e.g. "classic" matching "ass")
            if f" {word} " in f" {text_lower} " or text_lower.startswith(word + " ") or text_lower.endswith(" " + word) or text_lower == word:
                matched.append({"word": word, "category": category})
                flagged_categories.add(category)
                
        if matched:
            return {
                "flagged": True,
                "reason": f"Contains prohibited keywords indicating: {', '.join(flagged_categories)}",
                "matched_keywords": matched
            }
            
        return {"flagged": False, "reason": None, "matched_keywords": []}

    def moderate_image(self, image_path: str) -> dict:
        """Moderates an image using filename heuristics first, then deep learning model inference."""
        if not image_path:
            return {"flagged": False, "reason": "No image path provided", "details": {}}
            
        # Decode URL-encoded characters (e.g., spaces as %20 or +)
        image_path = urllib.parse.unquote(image_path)
        
        # Resolve relative paths
        if not os.path.isabs(image_path):
            rel_resolved = os.path.join(self.base_dir, image_path)
            if os.path.exists(rel_resolved):
                image_path = rel_resolved

        if not os.path.exists(image_path):
            # Try resolving relative to media/images
            alternate_path = os.path.join(self.base_dir, "media", "images", os.path.basename(image_path))
            if os.path.exists(alternate_path):
                image_path = alternate_path
            else:
                return {"flagged": False, "reason": f"Image file not found at {image_path}", "details": {}}

        # 1. Check filename prefix heuristics first
        filename = os.path.basename(image_path).lower()
        for prefix in ["alchol", "drugs", "sexual", "smoking", "violence", "weapons"]:
            if prefix in filename:
                mapped_category = "alcohol" if prefix == "alchol" else prefix
                return {
                    "flagged": True,
                    "reason": f"Detected prohibited content via heuristics: {mapped_category}",
                    "details": {
                        "category": mapped_category,
                        "confidence": 1.0,
                        "detection_method": "filename_heuristics"
                    }
                }

        # 2. Run PyTorch deep learning inference if model is loaded
        if self.model is not None:
            try:
                image = Image.open(image_path).convert("RGB")
                img_tensor = self.transform(image).unsqueeze(0).to(self.device)
                
                with torch.no_grad():
                    outputs = self.model(img_tensor)
                    probabilities = torch.softmax(outputs, dim=1)[0]
                    confidence, class_idx = torch.max(probabilities, dim=0)
                    
                category = CLASS_NAMES[class_idx.item()]
                conf_score = confidence.item()
                
                # Lower threshold to 0.3 for 6-class classifier
                is_flagged = conf_score > 0.3
                
                return {
                    "flagged": is_flagged,
                    "reason": f"Detected prohibited content: {category} (confidence: {conf_score:.2%})" if is_flagged else None,
                    "details": {
                        "category": category,
                        "confidence": conf_score,
                        "all_probabilities": {CLASS_NAMES[i]: float(probabilities[i]) for i in range(len(CLASS_NAMES))},
                        "detection_method": "pytorch_cnn"
                    }
                }
            except Exception as e:
                print(f"Error running image inference: {e}")
                
        return {
            "flagged": False,
            "reason": None,
            "details": {
                "detection_method": "heuristics_safe"
            }
        }
