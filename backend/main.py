from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv
from mail_service import list_messages, get_message_details, send_message
from ai_service import classify_email, generate_reply

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Email(BaseModel):
    id: str
    snippet: Optional[str] = None
    subject: Optional[str] = None
    sender: Optional[str] = None
    body: Optional[str] = None
    category: Optional[str] = None
    summary: Optional[str] = None
    is_fake: Optional[bool] = False

class ClassifyRequest(BaseModel):
    subject: str
    body: str
    sender: str
    message_id: str

class ReplyRequest(BaseModel):
    subject: str
    body: str
    to: str
    context_id: Optional[str] = None

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/emails", response_model=List[Email])
def get_emails(token: str = Header(None), max_results: int = 20):
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        messages = list_messages(token, max_results=max_results)
        return messages
    except Exception as e:
        print(f"Error fetching emails: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/classify")
def classify_email_endpoint(request: ClassifyRequest):
    try:
        result = classify_email(request.subject, request.body)
        return result
    except Exception as e:
        print(f"Error classifying email: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-reply")
def generate_reply_endpoint(request: ReplyRequest):
    try:
        reply = generate_reply(request.subject, request.body, request.to)
        return {"reply": reply}
    except Exception as e:
        print(f"Error generating reply: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/send-reply")
def send_reply_endpoint(request: ReplyRequest, token: str = Header(None)):
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        send_message(token, request.to, request.subject, request.body)
        return {"status": "success"}
    except Exception as e:
        print(f"Error sending reply: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
