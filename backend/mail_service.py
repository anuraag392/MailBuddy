import os
import base64
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from email.mime.text import MIMEText

def get_gmail_service(token):
    creds = Credentials(token)
    service = build('gmail', 'v1', credentials=creds)
    return service

def list_messages(token, max_results=20):
    service = get_gmail_service(token)
    results = service.users().messages().list(userId='me', maxResults=max_results).execute()
    messages = results.get('messages', [])
    
    email_list = []
    for msg in messages:
        details = get_message_details(service, msg['id'])
        email_list.append(details)
    return email_list

def get_message_details(service, msg_id):
    msg = service.users().messages().get(userId='me', id=msg_id, format='full').execute()
    payload = msg['payload']
    headers = payload.get('headers', [])
    
    subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
    sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown')
    
    snippet = msg.get('snippet', '')
    
    return {
        "id": msg_id,
        "subject": subject,
        "sender": sender,
        "snippet": snippet,
        "body": snippet # Simplified for now
    }

def send_message(token, to, subject, body):
    service = get_gmail_service(token)
    message = MIMEText(body)
    message['to'] = to
    message['subject'] = subject
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    body = {'raw': raw}
    service.users().messages().send(userId='me', body=body).execute()
