import fs from 'fs/promises';
import path from 'path';
import { StorageProvider, StorageUploadResult } from './base';

export class LocalFileStorageProvider implements StorageProvider {
  public readonly id = 'local';
  public readonly name = 'فایل متنی محلی (Local File)';

  private readonly exportsDir = path.join(process.cwd(), 'data', 'exports');

  public isConfigured(): boolean {
    return true; // Always available, zero API key required
  }

  public async saveConfigs(filename: string, content: string): Promise<StorageUploadResult> {
    try {
      await fs.mkdir(this.exportsDir, { recursive: true });
      const safeName = filename.endsWith('.txt') ? filename : `${filename}.txt`;
      const filePath = path.join(this.exportsDir, safeName);

      await fs.writeFile(filePath, content, 'utf-8');

      return {
        success: true,
        provider: this.id,
        filename: safeName,
        url: `/api/export?file=${encodeURIComponent(safeName)}`,
      };
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : 'خطا در ذخیره فایل محلی';
      return {
        success: false,
        provider: this.id,
        filename,
        error,
      };
    }
  }
}
