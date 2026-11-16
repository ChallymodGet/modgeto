"use client";

import type { UploadFn } from "@/components/brief/file-uploader";

/**
 * Stand-in upload until Cloudflare R2 arrives (Phase 10). Reports progress and
 * returns a local asset id; nothing leaves the browser.
 */
export const simulatedUpload: UploadFn = (file, onProgress) =>
  new Promise((resolve) => {
    let progress = 0;
    const timer = setInterval(() => {
      progress = Math.min(100, progress + 25);
      onProgress(progress);
      if (progress >= 100) {
        clearInterval(timer);
        resolve({ assetId: `local-${crypto.randomUUID()}`, name: file.name, sizeBytes: file.size });
      }
    }, 200);
  });
