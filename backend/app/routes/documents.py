from fastapi import APIRouter, UploadFile, Depends, HTTPException

from app.deps import get_user_supabase
from app.services.document_service import process_document

router = APIRouter(
    prefix="/workspaces",
    tags=["Documents"]
)


@router.post("/{workspace_id}/documents")
async def upload_document(
    workspace_id: str,
    file: UploadFile,
    supabase=Depends(get_user_supabase)
):
    """
    Upload a document to a workspace.
    """

    # Verify the authenticated user belongs to this workspace
    membership = (
        supabase
        .table("workspace_members")
        .select("*")
        .eq("workspace_id", workspace_id)
        .execute()
    )

    if not membership.data:
        raise HTTPException(
            status_code=403,
            detail="Not a member of this workspace"
        )

    # Process the uploaded document
    return await process_document(
        workspace_id=workspace_id,
        file=file,
        supabase=supabase,
    )