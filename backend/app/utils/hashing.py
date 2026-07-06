import hashlib


def compute_hash(text: str) -> str:
    """
    Compute a SHA-256 hash of the document text.
    """

    return hashlib.sha256(
        text.encode("utf-8")
    ).hexdigest()