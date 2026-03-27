"""Email service for sending OTP emails"""

import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails"""
    
    def __init__(
        self,
        smtp_server: str = "smtp.gmail.com",
        smtp_port: int = 587,
        sender_email: str = None,
        sender_password: str = None
    ):
        """
        Initialize email service
        
        Args:
            smtp_server: SMTP server address
            smtp_port: SMTP port
            sender_email: Sender email address
            sender_password: Sender email password
        """
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.sender_email = sender_email
        self.sender_password = sender_password
    
    def send_otp_email(
        self,
        recipient_email: str,
        otp_code: str,
        expires_in_minutes: int = 5
    ) -> bool:
        """
        Send OTP email to recipient
        
        Args:
            recipient_email: Email address to send OTP to
            otp_code: OTP code to send
            expires_in_minutes: OTP expiration time in minutes
        
        Returns:
            True if email sent successfully, False otherwise
        """
        try:
            if not self.sender_email or not self.sender_password:
                logger.warning("Email service not configured. Skipping email send.")
                logger.info(f"📧 OTP for {recipient_email}: {otp_code}")
                return True
            
            # Create email message
            message = MIMEMultipart("alternative")
            message["Subject"] = "Your OTP for Visitor Management System Registration"
            message["From"] = self.sender_email
            message["To"] = recipient_email
            
            # HTML email template
            html = self._get_html_template(otp_code, expires_in_minutes, recipient_email)
            
            # Attach HTML
            part = MIMEText(html, "html")
            message.attach(part)
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.sendmail(self.sender_email, recipient_email, message.as_string())
            
            logger.info(f"✅ OTP email sent successfully to {recipient_email}")
            return True
        
        except smtplib.SMTPAuthenticationError:
            logger.error("❌ SMTP authentication failed. Check email credentials.")
            return False
        except smtplib.SMTPException as e:
            logger.error(f"❌ SMTP error occurred: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"❌ Error sending OTP email: {str(e)}")
            return False
    
    def _get_html_template(
        self,
        otp_code: str,
        expires_in_minutes: int,
        recipient_email: str
    ) -> str:
        """
        Generate HTML email template
        
        Args:
            otp_code: OTP code
            expires_in_minutes: Expiration time
            recipient_email: Recipient email
        
        Returns:
            HTML template string
        """
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background-color: #f4f4f4;
                }}
                .container {{
                    max-width: 600px;
                    margin: 20px auto;
                    background-color: #ffffff;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                }}
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: #ffffff;
                    padding: 30px;
                    text-align: center;
                }}
                .header h1 {{
                    margin: 0;
                    font-size: 28px;
                }}
                .content {{
                    padding: 30px;
                }}
                .otp-section {{
                    background-color: #f8f9fa;
                    border-left: 4px solid #667eea;
                    padding: 20px;
                    margin: 20px 0;
                    border-radius: 4px;
                }}
                .otp-code {{
                    font-size: 32px;
                    font-weight: bold;
                    color: #667eea;
                    letter-spacing: 8px;
                    text-align: center;
                    font-family: 'Courier New', monospace;
                    margin: 20px 0;
                }}
                .footer {{
                    background-color: #f4f4f4;
                    padding: 20px;
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                    border-top: 1px solid #e0e0e0;
                }}
                .warning {{
                    color: #d9534f;
                    font-weight: bold;
                }}
                .button {{
                    display: inline-block;
                    padding: 12px 30px;
                    background-color: #667eea;
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 4px;
                    margin-top: 20px;
                    text-align: center;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏢 Visitor Management System</h1>
                    <p>Email Verification</p>
                </div>
                
                <div class="content">
                    <h2>Welcome to VMS!</h2>
                    <p>Thank you for registering. To complete your registration, please verify your email address using the OTP below:</p>
                    
                    <div class="otp-section">
                        <p style="margin-top: 0; color: #666;">Your One-Time Password (OTP):</p>
                        <div class="otp-code">{otp_code}</div>
                        <p style="text-align: center; color: #666; margin-bottom: 0;">
                            This OTP will expire in <span class="warning">{expires_in_minutes} minutes</span>
                        </p>
                    </div>
                    
                    <div style="background-color: #fffbea; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                        <p style="margin: 0; color: #856404;">
                            <strong>⚠️ Security Notice:</strong><br>
                            • Never share your OTP with anyone<br>
                            • We will never ask for your OTP via email or phone<br>
                            • If you didn't request this OTP, please ignore this email
                        </p>
                    </div>
                    
                    <p>If you have any questions, please contact our support team.</p>
                </div>
                
                <div class="footer">
                    <p>© 2026 Visitor Management System. All rights reserved.</p>
                    <p>This is an automated email. Please do not reply to this message.</p>
                </div>
            </div>
        </body>
        </html>
        """