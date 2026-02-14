from cryptography.fernet import Fernet
import os
import base64
from dotenv import load_dotenv

load_dotenv()

def get_encryption_key() -> bytes:
    key = os.getenv("ENCRYPTION_KEY")
    if isinstance(key, str):
        key = key.encode()
    
    return key

def encrypt_token(token: str) -> str:
    if not token:
        raise ValueError("Token cannot be empty")
    
    key = get_encryption_key()
    fernet = Fernet(key)
    encrypted = fernet.encrypt(token.encode())
    return encrypted.decode()

def decrypt_token(encrypted_token: str) -> str:
    if not encrypted_token:
        raise ValueError("Encrypted token cannot be empty")
    
    key = get_encryption_key()
    fernet = Fernet(key)
    decrypted = fernet.decrypt(encrypted_token.encode())
    return decrypted.decode()

