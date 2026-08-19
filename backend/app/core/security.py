import re
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

# Using Argon2id default settings
ph = PasswordHasher(
    time_cost=3,      # parallel iterations
    memory_cost=65536, # memory size in KiB (64MiB)
    parallelism=4      # threads
)

def hash_password(password: str) -> str:
    """
    Hash a plaintext password using Argon2id.
    """
    return ph.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against the stored Argon2id hash.
    """
    try:
        return ph.verify(hashed_password, plain_password)
    except VerifyMismatchError:
        return False

def validate_password_strength(password: str) -> bool:
    """
    Enforce basic password strength rules:
    - Minimum 6 characters
    """
    return len(password) >= 6
