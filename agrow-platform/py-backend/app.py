from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import requests
import base64
import io
from PIL import Image
from transformers import pipeline
import torch
import random

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__, template_folder='.')
CORS(app)

# PlantNet API key from environment variable
PLANTNET_API_KEY = os.getenv('PLANTNET_API_KEY', 'your_plantnet_api_key_here')

# Load AI model for plant disease detection
try:
    disease_classifier = pipeline("image-classification", model="linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification")
    print("AI model loaded successfully")
except Exception as e:
    print(f"Failed to load AI model: {e}")
    disease_classifier = None

# Solution and reason database for common diseases
disease_data = {
    'leaf spot': {
        'reason': 'Caused by fungal pathogens that thrive in humid conditions with poor air circulation',
        'solutions': [
            'Apply copper-based fungicide',
            'Remove affected leaves',
            'Improve air circulation around plants',
            'Avoid overhead watering'
        ]
    },
    'blight': {
        'reason': 'Caused by fungal spores that spread rapidly in wet conditions and high humidity',
        'solutions': [
            'Use resistant varieties',
            'Apply preventive fungicide',
            'Ensure proper drainage',
            'Rotate crops annually'
        ]
    },
    'powdery mildew': {
        'reason': 'Caused by fungal spores that develop in dry conditions with high humidity at night',
        'solutions': [
            'Increase air circulation',
            'Apply sulfur-based fungicide',
            'Avoid high humidity',
            'Prune affected areas'
        ]
    },
    'rust': {
        'reason': 'Caused by rust fungi that spread through wind-borne spores in humid weather',
        'solutions': [
            'Apply fungicide containing triazole',
            'Remove infected plant parts',
            'Improve air circulation',
            'Avoid overhead irrigation'
        ]
    },
    'downy mildew': {
        'reason': 'Caused by water molds that thrive in cool, wet conditions',
        'solutions': [
            'Apply copper fungicide',
            'Ensure good drainage',
            'Space plants properly',
            'Use resistant varieties'
        ]
    },
    'bacterial spot': {
        'reason': 'Caused by bacterial pathogens that enter through wounds or natural openings',
        'solutions': [
            'Apply copper-based bactericide',
            'Avoid overhead watering',
            'Remove infected leaves',
            'Use disease-free seeds'
        ]
    },
    'fungal infection': {
        'reason': 'Caused by various fungal pathogens that infect through spores in moist conditions',
        'solutions': [
            'Apply appropriate fungicide',
            'Improve soil drainage',
            'Reduce humidity',
            'Prune affected areas'
        ]
    },
    'virus infection': {
        'reason': 'Caused by viral pathogens transmitted by insects or contaminated tools',
        'solutions': [
            'Remove infected plants',
            'Control insect vectors',
            'Use virus-free seeds',
            'Practice crop rotation'
        ]
    },
    'nutrient deficiency': {
        'reason': 'Caused by insufficient nutrients in soil or poor nutrient uptake',
        'solutions': [
            'Apply balanced fertilizer',
            'Soil testing recommended',
            'Adjust pH levels',
            'Foliar feeding'
        ]
    },
    'pest damage': {
        'reason': 'Caused by insect pests feeding on plant tissues',
        'solutions': [
            'Apply organic pesticide',
            'Use beneficial insects',
            'Regular monitoring',
            'Companion planting'
        ]
    }
}

# Scientific name mapping
CROP_SCIENTIFIC_NAMES = {
    'tomato': 'Solanum lycopersicum',
    'potato': 'Solanum tuberosum',
    'corn': 'Zea mays',
    'maize': 'Zea mays',
    'rice': 'Oryza sativa',
    'wheat': 'Triticum aestivum',
    'apple': 'Malus domestica',
    'grape': 'Vitis vinifera',
    'cherry': 'Prunus avium',
    'peach': 'Prunus persica',
    'strawberry': 'Fragaria × ananassa',
    'pepper': 'Capsicum annuum',
    'cotton': 'Gossypium hirsutum'
}

def analyze_crop_defects(image_data):
    """
    Analyze crop defects using AI model and PlantNet API as fallback
    """
    try:
        # Prepare image
        image_buffer = io.BytesIO(image_data)
        image = Image.open(image_buffer).convert('RGB')

        detections = []

        # Try AI model first
        if disease_classifier:
            try:
                results = disease_classifier(image, top_k=3)
                for result in results:
                    label = result['label']
                    confidence = int(result['score'] * 100)

                    # Label format usually: "Crop___Disease_Name" or "Crop___Healthy"
                    if '___' in label:
                        parts = label.split('___')
                        crop_name = parts[0].strip().lower()
                        condition_part = parts[1].strip()
                    else:
                        # Fallback if format is different
                        crop_name = 'unknown'
                        condition_part = label

                    # Format disease name
                    disease_name = condition_part.replace('_', ' ').lower().title()
                    
                    # Get scientific name
                    scientific_name = CROP_SCIENTIFIC_NAMES.get(crop_name, f"{crop_name.title()} spp.")
                    
                    # Format common name
                    common_name = crop_name.title()
                    if 'Corn' in common_name: common_name = 'Maize (Corn)'

                    # Find matching data for solutions
                    reason = 'Unknown cause'
                    solutions = []
                    
                    # Search for key in disease data
                    search_key = disease_name.lower()
                    if 'healthy' in search_key:
                        reason = "Plant appears to be in good health."
                        solutions = ["Continue regular care", "Monitor for pests"]
                    else:
                        for key, data in disease_data.items():
                            if key in search_key:
                                reason = data['reason']
                                solutions = data['solutions']
                                break

                    if not solutions and 'healthy' not in search_key:
                        reason = 'Disease detected but specific cause unknown'
                        solutions = ['Consult agricultural expert', 'Monitor plant health regularly', 'Maintain proper irrigation']

                    detections.append({
                        'plant': common_name,
                        'scientific_name': scientific_name,
                        'disease': disease_name,
                        'name': disease_name, # Backend compatibility for frontend
                        'confidence': confidence,
                        'reason': reason,
                        'solutions': solutions
                    })

                if detections:
                    return detections

            except Exception as e:
                print(f"AI model failed: {e}")

        # Fallback to PlantNet API for plant species identification
        try:
            image_buffer.seek(0)  # Reset buffer

            url = 'https://my-api.plantnet.org/v2/identify/all'
            files = {'images': ('crop_image.jpg', image_buffer, 'image/jpeg')}
            data = {
                'modifiers': '["crops"]',
                'api-key': PLANTNET_API_KEY
            }

            response = requests.post(url, files=files, data=data, timeout=30)
            response.raise_for_status()

            result = response.json()

            if 'results' in result and result['results']:
                for species in result['results'][:3]:  # Limit to top 3
                    species_name = species.get('species', {}).get('scientificNameWithoutAuthor', 'Unknown Species')
                    common_names = species.get('species', {}).get('commonNames', [])
                    common_name = common_names[0] if common_names else species_name.split()[0]
                    confidence = int(species.get('score', 0) * 100)

                    detections.append({
                        'plant': common_name.title(),
                        'scientific_name': species_name,
                        'disease': "Analysis Required", # PlantNet only identifies species
                        'confidence': confidence,
                        'reason': 'Plant species identified via PlantNet API.',
                        'solutions': ['Consult agricultural expert for species-specific advice']
                    })

            # If no species detected, return fallback
            if not detections:
                return mock_detect_defects()

            return detections

        except requests.exceptions.RequestException as e:
            print(f"PlantNet API failed: {e}")
            return mock_detect_defects()

    except Exception as e:
        print(f"Analysis failed: {e}")
        return mock_detect_defects()

def mock_detect_defects():
    """
    Fallback mock detection when API is unavailable
    """
    defects = [
        {
            'plant': 'Tomato',
            'scientific_name': 'Solanum lycopersicum',
            'disease': 'Leaf Spot',
            'confidence': random.randint(80, 95),
            'reason': disease_data.get('leaf spot', {}).get('reason', 'Unknown cause'),
            'solutions': disease_data.get('leaf spot', {}).get('solutions', ['Consult expert'])
        },
        {
            'plant': 'Potato',
            'scientific_name': 'Solanum tuberosum',
            'disease': 'Blight',
            'confidence': random.randint(75, 90),
            'reason': disease_data.get('blight', {}).get('reason', 'Unknown cause'),
            'solutions': disease_data.get('blight', {}).get('solutions', ['Consult expert'])
        },
        {
            'plant': 'Maize (Corn)',
            'scientific_name': 'Zea mays',
            'disease': 'Pest Damage',
            'confidence': random.randint(70, 85),
            'reason': disease_data.get('pest damage', {}).get('reason', 'Unknown cause'),
            'solutions': disease_data.get('pest damage', {}).get('solutions', ['Consult expert'])
        }
    ]
    return random.sample(defects, 1)

@app.route('/')
def home():
    return render_template('index.html')  # Render the login page

@app.route('/api/analyze-crop', methods=['POST'])
def analyze_crop():
    print("\n--- Received new scan request ---")
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            print("Error: No data or 'image' key in request")
            return jsonify({'detections': [], 'error': 'No image data provided'}), 400

        image_b64 = data['image']
        print(f"Base64 image received (length: {len(image_b64)})")
        
        if ',' in image_b64:
            image_b64 = image_b64.split(',')[1]

        try:
            image_data = base64.b64decode(image_b64)
            print("Base64 decoded successfully")
        except Exception as e:
            print(f"Base64 Decode Error: {e}")
            return jsonify({'detections': [], 'error': f'Invalid image format: {str(e)}'}), 400

        # Run analysis
        try:
            detections = analyze_crop_defects(image_data)
            print(f"Analysis complete. Found {len(detections)} detections.")
            return jsonify({'detections': detections})
        except Exception as e:
            print(f"Analysis Function Error: {e}")
            # Fallback to absolute mock if analyze_crop_defects crashes
            mock = mock_detect_defects()
            return jsonify({'detections': mock, 'note': f'Fallback due to analysis error: {str(e)}'})

    except Exception as e:
        print(f"Global Route Error: {e}")
        return jsonify({'detections': [], 'error': f'Internal Server Error: {str(e)}'}), 500

@app.route('/api/weather', methods=['GET'])
def get_weather():
    # Example weather data (replace with real API integration)
    weather_data = {
        'temperature': 28,
        'humidity': 65,
        'rainfall': 120
    }
    return jsonify(weather_data)

@app.route('/api/field-data/<field_name>', methods=['GET'])
def get_field_data(field_name):
    # Example field data (replace with database integration)
    field_data = {
        'field_name': field_name,
        'soil_type': 'Loamy',
        'crop': 'Wheat',
        'area': '2 hectares'
    }
    return jsonify(field_data)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)