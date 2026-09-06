/**
 * Compresses an image File or Blob client-side using an HTML5 Canvas.
 * Downscales dimensions while preserving aspect ratio and re-encodes at target quality.
 *
 * @param {File|Blob} file - Original image file
 * @param {number} [maxWidth=1600] - Maximum width constraint
 * @param {number} [maxHeight=1600] - Maximum height constraint
 * @param {number} [quality=0.8] - Compression quality (0.0 to 1.0)
 * @returns {Promise<{blob: Blob, name: string, type: string}>} Compressed file wrapper
 */
export const compressImage = (file, maxWidth = 1600, maxHeight = 1600, quality = 0.8) => {
  return new Promise((resolve) => {
    // Guard clause: Return original if not an image
    if (!file || !file.type || !file.type.startsWith("image/")) {
      resolve({
        blob: file,
        name: file?.name || "attachment",
        type: file?.type || "application/octet-stream"
      });
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect-ratio constrained dimensions
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          // Fallback if canvas context is unavailable
          resolve({ blob: file, name: file.name, type: file.type });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Prefer modern WebP with JPEG fallback
        const outputType = "image/jpeg";
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              // If compressed size is larger, keep original
              resolve({ blob: file, name: file.name, type: file.type });
              return;
            }

            resolve({
              blob,
              name: file.name.replace(/\.[^/.]+$/, ".jpg"),
              type: outputType
            });
          },
          outputType,
          quality
        );
      };

      img.onerror = () => {
        resolve({ blob: file, name: file.name, type: file.type });
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      resolve({ blob: file, name: file.name, type: file.type });
    };

    reader.readAsDataURL(file);
  });
};
