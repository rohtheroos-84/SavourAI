from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from PIL import Image
import base64
from io import BytesIO
import logging
import random
import torch
import torchvision.models as models

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configure Gemini API
genai.configure(api_key="AIzaSyCd1DKra7QgWnPeUh3sWi4m7XibJlc7eTg")

def resnet_inference(image):
    """
    This function simulates running inference using a ResNet model.
    It loads a pre-trained ResNet model, preprocesses the image, and
    returns a dummy output. Note that this function is not used in processing.
    """
    logger.debug("Loading pre-trained ResNet model...")
    resnet = models.resnet50(pretrained=True)
    resnet.eval()
    
    # Dummy preprocessing and inference (this is just a placeholder)
    logger.debug("Running ResNet inference (simulation)...")
    dummy_output = torch.tensor([random.random() for _ in range(1000)])
    top_prediction = dummy_output.argmax().item()
    logger.debug(f"ResNet predicted class index: {top_prediction}")
    return {"predicted_class": top_prediction, "dummy_output": dummy_output.tolist()}

def ml_model_inference(image):
    """
    This function simulates running an ML model on the image.
    It generates random inference details and logs the process.
    The returned output is not used in further processing.
    """
    logger.debug("ML model loaded. Running inference on the image...")
    result = random.choice(["detected", "not detected", "uncertain"])
    confidence = random.uniform(0.5, 1.0)
    logger.debug(f"ML inference result: {result} with confidence {confidence:.2f}")
    return {"result": result, "confidence": confidence}

def get_recipes_from_ingredients(ingredients_str, meal_type="any", servings=2, dietary_type="", spice_level="medium", cooking_time="", calories="", allergies=""):
    """Generate recipes using Gemini API"""
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        
        # Build dietary restrictions string
        dietary_restrictions = []
        if dietary_type:
            dietary_restrictions.append(dietary_type)
        if allergies:
            dietary_restrictions.append(f"avoid {allergies}")
        dietary_str = ", ".join(dietary_restrictions)
        
        # Build cooking constraints string
        constraints = []
        if cooking_time == "quick":
            constraints.append("cooking time under 30 minutes")
        elif cooking_time == "medium":
            constraints.append("cooking time between 30-60 minutes")
        elif cooking_time == "leisure":
            constraints.append("cooking time over 60 minutes")
        
        if calories == "light":
            constraints.append("under 300 calories per serving")
        elif calories == "medium":
            constraints.append("between 300-500 calories per serving")
        elif calories == "high":
            constraints.append("over 500 calories per serving")
        
        constraints_str = ". ".join(constraints)

        prompt = f"""
Given these ingredients: {ingredients_str}

Generate 5 popular Indian {meal_type if meal_type != "any" else ""} recipes that can be made with the following requirements:
- Dietary preferences: {dietary_str if dietary_str else "none specified"}
- Spice level: {spice_level}
{f"- Constraints: {constraints_str}" if constraints_str else ""}

Format each recipe as follows:

Recipe 1: [Recipe Name]
(and continue with Recipe 2, Recipe 3, etc. for subsequent recipes)

Ingredients:
• List each ingredient with quantities on new lines (adjusted for {servings} servings)
• Start each ingredient line with a bullet point (•)
• Include any additional ingredients needed beyond those provided

Instructions:
1. List each step on a new line
2. Number each step sequentially
3. Be clear and concise

Nutritional Information (per Serving):
• Calories: XXX kcal
• Protein: XXX g
• Carbs: XXX g
• Fat: XXX g

[Repeat the same format for remaining recipes]

Keep each recipe concise but informative. Ensure each section (Ingredients, Instructions, Nutritional Information) is clearly labeled and formatted exactly as shown above.
"""
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Error generating recipes: {str(e)}")
        raise

@app.route('/upload', methods=['POST'])
def upload():
    try:
        # Handle text input
        if request.is_json:
            logger.info("Processing text input")
            data = request.get_json()
            if not data or 'ingredients' not in data:
                return jsonify({"error": "No ingredients provided"}), 400
            
            ingredients = data['ingredients']
            ingredients_str = ", ".join(ingredients)
            meal_type = data.get('mealType', 'any')
            servings = data.get('servings', 2)
            dietary_type = data.get('dietaryType', '')
            spice_level = data.get('spiceLevel', 'medium')
            cooking_time = data.get('cookingTime', '')
            calories = data.get('calories', '')
            allergies = data.get('allergies', '')
            
            logger.info(f"Ingredients received: {ingredients_str}")
            recipes = get_recipes_from_ingredients(
                ingredients_str, 
                meal_type, 
                servings,
                dietary_type,
                spice_level,
                cooking_time,
                calories,
                allergies
            )
            return jsonify({"recipes": recipes})

        # Handle image input
        elif 'file' in request.files:
            logger.info("Processing image input")
            file = request.files['file']
            meal_type = request.form.get('mealType', 'any')
            servings = request.form.get('servings', 2)
            dietary_type = request.form.get('dietaryType', '')
            spice_level = request.form.get('spiceLevel', 'medium')
            cooking_time = request.form.get('cookingTime', '')
            calories = request.form.get('calories', '')
            allergies = request.form.get('allergies', '')
            
            if not file:
                return jsonify({"error": "No file uploaded"}), 400

            # Process image and detect ingredients
            img = Image.open(file)
            logger.info("Image opened successfully")
            
            # Use Gemini Flash to detect ingredients
            model = genai.GenerativeModel("gemini-2.0-flash")
            
            # Convert image for Gemini API
            img_bytes = BytesIO()
            img.save(img_bytes, format='JPEG')
            img_bytes = img_bytes.getvalue()
            
            # First detect ingredients from image using the Gemini API
            vision_prompt = """
Look at this image and list all the food ingredients you can identify.
Only list the ingredients, separated by commas. Be specific but concise.
Do not include any other text or explanations.
"""
            
            vision_response = model.generate_content([
                vision_prompt,
                {"mime_type": "image/jpeg", "data": img_bytes}
            ])
            
            # Get recipes for detected ingredients
            detected_ingredients = vision_response.text.strip()
            logger.info(f"Detected ingredients: {detected_ingredients}")
            recipes = get_recipes_from_ingredients(
                detected_ingredients,
                meal_type,
                servings,
                dietary_type,
                spice_level,
                cooking_time,
                calories,
                allergies
            )
            return jsonify({"recipes": recipes})

        else:
            return jsonify({"error": "No file or ingredients provided"}), 400

    except Exception as e:
        logger.error(f"Error in upload route: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
