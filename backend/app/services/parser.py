import io

import pypdf
from fastapi import UploadFile, HTTPException


async def extract_text(file: UploadFile) -> str:
    """
    Extract text from supported document types.

    Supported:
    - PDF (.pdf)
    - Plain text (.txt)
    - Markdown (.md)
    """

    # Read the uploaded file into memory
    content = await file.read()

    # ---------- PDF ----------
    if file.filename.lower().endswith(".pdf"):

        reader = pypdf.PdfReader(io.BytesIO(content))

        pages = []

        for page in reader.pages:
            text = page.extract_text() or ""
            pages.append(text)

        return "\n\n".join(pages)

    # ---------- TXT / Markdown ----------
    elif file.filename.lower().endswith((".txt", ".md")):

        return content.decode("utf-8")

    # ---------- Unsupported ----------
    raise HTTPException(
        status_code=400,
        detail=f"Unsupported file type: {file.filename}"
    )