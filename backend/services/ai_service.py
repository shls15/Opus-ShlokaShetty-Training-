from groq import Groq
from dotenv import load_dotenv
from bs4 import BeautifulSoup
import os
import json

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def strip_html(html_text: str) -> str:
    soup = BeautifulSoup(html_text, "html.parser")
    return soup.get_text(separator=" ").strip()

def process_email(sender: str, subject: str, body: str) -> dict:
    clean_body = strip_html(body)

    prompt = f"""
You are an AI assistant for a busy executive. Analyze this email and decide if it requires action.

Email:
Sender: {sender}
Subject: {subject}
Body: {clean_body}

STRICT RULES:
- If this is a promotional email, newsletter, advertisement, discount offer, app download request, reward/offer email, or any marketing content → return empty tasks array
- If this is a notification from a service (bank alert, OTP, delivery update) with no human action needed → return empty tasks array
- Only create tasks for emails that require a real human business action: meetings, approvals, document reviews, follow-ups from real people
- For meeting emails: extract the EXACT requested date and time if mentioned. If a specific time is mentioned (e.g. "meeting at 11am"), set requested_datetime to that value
- meet_link: extract any Google Meet, Zoom, Teams link from the body, or null
- Recurring: Detect if the sender is proposing a recurring schedule (e.g. "every Monday", "daily sync", "monthly review").

Return ONLY this JSON, no markdown, no explanation:
{{
  "summary": "2-3 sentence summary, or 'No action required' if promotional",
  "is_actionable": true or false,
  "is_recurring": true or false,
  "recurrence_pattern": "weekly or daily or monthly or null",
  "meet_link": "full URL or null",
  "requested_datetime": "ISO format datetime if specific time mentioned in email, else null",
  "tasks": [
    {{
      "title": "short task title",
      "description": "what needs to be done",
      "priority": "high or medium or low",
      "estimated_minutes": 30,
      "task_type": "meeting or review or approval or followup or report or other"
    }}
  ]
}}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=1000
    )

    raw = response.choices[0].message.content.strip()

    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        start = raw.find("{")
        end = raw.rfind("}") + 1
        result = json.loads(raw[start:end])

    if not result.get("is_actionable", True):
        result["tasks"] = []

    return result