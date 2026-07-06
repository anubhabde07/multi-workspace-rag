import os
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

EMBED_MODEL = "gemini-embedding-001"


def embed_batch(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for document chunks capped at 768 dimensions."""
    wrapped_contents = [
        types.Content(parts=[types.Part.from_text(text=t)]) for t in texts
    ]

    response = client.models.embed_content(
        model=EMBED_MODEL,
        contents=wrapped_contents,
        config=types.EmbedContentConfig(output_dimensionality=768),
    )

    return [embedding.values for embedding in response.embeddings]


def embed_query(query: str) -> list[float]:
    """Generate an embedding for a user query capped at 768 dimensions."""
    response = client.models.embed_content(
        model=EMBED_MODEL,
        contents=query,
        config=types.EmbedContentConfig(output_dimensionality=768),
    )

    return response.embeddings[0].values