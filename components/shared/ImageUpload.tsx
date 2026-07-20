"use client";

/**
 * Reusable image upload component with drag-and-drop support.
 *
 * Features:
 * - File picker + drag-and-drop zone
 * - Preview before upload
 * - Upload progress indicator
 * - Error display
 * - Supports both Supabase Storage and local base64 fallback
 */

import { useState, useRef, type DragEvent } from "react";
import { uploadImage } from "@/lib/upload";

type Props = {
  onUploaded: (url: string, alt: string) => void;
  prefix?: string;
  maxWidth?: number;
  className?: string;
  label?: string;
};

export function ImageUpload({
  onUploaded,
  prefix = "inline/",
  maxWidth = 1920,
  className = "",
  label = "Upload image",
}: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    // Show preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setError(null);
    setUploading(true);

    try {
      const result = await uploadImage(file, prefix, maxWidth);
      if (result.ok) {
        onUploaded(result.url, result.alt);
        setPreview(null); // Clear preview after success
      } else {
        setError(result.error);
        setPreview(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setPreview(null);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(objectUrl);
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(true);
  }

  function onDragLeave() {
    setDragOver(false);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    // Reset so the same file can be re-selected
    e.target.value = "";
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`
          relative cursor-pointer rounded-lg border-2 border-dashed p-6 text-center
          transition-colors duration-200
          ${dragOver ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-[var(--border)] hover:border-[var(--border-strong)]"}
          ${uploading ? "pointer-events-none opacity-60" : ""}
        `}
        aria-label="Upload image zone"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml"
          className="hidden"
          onChange={onInputChange}
          disabled={uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
            <span className="text-sm text-[var(--text-muted)]">Uploading…</span>
          </div>
        ) : preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Preview"
            className="mx-auto max-h-32 rounded object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <svg
              className="h-8 w-8 text-[var(--text-muted)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <span className="text-sm text-[var(--text-secondary)]">{label}</span>
            <span className="text-xs text-[var(--text-muted)]">
              PNG, JPG, WebP, AVIF, GIF, SVG — max 5 MB
            </span>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
