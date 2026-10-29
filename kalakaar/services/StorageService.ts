import {
  storageRepository,
  StorageBucket,
  extractPathFromUrl,
  StorageUploadOptions,
} from '../src/repositories/StorageRepository';

export type { StorageBucket };
export { extractPathFromUrl };

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number];

const MAX_FILE_SIZES: Record<StorageBucket, number> = {
  avatars: 2 * 1024 * 1024,      // 2 MB
  artworks: 8 * 1024 * 1024,     // 8 MB (matches the bucket limit)
  stories: 5 * 1024 * 1024,      // 5 MB
  collections: 5 * 1024 * 1024,  // 5 MB
};

export interface StorageResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string | null;
}

export interface UploadFileOptions {
  file: File;
  bucket: StorageBucket;
  ownerId: string;
  entityId?: string;
  customFilename?: string;
  upsert?: boolean;
  skipCompression?: boolean;
}

export interface ReplaceFileOptions extends UploadFileOptions {
  oldPathOrUrl: string;
}

export interface GenerateFilePathOptions {
  bucket: StorageBucket;
  ownerId: string;
  entityId?: string;
  filename?: string;
  extension?: string;
}

export class StorageService {
  /**
   * Validates if a bucket string is a recognized StorageBucket
   */
  static validateBucket(bucket: string): bucket is StorageBucket {
    return storageRepository.validateBucket(bucket);
  }

  /**
   * Validates file MIME type and file size against target bucket rules.
   */
  static validateFile(file: File, bucket: StorageBucket): StorageResult<{ valid: boolean }> {
    if (!file) {
      return {
        success: false,
        error: 'No file provided for validation.',
      };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType)) {
      return {
        success: false,
        error: `Invalid file type "${file.type || 'unknown'}". Allowed formats: JPEG, PNG, WebP.`,
      };
    }

    const maxSize = MAX_FILE_SIZES[bucket];
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return {
        success: false,
        error: `File size (${fileSizeMB} MB) exceeds maximum allowed limit of ${maxSizeMB} MB for ${bucket}.`,
      };
    }

    return {
      success: true,
      data: { valid: true },
      error: null,
    };
  }

  /**
   * Compresses image file using browser-image-compression with WebP target output.
   * Preserves aspect ratio and never upscales.
   */
  static async compressImage(file: File, bucket: StorageBucket): Promise<StorageResult<File>> {
    if (typeof window === 'undefined') {
      return { success: true, data: file, error: null };
    }

    try {
      const imageCompression = (await import('browser-image-compression')).default;

      const targetMaxSizeMB = Math.min(MAX_FILE_SIZES[bucket] / (1024 * 1024), 2);
      const maxDimension = bucket === 'avatars' ? 800 : 2048;

      const options = {
        maxSizeMB: targetMaxSizeMB,
        maxWidthOrHeight: maxDimension,
        useWebWorker: true,
        fileType: 'image/webp',
        initialQuality: 0.85,
      };

      const compressedBlob = await imageCompression(file, options);
      const compressedFileName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
      const compressedFile = new File([compressedBlob], compressedFileName, {
        type: 'image/webp',
        lastModified: Date.now(),
      });

      return {
        success: true,
        data: compressedFile,
        error: null,
      };
    } catch (err: unknown) {
      console.warn('StorageService.compressImage fallback to original file:', err);
      return {
        success: true,
        data: file,
        error: null,
      };
    }
  }

  /**
   * Generates a UUID-based random filename with the requested extension.
   */
  static generateUniqueFilename(_originalFilename?: string, extension: string = 'webp'): string {
    const uuid = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    const ext = extension.replace(/^\./, '').toLowerCase();
    return `${uuid}.${ext}`;
  }

  /**
   * Builds target bucket-relative folder path based on owner, entity, and filename.
   */
  static generateFilePath(options: GenerateFilePathOptions): string {
    const { bucket, ownerId, entityId, filename, extension = 'webp' } = options;
    const cleanOwner = ownerId.trim().replace(/^\/+|\/+$/g, '');
    const cleanEntity = entityId ? entityId.trim().replace(/^\/+|\/+$/g, '') : '';
    const finalFilename = filename ? filename.trim().replace(/^\/+/, '') : this.generateUniqueFilename(undefined, extension);

    if (bucket === 'avatars') {
      return `${cleanOwner}/${finalFilename}`;
    }

    if (cleanEntity) {
      return `${cleanOwner}/${cleanEntity}/${finalFilename}`;
    }

    return `${cleanOwner}/${finalFilename}`;
  }

  /**
   * Retrieves public URL for a file in storage via StorageRepository.
   */
  static getPublicUrl(bucket: StorageBucket, pathOrUrl: string): StorageResult<{ publicUrl: string }> {
    if (!pathOrUrl) {
      return { success: false, error: 'Path or URL is required to retrieve public URL.' };
    }

    const repoResponse = storageRepository.getPublicUrl(bucket, pathOrUrl);
    if (!repoResponse.success || !repoResponse.data) {
      return {
        success: false,
        error: repoResponse.error || 'Failed to retrieve public URL.',
      };
    }

    return {
      success: true,
      data: { publicUrl: repoResponse.data.publicUrl },
      error: null,
    };
  }

  /**
   * Checks if a file exists in storage via StorageRepository.
   */
  static async fileExists(bucket: StorageBucket, pathOrUrl: string): Promise<StorageResult<{ exists: boolean }>> {
    const repoResponse = await storageRepository.fileExists(bucket, pathOrUrl);
    if (!repoResponse.success) {
      return { success: false, error: repoResponse.error };
    }
    return {
      success: true,
      data: { exists: Boolean(repoResponse.data) },
      error: null,
    };
  }

  /**
   * Full Upload Pipeline:
   * Select File -> Validate -> Compress -> Generate Path -> Upload via StorageRepository -> Return Public URL
   */
  static async uploadFile(
    options: UploadFileOptions
  ): Promise<StorageResult<{ path: string; publicUrl: string }>> {
    const { file, bucket, ownerId, entityId, customFilename, upsert = true, skipCompression = false } = options;

    try {
      if (!ownerId) {
        return { success: false, error: 'ownerId is required for uploading file.' };
      }

      // Step 1: Business validation
      const validation = this.validateFile(file, bucket);
      if (!validation.success) {
        return { success: false, error: validation.error };
      }

      // Step 2: Image compression
      let fileToUpload = file;
      if (!skipCompression) {
        const compressionResult = await this.compressImage(file, bucket);
        if (compressionResult.success && compressionResult.data) {
          fileToUpload = compressionResult.data;
        }
      }

      // Step 3: Generate path and filename
      const extension = fileToUpload.type === 'image/webp' ? 'webp' : fileToUpload.name.split('.').pop() || 'webp';
      const filename = customFilename || this.generateUniqueFilename(file.name, extension);
      const path = this.generateFilePath({ bucket, ownerId, entityId, filename, extension });

      // Step 4: Delegate data persistence to StorageRepository
      const uploadOptions: StorageUploadOptions = {
        upsert,
        contentType: fileToUpload.type || 'image/webp',
        cacheControl: '3600',
      };

      const repoResponse = await storageRepository.uploadFile(bucket, path, fileToUpload, uploadOptions);

      if (!repoResponse.success || !repoResponse.data) {
        return {
          success: false,
          error: repoResponse.error || 'Upload failed',
        };
      }

      return {
        success: true,
        data: {
          path: repoResponse.data.path,
          publicUrl: repoResponse.data.publicUrl,
        },
        error: null,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred during upload.';
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Convenience workflow method: Upload user avatar
   */
  static async uploadAvatar(
    file: File,
    userId: string,
    options?: Partial<UploadFileOptions>
  ): Promise<StorageResult<{ path: string; publicUrl: string }>> {
    return this.uploadFile({
      file,
      bucket: 'avatars',
      ownerId: userId,
      ...options,
    });
  }

  /**
   * Convenience workflow method: Upload artwork image
   */
  static async uploadArtworkImage(
    file: File,
    artistId: string,
    artworkId?: string,
    options?: Partial<UploadFileOptions>
  ): Promise<StorageResult<{ path: string; publicUrl: string }>> {
    return this.uploadFile({
      file,
      bucket: 'artworks',
      ownerId: artistId,
      entityId: artworkId,
      ...options,
    });
  }

  /**
   * Convenience workflow method: Upload collection cover image
   */
  static async uploadCollectionCover(
    file: File,
    artistId: string,
    collectionId?: string,
    options?: Partial<UploadFileOptions>
  ): Promise<StorageResult<{ path: string; publicUrl: string }>> {
    return this.uploadFile({
      file,
      bucket: 'collections',
      ownerId: artistId,
      entityId: collectionId,
      ...options,
    });
  }

  /**
   * Convenience workflow method: Upload story cover image
   */
  static async uploadStoryCover(
    file: File,
    artistId: string,
    storyId?: string,
    options?: Partial<UploadFileOptions>
  ): Promise<StorageResult<{ path: string; publicUrl: string }>> {
    return this.uploadFile({
      file,
      bucket: 'stories',
      ownerId: artistId,
      entityId: storyId,
      ...options,
    });
  }

  /**
   * Delete Pipeline: Deletes storage object by path or URL via StorageRepository.
   */
  static async deleteFile(
    bucket: StorageBucket,
    pathOrUrl: string
  ): Promise<StorageResult<{ deleted: boolean }>> {
    if (!pathOrUrl) {
      return { success: false, error: 'Path or URL is required for file deletion.' };
    }

    const repoResponse = await storageRepository.deleteFile(bucket, pathOrUrl);
    if (!repoResponse.success) {
      return { success: false, error: repoResponse.error };
    }

    return {
      success: true,
      data: { deleted: true },
      error: null,
    };
  }

  /**
   * Replace Pipeline: Deletes old file (if provided) and uploads new file via StorageRepository.
   */
  static async replaceFile(
    options: ReplaceFileOptions
  ): Promise<StorageResult<{ path: string; publicUrl: string }>> {
    const { oldPathOrUrl, ...uploadOptions } = options;

    try {
      if (oldPathOrUrl) {
        const deleteResult = await this.deleteFile(uploadOptions.bucket, oldPathOrUrl);
        if (!deleteResult.success) {
          console.warn('StorageService.replaceFile notice: old file deletion warning:', deleteResult.error);
        }
      }

      return await this.uploadFile(uploadOptions);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred during file replacement.';
      return { success: false, error: errorMsg };
    }
  }
}
