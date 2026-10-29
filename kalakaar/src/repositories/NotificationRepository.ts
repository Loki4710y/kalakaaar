import { BaseRepository, RepositoryResponse } from './BaseRepository';

export type NotificationType =
  | 'welcome'
  | 'new_follower'
  | 'new_review'
  | 'artwork_liked'
  | 'artwork_saved'
  | 'story_published'
  | 'collection_published'
  | 'featured_artwork'
  | 'featured_collection'
  | 'featured_story';

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  reference_id?: string;
  is_read: boolean;
  created_at: string;
}

export class NotificationRepository extends BaseRepository {
  /**
   * Create a new notification
   */
  public async createNotification(notification: AppNotification): Promise<RepositoryResponse<AppNotification>> {
    return this.notConnected();
  }

  /**
   * Retrieve all notifications for a user sorted newest first
   */
  public async getNotifications(userId: string): Promise<RepositoryResponse<AppNotification[]>> {
    return this.handleSuccess([]);
  }

  /**
   * Retrieve unread notifications for a user
   */
  public async getUnreadNotifications(userId: string): Promise<RepositoryResponse<AppNotification[]>> {
    return this.handleSuccess([]);
  }

  /**
   * Get unread notification count for a user
   */
  public async getUnreadCount(userId: string): Promise<RepositoryResponse<number>> {
    return this.handleSuccess(0);
  }

  /**
   * Mark a single notification as read
   */
  public async markAsRead(notificationId: string, userId: string): Promise<RepositoryResponse<boolean>> {
    return this.notConnected();
  }

  /**
   * Mark all notifications as read for a user
   */
  public async markAllRead(userId: string): Promise<RepositoryResponse<boolean>> {
    return this.notConnected();
  }

  /**
   * Delete a single notification
   */
  public async deleteNotification(notificationId: string, userId: string): Promise<RepositoryResponse<boolean>> {
    return this.notConnected();
  }

  /**
   * Clear all notifications for a user
   */
  public async clearAll(userId: string): Promise<RepositoryResponse<boolean>> {
    return this.notConnected();
  }
}

export const notificationRepository = new NotificationRepository();
