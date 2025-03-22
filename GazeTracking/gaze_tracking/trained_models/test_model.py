import numpy as np
import scipy.io
import cv2
import os
from sklearn.model_selection import train_test_split
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, Flatten, Dense
from tensorflow.keras.optimizers import Adam

# Step 1: Load the metadata
metadata = scipy.io.loadmat('metadata.mat')
labels = metadata['labels']  # Example for extracting labels (adjust based on the dataset format)

# Step 2: Load images and preprocess
image_folder = 'images/'
images = []
for filename in os.listdir(image_folder):
    img = cv2.imread(os.path.join(image_folder, filename))
    img = cv2.resize(img, (224, 224))  # Resize to match the input size of the model
    images.append(img)

# Convert images to numpy array
X = np.array(images)
y = np.array(labels)

# Step 3: Split the dataset into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Step 4: Build a simple CNN model
model = Sequential([
    Conv2D(32, (3, 3), activation='relu', input_shape=(224, 224, 3)),
    Conv2D(64, (3, 3), activation='relu'),
    Flatten(),
    Dense(128, activation='relu'),
    Dense(2)  # Assuming 2 output values (x, y coordinates of gaze)
])

model.compile(optimizer=Adam(), loss='mse')

# Step 5: Train the model
model.fit(X_train, y_train, epochs=10, batch_size=32)

# Step 6: Evaluate the model
test_loss = model.evaluate(X_test, y_test)
print(f'Test Loss: {test_loss}')
