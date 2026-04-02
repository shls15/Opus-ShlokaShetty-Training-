import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import os

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")

def send_completion_email(recipient_email: str, task_title: str):
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Update: '{task_title}' has been completed"
        msg["From"] = SMTP_USER
        msg["To"] = recipient_email

        plain_text = f"""
Hello,

We wanted to let you know that your request '{task_title}' has been completed.

Thank you for reaching out.

Best regards,
Executive Secretary
"""

        html_text = f"""
<html>
  <body style="font-family: Arial, sans-serif; color: #333;">
    <p>Hello,</p>
    <p>We wanted to let you know that your request <strong>'{task_title}'</strong> has been completed.</p>
    <p>Thank you for reaching out.</p>
    <br/>
    <p>Best regards,<br/>Executive Secretary</p>
  </body>
</html>
"""

        msg.attach(MIMEText(plain_text, "plain"))
        msg.attach(MIMEText(html_text, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, recipient_email, msg.as_string())

        return True

    except Exception as e:
        print(f"SMTP error: {e}")
        return False