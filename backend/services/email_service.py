import imaplib
import email
from email.header import decode_header
from email.utils import parsedate_to_datetime
from dotenv import load_dotenv
import os
import base64
from datetime import datetime, timedelta

load_dotenv()

GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")

def connect_imap():
    import socket
    socket.setdefaulttimeout(10)
    mail = imaplib.IMAP4_SSL("imap.gmail.com", 993)
    mail.login(GMAIL_USER, GMAIL_APP_PASSWORD)
    return mail

def decode_str(value):
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="ignore")
    return value

def fetch_unread_emails(limit=5):
    try:
        mail = connect_imap()
        mail.select("inbox")

        since_date = (datetime.now() - timedelta(days=1)).strftime("%d-%b-%Y")
        _, message_numbers = mail.search(None, f'(UNSEEN SINCE {since_date})')

        nums = message_numbers[0].split()
        nums = nums[-limit:]

        skip_domains = [
            'noreply@', 'no-reply@', 'newsletter@', 'mailer.',
            'notifications@', 'digest@', 'donotreply@',
            'info@join.', 'alerts@', 'update@', 'email.hm.com',
            'leetcode.com', 'quora.com', 'linkedin.com',
            'internshala.com', 'indeed.com', 'groww.in',
            'netflix.com', 'jio.com', 'naukri.com'
        ]

        email_list = []

        for num in nums:
            _, msg_data = mail.fetch(num, "(RFC822)")
            raw_email = msg_data[0][1]
            msg = email.message_from_bytes(raw_email)

            subject_raw, encoding = decode_header(msg["Subject"])[0]
            subject = decode_str(subject_raw)
            sender = msg.get("From", "")

            sender_tz = None
            try:
                date_str = msg.get("Date", "")
                if date_str:
                    parsed_date = parsedate_to_datetime(date_str)
                    if parsed_date.tzinfo:
                        sender_tz = str(parsed_date.tzinfo)
            except Exception:
                pass

            sender_lower = sender.lower()
            if any(domain in sender_lower for domain in skip_domains):
                mail.store(num, "+FLAGS", "\\Seen")
                continue

            body = ""
            attachments = []

            if msg.is_multipart():
                for part in msg.walk():
                    content_type = part.get_content_type()
                    disposition = str(part.get("Content-Disposition", ""))
                    if "attachment" in disposition:
                        filename = part.get_filename()
                        if filename:
                            file_data = base64.b64encode(
                                part.get_payload(decode=True)
                            ).decode("utf-8")
                            attachments.append({
                                "filename": filename,
                                "content_type": content_type,
                                "file_data": file_data,
                            })
                    elif content_type == "text/plain" and "attachment" not in disposition:
                        body = decode_str(part.get_payload(decode=True))
                    elif content_type == "text/html" and not body:
                        body = decode_str(part.get_payload(decode=True))
            else:
                body = decode_str(msg.get_payload(decode=True))

            email_list.append({
                "sender": sender,
                "subject": subject,
                "body": body,
                "attachments": attachments,
                "sender_tz": sender_tz
            })

            mail.store(num, "+FLAGS", "\\Seen")

        mail.logout()
        return email_list

    except Exception as e:
        print(f"IMAP error: {e}")
        return []