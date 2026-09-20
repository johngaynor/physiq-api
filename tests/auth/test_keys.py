import hashlib

from app.auth.keys import generate_api_key, hash_api_key


def test_generate_api_key_is_unique_and_long() -> None:
    keys = {generate_api_key() for _ in range(100)}
    assert len(keys) == 100
    assert all(len(k) >= 32 for k in keys)


def test_hash_api_key_is_deterministic_sha256_hex() -> None:
    key = "abc"
    assert hash_api_key(key) == hashlib.sha256(b"abc").hexdigest()
    assert hash_api_key(key) == hash_api_key(key)
    assert len(hash_api_key(key)) == 64


def test_different_keys_hash_differently() -> None:
    assert hash_api_key("a") != hash_api_key("b")
