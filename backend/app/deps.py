import os

from dotenv import load_dotenv

from fastapi import Header
from fastapi import HTTPException

from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")


def get_user_supabase(
    authorization: str = Header(None)
):
    if authorization is None:
        raise HTTPException(
            status_code=401,
            detail="Missing Authorization header",
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid Authorization header",
        )

    token = authorization.replace("Bearer ", "")

    supabase = create_client(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
    )

    # Authenticate as current user
    supabase.postgrest.auth(token)

    return supabase