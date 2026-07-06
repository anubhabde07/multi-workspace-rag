"use client";

import { useState, useRef } from "react";

const ACCEPTED_TYPES = ".pdf,.txt,.md";
const MAX_SIZE_MB = 25;

export default function DocumentUpload({ workspaceId, accessToken }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null); // { type: 'success' | 'info' | 'error', message: string }
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  function pickFile(selected) {
    if (!selected) return;

    const sizeMB = selected.size / (1024 * 1024);
    if (sizeMB > MAX_SIZE_MB) {
      setStatus({ type: "error", message: `File exceeds ${MAX_SIZE_MB}MB limit.` });
      return;
    }

    setFile(selected);
    setStatus(null);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    pickFile(e.dataTransfer.files[0]);
  }

  async function handleUpload() {
    if (!file) return;

    setUploading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append("file", file);


    const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/workspaces/${workspaceId}/documents`;

    console.log("Backend URL:", process.env.NEXT_PUBLIC_BACKEND_URL);
    console.log("Workspace ID:", workspaceId);
    console.log("Access Token:", accessToken);
    console.log("Request URL:", url);

    try {
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/workspaces/${workspaceId}/documents`,
        {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
        }
    );

    console.log("HTTP Status:", response.status);

    const data = await response.json();

    console.log("Response:", data);

    if (response.ok) {
        if (data.status === "success") {
        setStatus({
            type: "success",
            message: "Document uploaded successfully.",
        });

        setFile(null);

        } else if (data.status === "already_ingested") {
        setStatus({
            type: "info",
            message: "This document already exists.",
        });

        } else {
        setStatus({
            type: "error",
            message: data.message || JSON.stringify(data),
        });
        }
    } else {
        setStatus({
        type: "error",
        message: data.detail || data.message || JSON.stringify(data),
        });
    }

    } catch (error) {
    console.error("Upload Error:", error);

    setStatus({
        type: "error",
        message: error.message || "Network error. Check your connection.",
    });

    } finally {
    setUploading(false);
    }
    }

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const statusStyles = {
    success: "bg-green-50 border-green-100 text-green-700",
    info: "bg-blue-50 border-blue-100 text-blue-700",
    error: "bg-red-50 border-red-100 text-red-700",
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900">Upload document</h2>
      <p className="mt-1 text-sm text-gray-500">
        PDF, TXT, or Markdown, up to {MAX_SIZE_MB}MB
      </p>

      {/* Dropzone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${
          isDragging
            ? "border-gray-900 bg-gray-50"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <svg
          className="h-8 w-8 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 12v9m0-9l-3 3m3-3l3 3"
          />
        </svg>
        <p className="mt-3 text-sm text-gray-600">
          <span className="font-medium text-gray-900">Click to upload</span> or
          drag and drop
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={(e) => pickFile(e.target.files[0])}
          className="hidden"
        />
      </div>

      {/* Selected file preview */}
      {file && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <svg
              className="h-5 w-5 flex-shrink-0 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">
                {file.name}
              </p>
              <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
            </div>
          </div>
          <button
            onClick={() => setFile(null)}
            className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600"
            aria-label="Remove file"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Status message */}
      {status && (
        <div className={`mt-4 rounded-lg border px-3 py-2 text-sm ${statusStyles[status.type]}`}>
          {status.message}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="mt-4 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload document"}
      </button>
    </div>
  );
}