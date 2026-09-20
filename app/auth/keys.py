import hashlib
import secrets


def generate_api_key() -> str:
    """Return a new high-entropy API key. Show it to the caller once; store only its hash."""
    return secrets.token_urlsafe(32)


def hash_api_key(key: str) -> str:
    """Return the SHA-256 hex digest stored in ``users.api_key_hash``."""
    return hashlib.sha256(key.encode("utf-8")).hexdigest()
