import sys
import json
import joblib
import os
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

model = joblib.load(os.path.join(BASE_DIR, 'models', 'crop_model.pkl'))
scaler = joblib.load(os.path.join(BASE_DIR, 'models', 'scaler.pkl'))
encoder = joblib.load(os.path.join(BASE_DIR, 'models', 'label_encoder.pkl'))
crop_names = list(encoder.classes_)

def predict(features):
    input_array = np.array([[
        features['temperature'],
        features['humidity'],
        features['ph'],
    ]])
    input_scaled = scaler.transform(input_array)
    
    pred_class = model.predict(input_scaled)[0]
    pred_crop = encoder.inverse_transform([pred_class])[0]

    alternatives = []
    if hasattr(model, 'predict_proba'):
        proba = model.predict_proba(input_scaled)[0]
        confidence = float(np.max(proba))
        indices = np.argsort(proba)[::-1]
        for idx in indices:
            crop = encoder.inverse_transform([idx])[0]
            alternatives.append({
                'crop': crop,
                'probability': round(float(proba[idx]), 4)
            })
    else:
        confidence = 1.0

    return {
        'predicted_crop': pred_crop,
        'confidence': round(confidence, 4),
        'alternatives': alternatives,
        'all_crops': crop_names
    }

if __name__ == '__main__':
    raw = sys.stdin.read()
    data = json.loads(raw)
    result = predict(data)
    print(json.dumps(result))
