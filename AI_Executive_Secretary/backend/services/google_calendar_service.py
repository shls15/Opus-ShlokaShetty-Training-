from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import os
import pickle
from datetime import datetime

SCOPES = ['https://www.googleapis.com/auth/calendar']
CREDENTIALS_FILE = os.path.join(os.path.dirname(__file__), '..', 'credentials.json')
TOKEN_FILE = os.path.join(os.path.dirname(__file__), '..', 'token.pickle')

def get_calendar_service():
    creds = None
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, 'rb') as token:
            creds = pickle.load(token)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(TOKEN_FILE, 'wb') as token:
            pickle.dump(creds, token)
    return build('calendar', 'v3', credentials=creds)

def create_calendar_event(title: str, description: str, start_time: datetime, end_time: datetime, attendee_email: str = None, meet_link: str = None) -> dict:
    service = get_calendar_service()

    event = {
        'summary': title,
        'description': description,
        'start': {
            'dateTime': start_time.isoformat(),
            'timeZone': 'Asia/Kolkata',
        },
        'end': {
            'dateTime': end_time.isoformat(),
            'timeZone': 'Asia/Kolkata',
        },
        'conferenceData': {
            'createRequest': {
                'requestId': f"secretary-{title[:20].replace(' ','-')}-{int(start_time.timestamp())}",
                'conferenceSolutionKey': {'type': 'hangoutsMeet'},
            }
        },
        'reminders': {
            'useDefault': False,
            'overrides': [
                {'method': 'popup', 'minutes': 15},
                {'method': 'email', 'minutes': 30},
            ],
        },
    }

    if attendee_email:
        event['attendees'] = [{'email': attendee_email}]

    if meet_link:
        event['description'] = f"{description}\n\nMeeting Link: {meet_link}"

    result = service.events().insert(
        calendarId='primary',
        body=event,
        conferenceDataVersion=1,
        sendUpdates='all' if attendee_email else 'none'
    ).execute()

    return {
        'event_id': result.get('id'),
        'meet_link': result.get('conferenceData', {}).get('entryPoints', [{}])[0].get('uri', ''),
        'html_link': result.get('htmlLink'),
    }

def delete_calendar_event(event_id: str):
    try:
        service = get_calendar_service()
        service.events().delete(calendarId='primary', eventId=event_id).execute()
        return True
    except Exception as e:
        print(f"Error deleting event: {e}")
        return False