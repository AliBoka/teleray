export interface StorageUploadResult {
  success: boolean;
  provider: string;
  filename: string;
  fileId?: string;
  url?: string;
  error?: string;
}

export interface StorageProvider {
  readonly name: string;
  readonly id: string;
  isConfigured(): boolean;
  saveConfigs(filename: string, content: string): Promise<StorageUploadResult>;
}
