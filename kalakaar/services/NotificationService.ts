import {
  notificationRepository,
  AppNotification,
  NotificationType,
} from '../src/repositories/NotificationRepository';

export type { AppNotification, NotificationType };

export interface NotificationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string | null;
}

export class NotificationService {
  /**
   * Retrieves all notifications for a user sorted by created_at DESC.
   */
  static async getNotifications(userId: string): Promise<NotificationResult<AppNotification[]>> {
    try {
      if (!userId || userId.trim() === '') {
        return {
          success: false,
          error: 'User ID is required to fetch notifications.',
          data: [],
        };
      }

      const repoRes = await notificationRepository.getNotifications(userId);
      return {
        success: repoRes.success,
        data: repoRes.data || [],
        error: repoRes.error,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to retrieve notifications.';
      return { success: false, error: message, data: [] };
    }
  }

  /**
   * Creates a new notification for a specific user.
   */
  static async createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    referenceId?: string
  ): Promise<NotificationResult<AppNotification>> {
    try {
      if (!userId || userId.trim() === '') {
        return { success: false, error: 'User ID is required.' };
      }

      const newNotif: AppNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        user_id: userId,
        title,
        message,
        type,
        reference_id: referenceId,
        is_read: false,
        created_at: new Date().toISOString(),
      };

      const repoRes = await notificationRepository.createNotification(newNotif);
      return {
        success: repoRes.success,
        data: repoRes.data || newNotif,
        error: repoRes.error,
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to create notification.';
      return { success: false, error: errMsg };
    }
  }

  /**
   * Marks a single notification as read.
   */
  static async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<NotificationResult<boolean>> {
    try {
      if (!userId || !notificationId) {
        return { success: false, error: 'Parameters missing.' };
      }

      const repoRes = await notificationRepository.markAsRead(notificationId, userId);
      return {
        success: repoRes.success,
        data: repoRes.data || false,
        error: repoRes.error,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to mark notification as read.';
      return { success: false, error: message };
    }
  }

  /**
   * Marks all notifications as read for a user.
   */
  static async markAllAsRead(userId: string): Promise<NotificationResult<boolean>> {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required.' };
      }

      const repoRes = await notificationRepository.markAllRead(userId);
      return {
        success: repoRes.success,
        data: repoRes.data || false,
        error: repoRes.error,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to mark all as read.';
      return { success: false, error: message };
    }
  }

  /**
   * Deletes a single notification.
   */
  static async deleteNotification(
    notificationId: string,
    userId: string
  ): Promise<NotificationResult<boolean>> {
    try {
      if (!userId || !notificationId) {
        return { success: false, error: 'Parameters missing.' };
      }

      const repoRes = await notificationRepository.deleteNotification(notificationId, userId);
      return {
        success: repoRes.success,
        data: repoRes.data || false,
        error: repoRes.error,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete notification.';
      return { success: false, error: message };
    }
  }

  /**
   * Clears all notifications for a user.
   */
  static async clearAll(userId: string): Promise<NotificationResult<boolean>> {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required.' };
      }

      const repoRes = await notificationRepository.clearAll(userId);
      return {
        success: repoRes.success,
        data: repoRes.data || false,
        error: repoRes.error,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to clear notifications.';
      return { success: false, error: message };
    }
  }
}
