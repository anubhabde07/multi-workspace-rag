from fastapi import APIRouter
from fastapi import Depends

from app.deps import get_user_supabase

router = APIRouter()


@router.get("/documents")
def get_documents(
    supabase=Depends(get_user_supabase),
):

    response = (
        supabase
        .table("documents")
        .select("*")
        .execute()
    )

    return response.data


@router.get("/tasks")
def get_tasks(
    supabase=Depends(get_user_supabase),
):

    response = (
        supabase
        .table("tasks")
        .select("*")
        .execute()
    )

    return response.data