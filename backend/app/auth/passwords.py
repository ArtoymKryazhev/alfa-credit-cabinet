"""PBKDF2 password hashing (stdlib)."""

from __future__ import annotations

import hashlib
import hmac
import secrets

_ITERATIONS = 210_000
_ALGORITHM = "sha256"


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        _ALGORITHM,
        password.encode("utf-8"),
        bytes.fromhex(salt),
        _ITERATIONS,
    ).hex()
    return f"pbkdf2_{_ALGORITHM}${_ITERATIONS}${salt}${digest}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        scheme, iterations_s, salt, expected = password_hash.split("$", 3)
    except ValueError:
        return False
    if scheme != f"pbkdf2_{_ALGORITHM}":
        return False
    try:
        iterations = int(iterations_s)
    except ValueError:
        return False
    actual = hashlib.pbkdf2_hmac(
        _ALGORITHM,
        password.encode("utf-8"),
        bytes.fromhex(salt),
        iterations,
    ).hex()
    return hmac.compare_digest(actual, expected)
