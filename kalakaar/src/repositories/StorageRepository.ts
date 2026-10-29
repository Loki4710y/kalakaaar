import { BaseRepository, RepositoryResponse } from './BaseRepository';

export type StorageBucket = 'avatars' | 'artworks' | 'stories' | 'collections';

const VALID_BUCKETS: readonly StorageBucket[] = [
  'avatars',
  'artworks',
  'stories',
  'collections',
] as const;

export interface StorageUploadResult {
  path: string;
  publicUrl: string;
}

export interface StorageUploadOptions {
  upsert?: boolean;
  contentType?: string;
  cacheControl?: string;
}

/**
 * Helper to extract relative storage path from a full storage URL or path string.
 */
export function extractPathFromUrl(pathOrUrl: string, bucket: StorageBucket): string {
  if (!pathOrUrl) return '';
  const trimmed = pathOrUrl.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return trimmed.replace(/^\/+/, '');
  }

  try {
    const url = new URL(trimmed);
    const publicSearch = `/storage/v1/object/public/${bucket}/`;
    const publicIndex = url.pathname.indexOf(publicSearch);
    if (publicIndex !== -1) {
      return url.pathname.substring(publicIndex + publicSearch.length);
    }

    const signSearch = `/storage/v1/object/sign/${bucket}/`;
    const signIndex = url.pathname.indexOf(signSearch);
    if (signIndex !== -1) {
      return url.pathname.substring(signIndex + signSearch.length);
    }

    const bucketParts = url.pathname.split(`/${bucket}/`);
    if (bucketParts.length > 1) {
      return bucketParts[1];
    }

    return trimmed;
  } catch {
    return trimmed;
  }
}

export class StorageRepository extends BaseRepository {
  /**
   * Validates if a string is a valid target storage bucket name
   */
  public validateBucket(bucket: string): bucket is StorageBucket {
    return VALID_BUCKETS.includes(bucket as StorageBucket);
  }

  /**
   * Retrieves public URL for a given bucket and relative path/URL
   */
  public getPublicUrl(bucket: StorageBucket, pathOrUrl: string): RepositoryResponse<{ publicUrl: string }> {
    try {
      if (!pathOrUrl) {
        return this.handleError<{ publicUrl: string }>('Path or URL is required to retrieve public URL');
      }

      const relativePath = extractPathFromUrl(pathOrUrl, bucket);
      const { data } = this.client.storage.from(bucket).getPublicUrl(relativePath);

      if (!data || !data.publicUrl) {
        return this.handleError<{ publicUrl: string }>('Failed to retrieve public URL from Supabase Storage');
      }

      return this.handleSuccess<{ publicUrl: string }>({ publicUrl: data.publicUrl });
    } catch (err) {
      return this.handleError<{ publicUrl: string }>(err, 'Failed to obtain public URL');
    }
  }

  /**
   * Checks if a file exists in the specified bucket and path
   */
  public async fileExists(bucket: StorageBucket, pathOrUrl: string): Promise<RepositoryResponse<boolean>> {
    try {
      if (!pathOrUrl) {
        return this.handleSuccess<boolean>(false);
      }
      const relativePath = extractPathFromUrl(pathOrUrl, bucket);
      const lastSlashIndex = relativePath.lastIndexOf('/');
      const folderPath = lastSlashIndex !== -1 ? relativePath.substring(0, lastSlashIndex) : '';
      const fileName = lastSlashIndex !== -1 ? relativePath.substring(lastSlashIndex + 1) : relativePath;

      const { data, error } = await this.client.storage.from(bucket).list(folderPath, {
        search: fileName,
      });

      if (error) {
        return this.handleError<boolean>(error, `Failed to check file existence in ${bucket}`);
      }

      const exists = Array.isArray(data) && data.some((item) => item.name === fileName);
      return this.handleSuccess<boolean>(exists);
    } catch (err) {
      return this.handleError<boolean>(err, 'Exception checking file existence');
    }
  }

  /**
   * Low-level upload method for any bucket and path
   */
  public async uploadFile(
    bucket: StorageBucket,
    path: string,
    file: File | Blob,
    options: StorageUploadOptions = {}
  ): Promise<RepositoryResponse<StorageUploadResult>> {
    try {
      if (!path) {
        return this.handleError<StorageUploadResult>('Target path is required for storage upload');
      }

      const contentType = options.contentType || (file instanceof File ? file.type : 'image/webp') || 'image/webp';
      const { data, error } = await this.client.storage.from(bucket).upload(path, file, {
        cacheControl: options.cacheControl || '3600',
        upsert: options.upsert ?? true,
        contentType,
      });

      if (error) {
        return this.handleError<StorageUploadResult>(error, `Upload failed for ${bucket}/${path}`);
      }

      const urlResult = this.getPublicUrl(bucket, data.path);
      if (!urlResult.success || !urlResult.data?.publicUrl) {
        return this.handleError<StorageUploadResult>(
          urlResult.error || 'Failed to generate public URL after file upload'
        );
      }

      return this.handleSuccess<StorageUploadResult>({
        path: data.path,
        publicUrl: urlResult.data.publicUrl,
      });
    } catch (err) {
      return this.handleError<StorageUploadResult>(err, `Exception during storage upload to ${bucket}`);
    }
  }

  /**
   * Upload user avatar to avatars bucket
   */
  public async uploadAvatar(
    file: File | Blob,
    userId: string,
    customPath?: string,
    options?: StorageUploadOptions
  ): Promise<RepositoryResponse<StorageUploadResult>> {
    const targetPath = customPath || `${userId}/${Date.now()}.webp`;
    return this.uploadFile('avatars', targetPath, file, options);
  }

  /**
   * Upload artwork image to artworks bucket
   */
  public async uploadArtworkImage(
    file: File | Blob,
    artistId: string,
    customPath?: string,
    options?: StorageUploadOptions
  ): Promise<RepositoryResponse<StorageUploadResult>> {
    const targetPath = customPath || `${artistId}/${Date.now()}.webp`;
    return this.uploadFile('artworks', targetPath, file, options);
  }

  /**
   * Upload collection cover to collections bucket
   */
  public async uploadCollectionCover(
    file: File | Blob,
    artistId: string,
    customPath?: string,
    options?: StorageUploadOptions
  ): Promise<RepositoryResponse<StorageUploadResult>> {
    const targetPath = customPath || `${artistId}/${Date.now()}.webp`;
    return this.uploadFile('collections', targetPath, file, options);
  }

  /**
   * Upload story cover to stories bucket
   */
  public async uploadStoryCover(
    file: File | Blob,
    artistId: string,
    customPath?: string,
    options?: StorageUploadOptions
  ): Promise<RepositoryResponse<StorageUploadResult>> {
    const targetPath = customPath || `${artistId}/${Date.now()}.webp`;
    return this.uploadFile('stories', targetPath, file, options);
  }

  /**
   * Delete file from specified bucket by path or URL
   */
  public async deleteFile(bucket: StorageBucket, pathOrUrl: string): Promise<RepositoryResponse<boolean>> {
    try {
      if (!pathOrUrl) {
        return this.handleError<boolean>('Path or URL is required for file deletion');
      }

      const relativePath = extractPathFromUrl(pathOrUrl, bucket);
      if (!relativePath) {
        return this.handleError<boolean>('Invalid file path for deletion');
      }

      const { error } = await this.client.storage.from(bucket).remove([relativePath]);

      if (error) {
        return this.handleError<boolean>(error, `Deletion failed for ${bucket}/${relativePath}`);
      }

      return this.handleSuccess<boolean>(true);
    } catch (err) {
      return this.handleError<boolean>(err, `Exception deleting file from ${bucket}`);
    }
  }

  /**
   * Replace file: removes old file from bucket (if provided) and uploads new file
   */
  public async replaceFile(
    bucket: StorageBucket,
    oldPathOrUrl: string,
    newFile: File | Blob,
    newPath: string,
    options?: StorageUploadOptions
  ): Promise<RepositoryResponse<StorageUploadResult>> {
    try {
      if (oldPathOrUrl) {
        const deleteRes = await this.deleteFile(bucket, oldPathOrUrl);
        if (!deleteRes.success) {
          this.logError('StorageRepository.replaceFile', `Old file deletion notice: ${deleteRes.error}`);
        }
      }

      return await this.uploadFile(bucket, newPath, newFile, options);
    } catch (err) {
      return this.handleError<StorageUploadResult>(err, `Exception replacing file in ${bucket}`);
    }
  }
}

// Singleton repository instance
export const storageRepository = new StorageRepository();
