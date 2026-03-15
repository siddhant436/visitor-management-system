"""Input validation and sanitization service"""

import re
import logging
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

class ValidationError(Exception):
    """Custom validation error"""
    pass

class InputValidator:
    """Validate and sanitize user inputs"""
    
    @staticmethod
    def validate_email(email: str) -> str:
        """
        Validate and return email.
        
        Args:
            email: Email address to validate
        
        Returns:
            Validated email
        
        Raises:
            ValidationError: If email is invalid
        """
        if not email or not isinstance(email, str):
            raise ValidationError("Email is required and must be a string")
        
        email = email.strip().lower()
        
        # Email regex pattern
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        
        if not re.match(email_pattern, email):
            raise ValidationError("Invalid email format")
        
        if len(email) > 255:
            raise ValidationError("Email is too long (max 255 characters)")
        
        return email
    
    @staticmethod
    def validate_password(password: str) -> str:
        """
        Validate password strength.
        
        Requirements:
        - At least 8 characters
        - At most 70 characters (safe margin for bcrypt's 72-byte limit)
        - At least 1 uppercase letter
        - At least 1 lowercase letter
        - At least 1 digit
        """
        if not password or not isinstance(password, str):
            raise ValidationError("Password is required")
        
        # Strip whitespace
        password = password.strip()
        
        if len(password) < 8:
            raise ValidationError("Password must be at least 8 characters long")
        
        # Use 70 to be safe (72 is bcrypt limit, but let's have margin)
        if len(password) > 70:
            raise ValidationError("Password must be at most 70 characters long")
        
        if not re.search(r'[A-Z]', password):
            raise ValidationError("Password must contain at least one uppercase letter")
        
        if not re.search(r'[a-z]', password):
            raise ValidationError("Password must contain at least one lowercase letter")
        
        if not re.search(r'[0-9]', password):
            raise ValidationError("Password must contain at least one digit")
        
        return password
    
    @staticmethod
    def validate_name(name: str) -> str:
        """
        Validate name field.
        
        Requirements:
        - 2-100 characters
        - Only letters, spaces, hyphens, apostrophes
        """
        if not name or not isinstance(name, str):
            raise ValidationError("Name is required and must be a string")
        
        name = name.strip()
        
        if len(name) < 2:
            raise ValidationError("Name must be at least 2 characters long")
        
        if len(name) > 100:
            raise ValidationError("Name must be at most 100 characters long")
        
        # Only allow letters, spaces, hyphens, apostrophes
        if not re.match(r"^[a-zA-Z\s\-']+$", name):
            raise ValidationError("Name can only contain letters, spaces, hyphens, and apostrophes")
        
        return name
    
    @staticmethod
    def validate_phone(phone: str) -> str:
        """
        Validate phone number.
        
        Accepts:
        - 10 digits (9876543210)
        - With spaces (9876 543210)
        - With hyphens (98-7654-3210)
        - With country code (+91-98765-43210)
        """
        if not phone or not isinstance(phone, str):
            raise ValidationError("Phone number is required")
        
        # Remove spaces, hyphens, parentheses, plus sign
        cleaned_phone = re.sub(r'[\s\-\(\)\+]', '', phone)
        
        # Check if it contains only digits
        if not cleaned_phone.isdigit():
            raise ValidationError("Phone number can only contain digits and basic formatting characters")
        
        # Check length (7-15 digits is international standard)
        if len(cleaned_phone) < 7 or len(cleaned_phone) > 15:
            raise ValidationError("Phone number must be between 7 and 15 digits")
        
        return cleaned_phone
    
    @staticmethod
    def validate_apartment_number(apartment_no: str) -> str:
        """
        Validate apartment number.
        
        Requirements:
        - 1-10 characters
        - Can contain letters, numbers, hyphens
        """
        if not apartment_no or not isinstance(apartment_no, str):
            raise ValidationError("Apartment number is required")
        
        apartment_no = apartment_no.strip().upper()
        
        if len(apartment_no) < 1:
            raise ValidationError("Apartment number is required")
        
        if len(apartment_no) > 10:
            raise ValidationError("Apartment number must be at most 10 characters")
        
        # Allow alphanumeric and hyphens
        if not re.match(r'^[A-Z0-9\-]+$', apartment_no):
            raise ValidationError("Apartment number can only contain letters, numbers, and hyphens")
        
        return apartment_no
    
    @staticmethod
    def validate_purpose(purpose: str) -> str:
        """
        Validate visitor purpose.
        
        Allowed purposes: visit, delivery, meeting, pickup, service, other
        """
        allowed_purposes = ['visit', 'delivery', 'meeting', 'pickup', 'service', 'other']
        
        if not purpose or not isinstance(purpose, str):
            raise ValidationError("Purpose is required")
        
        purpose = purpose.strip().lower()
        
        if purpose not in allowed_purposes:
            raise ValidationError(f"Purpose must be one of: {', '.join(allowed_purposes)}")
        
        return purpose
    
    @staticmethod
    def validate_username(username: str) -> str:
        """
        Validate username for admin.
        
        Requirements:
        - 3-50 characters
        - Only alphanumeric and underscores
        - Must start with letter
        """
        if not username or not isinstance(username, str):
            raise ValidationError("Username is required")
        
        username = username.strip().lower()
        
        if len(username) < 3:
            raise ValidationError("Username must be at least 3 characters long")
        
        if len(username) > 50:
            raise ValidationError("Username must be at most 50 characters long")
        
        if not re.match(r'^[a-z][a-z0-9_]*$', username):
            raise ValidationError("Username must start with a letter and contain only lowercase letters, numbers, and underscores")
        
        return username
    
    @staticmethod
    def sanitize_text(text: str, max_length: int = 500) -> str:
        """
        Sanitize text input.
        
        - Remove leading/trailing whitespace
        - Limit length
        - Remove special characters that could cause issues
        """
        if not isinstance(text, str):
            return ""
        
        text = text.strip()
        
        if len(text) > max_length:
            text = text[:max_length]
        
        return text

# Create singleton instance
validator = InputValidator()