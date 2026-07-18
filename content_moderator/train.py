import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from PIL import Image
from model import ContentModerationCNN

# Define class mapping
CLASS_MAP = {
    "alchol": 0,
    "drugs": 1,
    "sexual": 2,
    "smoking": 3,
    "violence": 4,
    "weapons": 5
}
CLASS_NAMES = ["alcohol", "drugs", "sexual", "smoking", "violence", "weapons"]

class SocialMediaDataset(Dataset):
    def __init__(self, image_dir, transform=None):
        self.image_dir = image_dir
        self.transform = transform
        self.images = []
        self.labels = []
        
        if not os.path.exists(image_dir):
            raise FileNotFoundError(f"Image directory {image_dir} not found.")
            
        for filename in os.listdir(image_dir):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                # Find matching label based on file name prefix
                matched_label = None
                for key, val in CLASS_MAP.items():
                    if key in filename.lower():
                        matched_label = val
                        break
                
                if matched_label is not None:
                    self.images.append(os.path.join(image_dir, filename))
                    self.labels.append(matched_label)
                    
        print(f"Loaded {len(self.images)} images for training across {len(CLASS_NAMES)} classes.")

    def __len__(self):
        return len(self.images)

    def __getitem__(self, idx):
        img_path = self.images[idx]
        label = self.labels[idx]
        
        # Load image as RGB
        try:
            image = Image.open(img_path).convert("RGB")
        except Exception as e:
            # Fallback to empty image if load fails
            image = Image.new("RGB", (224, 224))
            
        if self.transform:
            image = self.transform(image)
            
        return image, label

def train_model():
    # Setup data paths (relative or absolute)
    # The media directory is at d:\social_media\ownx\media\images
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    image_dir = os.path.join(base_dir, "media", "images")
    
    # Preprocessing & Data Augmentation
    train_transforms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    try:
        dataset = SocialMediaDataset(image_dir, transform=train_transforms)
    except Exception as e:
        print(f"Error loading dataset: {e}")
        return
        
    if len(dataset) == 0:
        print("No images found in the dataset folder. Training cancelled.")
        return
        
    dataloader = DataLoader(dataset, batch_size=8, shuffle=True)
    
    # Device configuration
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training on device: {device}")
    
    # Initialize Model, Loss, Optimizer
    model = ContentModerationCNN(num_classes=6).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=0.001, weight_decay=0.01)
    
    # Training loop
    epochs = 25
    model.train()
    for epoch in range(epochs):
        running_loss = 0.0
        correct = 0
        total = 0
        
        for images, labels in dataloader:
            images, labels = images.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item() * images.size(0)
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
            
        epoch_loss = running_loss / len(dataset)
        epoch_acc = (correct / total) * 100
        print(f"Epoch [{epoch+1}/{epochs}] - Loss: {epoch_loss:.4f} - Accuracy: {epoch_acc:.2f}%")
        
    # Save Model Weights
    output_model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "moderator_model.pth")
    torch.save(model.state_dict(), output_model_path)
    print(f"Model saved successfully to {output_model_path}")

if __name__ == "__main__":
    train_model()
