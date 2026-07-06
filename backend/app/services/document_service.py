from fastapi import UploadFile, HTTPException

from app.services.parser import extract_text
from app.services.chunker import chunk_text
from app.services.embeddings import embed_batch
from app.utils.hashing import compute_hash




async def process_document(
    workspace_id: str,
    file: UploadFile,
    supabase
):
    print("========== DOCUMENT INGESTION START ==========")

    # Step 1
    text = await extract_text(file)
    print("✓ Text extracted")

    # Step 2
    content_hash = compute_hash(text)
    print("✓ Hash:", content_hash)

    # Step 3
    existing = (
        supabase
        .table("documents")
        .select("id")
        .eq("workspace_id", workspace_id)
        .eq("content_hash", content_hash)
        .execute()
    )

    print("Duplicate check:", existing.data)

    if existing.data:
        print("Document already exists")
        return {
            "status": "already_ingested",
            "document_id": existing.data[0]["id"]
        }

    print("Inserting document...")

    doc_result = (
        supabase
        .table("documents")
        .insert({
            "workspace_id": workspace_id,
            "filename": file.filename,
            "content_hash": content_hash
        })
        .execute()
    )

    print("Document insert response:", doc_result.data)

    document_id = doc_result.data[0]["id"]

    chunks = chunk_text(text)
    print(f"Generated {len(chunks)} chunks")

    try:

        print("Generating embeddings...")
        embeddings = embed_batch(chunks)
        print(f"Generated {len(embeddings)} embeddings")

        rows = [
            {
                "workspace_id": workspace_id,
                "document_id": document_id,
                "chunk_index": index,
                "chunk_text": chunk,
                "embedding": embedding
            }
            for index, (chunk, embedding)
            in enumerate(zip(chunks, embeddings))
        ]

        print("Inserting chunks...")

        chunk_result = (
            supabase
            .table("chunks")
            .insert(rows)
            .execute()
        )

        print("Chunk insert response:", chunk_result.data)

    except Exception as e:

        print("ERROR:", e)

        supabase.table("documents")\
            .delete()\
            .eq("id", document_id)\
            .execute()

        raise HTTPException(
            status_code=500,
            detail=f"Ingestion failed: {str(e)}"
        )

    print("========== SUCCESS ==========")

    return {
        "status": "success",
        "document_id": document_id,
        "chunks_created": len(rows)
    }