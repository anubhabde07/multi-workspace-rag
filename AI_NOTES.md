# AI_NOTES.md

## AI Usage

Generative AI was used as a development assistant to discuss architectural options, explain FastAPI and Supabase concepts, understand RAG pipeline design, and review implementation ideas. All code was manually integrated, modified where necessary, and verified through testing during development.

---

# Key Architectural Decisions

## 1. User-Scoped Supabase Client

Instead of using the Supabase service role key for API requests, the backend creates a user-scoped Supabase client using the authenticated user's JWT.

This allows every database query to execute with the caller's identity, enabling Supabase Row-Level Security (RLS) to enforce authorization automatically. The service role key is reserved only for privileged administrative operations and is not used for normal user requests.

### Reasoning

- Eliminates manual permission checks on every query.
- Keeps authorization centralized through RLS policies.
- Prevents users from accessing another workspace's data even if request parameters are modified.

---

## 2. Workspace-Based Authorization

Document upload endpoints use the workspace ID from the URL path.

Example:

```http
POST /workspaces/{workspace_id}/documents
```

Before processing an upload, the backend verifies that the authenticated user belongs to the requested workspace.

Although Row-Level Security would also block unauthorized access, an explicit membership check is performed first to return a clear **403 Forbidden** response instead of allowing later database operations to fail with less informative errors.

### Reasoning

- Produces better API responses.
- Provides early validation.
- Uses RLS as the final authorization layer.

---

## 3. Separate Document Parsing Service

Document text extraction is implemented in a dedicated `parser.py` service rather than inside the API route.

Currently supported file types are:

- PDF
- Plain Text (`.txt`)
- Markdown (`.md`)

Unsupported formats return an HTTP `400 Bad Request` response.

### Reasoning

- Keeps API routes focused only on handling HTTP requests.
- Makes document parsing reusable and easier to extend later.
- Supports the assignment requirements without adding unnecessary complexity.

---

## 4. Document-Level Idempotency Using SHA-256

After extracting the document text, a SHA-256 hash is computed.

Before performing chunking or embedding generation, the backend checks whether another document with the same `(workspace_id, content_hash)` already exists.

If a duplicate is found, the existing document is returned immediately and ingestion stops.

### Reasoning

- Prevents duplicate documents within the same workspace.
- Avoids unnecessary embedding API calls.
- Reduces processing time and storage usage.
- Allows identical documents to exist in different workspaces because each workspace is independent.

Document-level hashing was selected instead of chunk-level hashing because it satisfies the assignment requirements with a single indexed lookup while keeping the implementation simple.

---

## 5. Recursive Chunking Strategy

Document text is divided using LangChain's `RecursiveCharacterTextSplitter`.

### Configuration

- Chunk Size: **800 characters**
- Chunk Overlap: **100 characters**

The splitter attempts to preserve natural document structure by splitting in the following order:

1. Paragraphs
2. Line breaks
3. Sentences
4. Words
5. Characters

### Reasoning

Very large chunks reduce retrieval precision because multiple topics become embedded together.

Very small chunks often lose important context because related information may be split across multiple chunks.

A chunk size of approximately 800 characters provides a good balance between preserving complete ideas and maintaining retrieval accuracy.

A 100-character overlap ensures that information located near chunk boundaries appears completely in at least one chunk, reducing the likelihood of losing context during retrieval.

---

## 6. Parent-Child Database Structure

The backend inserts a row into the `documents` table before creating document chunks.

The generated `document_id` is then attached to every chunk.

### Reasoning

- Preserves referential integrity.
- Matches the relational database schema.
- Allows every chunk to be traced back to its original document.
- Simplifies future citation generation.

---

## 7. Batch Embedding Generation

Document chunks are embedded using Google's Gemini embedding model (`text-embedding-004`).

Multiple chunks are embedded together in a single API request instead of sending one request per chunk.

During document ingestion:

```python
task_type = "retrieval_document"
```

During query processing (Phase 3):

```python
task_type = "retrieval_query"
```

### Reasoning

- Batch embedding reduces network overhead.
- Improves document ingestion speed.
- Reduces the likelihood of API rate-limit issues.
- Using different task types for documents and queries follows Gemini's recommended retrieval strategy and improves semantic search quality.
- The embedding batch size is kept configurable so it can be adjusted if Gemini API limits change in the future.

---

## 8. Bulk Chunk Insertion

After generating embeddings, all document chunks are inserted into the database using a single bulk insert operation instead of inserting each chunk individually.

Each stored chunk contains:

- Workspace ID
- Document ID
- Chunk Index
- Chunk Text
- Embedding Vector

### Reasoning

- Reduces the number of database requests.
- Improves ingestion performance.
- Minimizes network latency.
- Reduces the risk of partial failures caused by repeated insert operations.
- Preserves the original document order using `chunk_index`.

---

## 9. Graceful Failure Handling

Document ingestion consists of several dependent operations:

1. Document creation
2. Chunk generation
3. Embedding generation
4. Chunk insertion

If embedding generation or chunk insertion fails, the backend removes the previously inserted document record before returning an error.

### Reasoning

- Prevents partially ingested documents from remaining in the database.
- Allows users to safely retry the upload.
- Keeps the database in a consistent state.
- Provides a simple rollback mechanism when a full database transaction is not available through the client library.

---

## 10. Frontend Upload Experience

The upload interface is scoped to the currently active workspace selected by the user.

The frontend uploads documents as `multipart/form-data` to:

```http
POST /workspaces/{workspace_id}/documents
```

The user's JWT access token is included in the `Authorization` header for authentication.

The interface displays:

- Uploading...
- Upload Successful
- Already Ingested
- Upload Failed

### Reasoning

- Ensures documents are uploaded only to the active workspace.
- Provides immediate feedback while document parsing and embedding are running.
- Clearly distinguishes successful uploads, duplicate uploads, and failures, improving the overall user experience.

---

# Overall Document Ingestion Pipeline

```text
User Uploads Document
          │
          ▼
Authenticate User (JWT)
          │
          ▼
Verify Workspace Membership
          │
          ▼
Extract Document Text
          │
          ▼
Compute SHA-256 Hash
          │
          ▼
Duplicate Check
          │
          ▼
Insert Document Metadata
          │
          ▼
Chunk Document
          │
          ▼
Generate Embeddings
          │
          ▼
Bulk Insert Document Chunks
          │
          ▼
If Failure
          │
          ├── Delete Document
          │
          ▼
Return Error
          │
          ▼
If Success
          │
          ▼
Return Success Response
```

---

# Future Work

The next phase of the project will implement the Retrieval-Augmented Generation (RAG) pipeline, including:

- Query embedding using `retrieval_query`
- Vector similarity search using pgvector
- Retrieval of the most relevant document chunks
- Prompt construction using retrieved context
- Gemini response generation
- Source citations for retrieved documents
- Conversation history management
- Task management
- Tool-call logging