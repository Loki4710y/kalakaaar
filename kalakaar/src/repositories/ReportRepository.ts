import { BaseRepository, RepositoryResponse } from './BaseRepository';
import { isUuid } from './utils';

export type ReportItemType = 'artist' | 'artwork' | 'story';

export class ReportRepository extends BaseRepository {
  /** Files a report. The database enforces: signed-in, one report per item, 20 per day. */
  public async createReport(itemType: ReportItemType, itemId: string, reason: string): Promise<RepositoryResponse<boolean>> {
    try {
      if (!isUuid(itemId)) return this.handleError<boolean>('Invalid item');
      const text = reason.trim().slice(0, 500);
      if (text.length < 3) return this.handleError<boolean>('Please tell us briefly what is wrong.');
      const { error } = await this.client.from('reports').insert({ item_type: itemType, item_id: itemId, reason: text });
      if (error?.code === '23505') return this.handleError<boolean>('You have already reported this.');
      if (error?.code === '42501') return this.handleError<boolean>('Please log in to report.');
      if (error) return this.handleError<boolean>(error, 'Could not send your report');
      return this.handleSuccess<boolean>(true);
    } catch (err) {
      return this.handleError<boolean>(err, 'Could not send your report');
    }
  }
}

export const reportRepository = new ReportRepository();
