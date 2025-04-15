# 🍛 SavourAI – Your Smart Indian Cooking Companion

SavourAI is an AI-powered recipe recommendation chatbot designed to revolutionize Indian home cooking. By analyzing fridge ingredients through image recognition and user preferences, SavourAI generates personalized Indian recipes on the fly — whether you're a novice cook or a kitchen pro.

## 🚀 Features

- 🔍 **Smart Ingredient Detection** – Upload an image of your fridge, and our CNN (with Gemini API) identifies the ingredients.
- 🧠 **AI-Powered Recipe Recommendations** – Suggests recipes using content-based and collaborative filtering algorithms.
- 📦 **Comprehensive Recipe Database** – Includes traditional Indian recipes with ingredients, instructions, and nutritional info.
- 🌱 **Sustainable Cooking** – Helps reduce food waste by recommending meals using what you already have.
- 🌍 **Cross-Platform UI** – Built with React and Flask, optimized for all screen sizes and accessibility standards.

---

## 🧩 Tech Stack

- **Frontend:** React.js  
- **Backend:** Flask (Python)  
- **Database:** MongoDB  
- **ML/AI:** CNN, Gemini API  
- **Recommendation Engine:** Content-based + Collaborative Filtering

---

## 📸 Screenshots

<img src="screenshots/upload.png" width="400" />  
*Upload Interface*

<img src="screenshots/results.png" width="400" />  
*Recipe Suggestions*

---

## 🛠️ Installation & Setup

```bash
# Clone the repository
git clone https://github.com/your-username/SavourAI.git
cd SavourAI

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Run the Flask backend
cd backend
python app.py

# Run the frontend
cd ../frontend
npm install
npm start
