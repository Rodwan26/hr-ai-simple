import logging
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User

logger = logging.getLogger(__name__)

class NotificationService:
    @staticmethod
    def send_notification(
        db: Session,
        user_id: int,
        title: str,
        message: str,
        type: str = "info"
    ):
        """
        Send a notification to a user via Email.
        """
        # 1. Log to console
        logger.info(f"[NOTIFICATION] To User {user_id} [{type}]: {title} - {message}")
        
        # 2. Fetch User Email
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.email:
            logger.warning(f"User {user_id} not found or has no email. Skipping email notification.")
            return

        # 3. Check for SMTP Config
        smtp_host = os.getenv("SMTP_HOST")
        smtp_port = os.getenv("SMTP_PORT", "587")
        smtp_user = os.getenv("SMTP_USER")
        smtp_password = os.getenv("SMTP_PASSWORD")
        smtp_from = os.getenv("SMTP_FROM_EMAIL", "noreply@hr-platform.com")

        if not smtp_host or not smtp_user or not smtp_password:
            logger.warning("SMTP configuration missing. Skipping email sending.")
            return

        # 4. Send Email
        try:
            msg = MIMEMultipart()
            msg['From'] = smtp_from
            msg['To'] = user.email
            msg['Subject'] = f"[{type.upper()}] {title}"

            body = f"""
            Hello {user.full_name or 'Employee'},

            {message}

            Regards,
            HR AI Platform
            """
            msg.attach(MIMEText(body, 'plain'))

            server = smtplib.SMTP(smtp_host, int(smtp_port))
            server.starttls()
            server.login(smtp_user, smtp_password)
            text = msg.as_string()
            server.sendmail(smtp_from, user.email, text)
            server.quit()
            logger.info(f"Email sent to {user.email}")
        except Exception as e:
            logger.error(f"Failed to send email to {user.email}: {e}")

