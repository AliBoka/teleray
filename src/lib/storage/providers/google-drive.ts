import { StorageProvider, StorageUploadResult } from './base';

export interface GoogleDriveConfig {
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  folderId?: string;
}

export class GoogleDriveStorageProvider implements StorageProvider {
  public readonly id = 'google-drive';
  public readonly name = 'Google Drive';

  public isConfigured(): boolean {
    return Boolean(
      (process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET &&
        process.env.GOOGLE_REFRESH_TOKEN) ||
        process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    );
  }

  public async saveConfigs(filename: string, content: string): Promise<StorageUploadResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        provider: this.id,
        filename,
        error:
          'گوگل درایو هنوز پیکربندی نشده است. برای فعال‌سازی در فاز بعدی، متغیرهای GOOGLE_CLIENT_ID و GOOGLE_CLIENT_SECRET و GOOGLE_REFRESH_TOKEN را در فایل .env.local وارد کنید.',
      };
    }

    try {
      // Refresh OAuth2 access token
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          refresh_token: process.env.GOOGLE_REFRESH_TOKEN || '',
          grant_type: 'refresh_token',
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) {
        throw new Error('دریافت توکن دسترسی از گوگل انجام نشد.');
      }

      const accessToken = tokenData.access_token;
      const safeFilename = filename.endsWith('.txt') ? filename : `${filename}.txt`;

      // Multipart upload to Google Drive
      const metadata = {
        name: safeFilename,
        mimeType: 'text/plain',
        parents: process.env.GOOGLE_DRIVE_FOLDER_ID
          ? [process.env.GOOGLE_DRIVE_FOLDER_ID]
          : undefined,
      };

      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: text/plain; charset=UTF-8\r\n\r\n' +
        content +
        closeDelimiter;

      const uploadRes = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        }
      );

      const fileData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(fileData.error?.message || 'خطا در آپلود به گوگل درایو');
      }

      return {
        success: true,
        provider: this.id,
        filename: safeFilename,
        fileId: fileData.id,
        url: `https://drive.google.com/file/d/${fileData.id}/view`,
      };
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : 'خطای ناشناخته در آپلود گوگل درایو';
      return {
        success: false,
        provider: this.id,
        filename,
        error,
      };
    }
  }
}
