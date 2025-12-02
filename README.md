# MailBuddy - AI Mail Assistant

A production-level web application for managing emails with AI.

## Features
- **Email Classification**: Automatically categorizes emails (Work, Social, Spam, etc.).
- **Fake Domain Detection**: Flags suspicious senders.
- **Smart Replies**: Generates context-aware replies using Gemini AI.
- **ERP Integration**: Fetches order status from DB to enrich replies.
- **Automation**: Scheduled GitHub Actions to process emails in the background.

## Tech Stack (0 Cost)
- **Frontend**: Next.js 14, Tailwind CSS, Shadcn UI (Vercel)
- **Backend**: Python FastAPI (Render)
- **Database**: Neon (Postgres)
- **AI**: Google Gemini API

## Quick Start

1.  **Setup Environment**: Copy `.env.example` to `.env` and fill in keys.
2.  **Install Backend**:
    ```bash
    cd backend
    pip install -r requirements.txt
    python -m uvicorn main:app --reload
    ```
3.  **Install Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
4.  **Run Automation**:
    ```bash
    python backend/process_emails.py
    ```
