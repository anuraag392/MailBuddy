import google.generativeai as genai
import os
import json
import re
import time
import random
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Use a model that supports JSON mode if possible, or just prompt engineering
model = genai.GenerativeModel('gemini-2.0-flash')

def classify_email(subject, body):
    prompt = f"""
    Analyze the following email and provide:
    1. A classification category from this list:
       - Job Ads (Generic newsletters, "jobs you might like", mass-sent "apply now" blasts, or general job lists.)
       - Job Update (Specific to the user's applications. Includes interview invitations, application status changes, offers, or direct messages from recruiters about a specific role.)
       - Fake Job (Strictly for unsolicited job offers with suspicious characteristics like high pay/low effort, generic domains, asking for money. Do NOT classify security alerts, password resets, or official updates from known companies as Fake Job.)
       - Work
       - Social
       - Promotions
       - Spam
       - Updates (Includes security warnings, terms of service updates, system notifications, and account alerts.)
    2. A short, concise summary of the email content (max 2 sentences).
    3. A boolean 'is_fake' indicating if it looks like a phishing attempt or scam. (Security alerts from legitimate domains like google.com, microsoft.com are NOT fake).

    Return the result as a valid JSON object with keys: "category", "summary", "is_fake".
    Do not include markdown formatting like ```json.

    Subject: {subject}
    Body: {body[:1000]}
    """

    max_retries = 5
    base_delay = 5

    for attempt in range(max_retries):
        try:
            response = model.generate_content(prompt)
            text = response.text.strip()
            
            # Use regex to find the JSON object
            match = re.search(r'\{.*\}', text, re.DOTALL)
            if match:
                json_str = match.group(0)
                try:
                    return json.loads(json_str)
                except json.JSONDecodeError:
                    return {"category": "Uncategorized", "summary": text[:200], "is_fake": False}
            else:
                return {"category": "Uncategorized", "summary": text[:200], "is_fake": False}
                
        except Exception as e:
            error_msg = f"Attempt {attempt + 1} failed: {e}"
            print(error_msg)
            # Try to log to a file that isn't gitignored if possible, or just rely on stdout
            try:
                with open("ai_errors.log", "a") as f:
                    f.write(f"{error_msg}\n")
            except:
                pass

            if attempt < max_retries - 1:
                sleep_time = base_delay * (2 ** attempt) + random.uniform(0, 1)
                print(f"Retrying in {sleep_time:.2f} seconds...")
                time.sleep(sleep_time)
            else:
                return {"category": "Uncategorized", "summary": "Could not generate summary after retries.", "is_fake": False}

def generate_reply(subject, body, to):
    prompt = f"""
    Generate a professional and polite reply to the following email.
    Keep it concise.

    Subject: {subject}
    Body: {body[:1000]}
    To: {to}
    """
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Error generating reply: {e}")
        return "Could not generate reply."
