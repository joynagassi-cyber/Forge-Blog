/**
 * Image upload utility.
 *
 * Strategy:
 * 1. Try Supabase Storage (production) — upload to `article-images` bucket
 * 2. Fallback to local base64 data URL (demo/dev without Supabase)
 *
 * Returns a public URL or data URL that can be stored in the article's content
 * or cover_image_url field.
 */

import { createBrowserClient } from "@supabase/ssr";

export type UploadResult =
  | { ok: true; url: string; alt: string }
  | { ok: false; error: string };

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
];

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Unsupported file type: ${file.type}. Allowed: JPEG, PNG, WebP, AVIF, GIF, SVG.`;
  }
  if (file.size > MAX_SIZE) {
    return `File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB. Max: 5 MB.`;
  }
  return null;
}

/**
 * Upload an image file, returning a permanent URL.
 *
 * @param file     - The image File to upload
 * @param prefix   - Optional path prefix (e.g. "covers/" or "inline/")
 * @param maxWidth - Optional max width in px for client-side resize before upload
 */
export async function uploadImage(
  file: File,
  prefix = "covers/",
  maxWidth?: number,
): Promise<UploadResult> {
  const validationError = validateFile(file);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  // Optionally resize before upload to save bandwidth
  let processedFile = file;
  if (maxWidth && maxWidth < 4000) {
    try {
      processedFile = await resizeImage(file, maxWidth);
    } catch {
      // Use original if resize fails
    }
  }

  // --- Try Supabase Storage ---
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createBrowserClient(supabaseUrl, supabaseKey);

      const fileName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}${getExtension(processedFile)}`;
      const filePath = `${prefix}${fileName}`;

      const { data, error } = await supabase.storage
        .from("article-images")
        .upload(filePath, processedFile, {
          contentType: processedFile.type,
          cacheControl: "31536000",
          upsert: false,
        });

      if (!error && data) {
        const { data: urlData } = supabase.storage
          .from("article-images")
          .getPublicUrl(data.path);

        return {
          ok: true,
          url: urlData.publicUrl,
          alt: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " "),
        };
      }

      // Fall through to local fallback if storage fails
      console.warn("[upload] Supabase upload failed, using local fallback:", error?.message);
    } catch (err) {
      console.warn("[upload] Supabase exception, using local fallback:", err);
    }
  }

  // --- Fallback: local base64 data URL ---
  return localFallback(processedFile);
}

/**
 * Convert a file to a base64 data URL as a local-only fallback.
 */
async function localFallback(file: File): Promise<UploadResult> {
  try {
    const dataUrl = await fileToDataUrl(file);
    return {
      ok: true,
      url: dataUrl,
      alt: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " "),
    };
  } catch {
    return { ok: false, error: "Failed to read file as data URL." };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getExtension(file: File): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/avif": ".avif",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
  };
  return map[file.type] ?? ".jpg";
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Resize an image to a max width while preserving aspect ratio.
 * Uses canvas to avoid server-side dependencies.
 */
async function resizeImage(file: File, maxWidth: number): Promise<File> {
  const img = await createImageBitmap(file);
  const ratio = Math.min(1, maxWidth / img.width);
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  img.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(new File([blob], file.name, { type: file.type }));
        } else {
          reject(new Error("Canvas toBlob failed"));
        }
      },
      file.type,
      0.85,
    );
  });
}
