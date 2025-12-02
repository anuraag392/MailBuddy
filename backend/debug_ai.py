
import os
from dotenv import load_dotenv
import google.generativeai as genai
import time

load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

models_to_test = ['gemini-1.5-flash', 'gemini-pro', 'models/gemini-1.5-flash-latest']

for model_name in models_to_test:
    print(f"Testing {model_name}...")
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Hello")
        print(f"SUCCESS with {model_name}")
        break
    except Exception as e:
        print(f"FAILED {model_name}: {e}")
        time.sleep(1)
