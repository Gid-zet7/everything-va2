/**
 * Utility functions for handling file processing
 */

export interface ProcessedAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string; // base64 encoded content
}

/**
 * Process a file to base64 content with memory optimization
 */
export async function processFileToBase64(
  file: File,
  chunkSize: number = 1024 * 1024, // 1MB chunks
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const arrayBuffer = reader.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);

        // Use a more efficient approach that avoids call stack issues
        const chunks: string[] = [];
        const chunkSize = 8192; // Process in 8KB chunks

        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.slice(i, i + chunkSize);
          const chunkString = String.fromCharCode(...chunk);
          chunks.push(chunkString);
        }

        const binaryString = chunks.join("");
        const base64Content = btoa(binaryString);
        resolve(base64Content);
      } catch (error) {
        reject(new Error(`Failed to process file: ${error}`));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Process multiple files to base64 content with progress tracking
 */
export async function processAttachments(
  attachments: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    file: File;
  }>,
  onProgress?: (progress: number) => void,
): Promise<ProcessedAttachment[]> {
  const results: ProcessedAttachment[] = [];
  const total = attachments.length;

  // Calculate total size before processing
  const totalSize = attachments.reduce((sum, att) => sum + (att?.size || 0), 0);
  const maxTotalSize = 50 * 1024 * 1024; // 50MB total limit

  if (totalSize > maxTotalSize) {
    throw new Error(
      `Total attachment size (${formatFileSize(totalSize)}) exceeds the maximum allowed size of ${formatFileSize(maxTotalSize)}. Please reduce the number or size of attachments.`,
    );
  }

  for (let i = 0; i < total; i++) {
    const attachment = attachments[i];

    if (!attachment) continue;

    try {
      // Show progress for large files
      if (attachment.size > 5 * 1024 * 1024 && onProgress) {
        onProgress((i / total) * 100);
      }

      const content = await processFileToBase64(attachment.file);

      results.push({
        id: attachment.id,
        name: attachment.name,
        size: attachment.size,
        type: attachment.type,
        content,
      });

      if (onProgress) {
        onProgress(((i + 1) / total) * 100);
      }
    } catch (error) {
      console.error(`Failed to process attachment ${attachment.name}:`, error);
      throw new Error(`Failed to process ${attachment.name}: ${error}`);
    }
  }

  return results;
}

/**
 * Validate file size and type
 */
export function validateFile(
  file: File,
  maxSize: number = 10 * 1024 * 1024,
): string | null {
  if (file.size > maxSize) {
    return `File size exceeds ${formatFileSize(maxSize)} limit`;
  }

  // Additional safety check for extremely large files
  if (file.size > 25 * 1024 * 1024) {
    // 25MB hard limit for API compatibility
    return `File size is too large (${formatFileSize(file.size)}). Maximum allowed is 25MB.`;
  }

  // Check for potentially problematic file types
  const problematicTypes = [
    "application/octet-stream",
    "application/x-executable",
    "application/x-msdownload",
  ];

  if (problematicTypes.includes(file.type)) {
    return `File type ${file.type} may not be supported`;
  }

  return null;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Estimate the size of base64 encoded content
 */
export function estimateBase64Size(fileSize: number): number {
  // Base64 encoding increases size by approximately 33%
  return Math.ceil(fileSize * 1.33);
}

/**
 * Check if attachments would exceed API limits
 */
export function checkAttachmentLimits(attachments: Array<{ size: number }>): {
  isValid: boolean;
  error?: string;
  totalSize: number;
  estimatedBase64Size: number;
} {
  const totalSize = attachments.reduce((sum, att) => sum + att.size, 0);
  const estimatedBase64Size = estimateBase64Size(totalSize);
  const maxSize = 50 * 1024 * 1024; // 50MB limit

  if (totalSize > maxSize) {
    return {
      isValid: false,
      error: `Total attachment size (${formatFileSize(totalSize)}) exceeds the maximum allowed size of ${formatFileSize(maxSize)}.`,
      totalSize,
      estimatedBase64Size,
    };
  }

  if (estimatedBase64Size > maxSize) {
    return {
      isValid: false,
      error: `Estimated payload size after base64 encoding (${formatFileSize(estimatedBase64Size)}) would exceed API limits. Please reduce attachment sizes.`,
      totalSize,
      estimatedBase64Size,
    };
  }

  return {
    isValid: true,
    totalSize,
    estimatedBase64Size,
  };
}
