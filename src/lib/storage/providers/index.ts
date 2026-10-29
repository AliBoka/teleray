import { StorageProvider } from './base';
import { LocalFileStorageProvider } from './local-file';
import { GoogleDriveStorageProvider } from './google-drive';

export const storageProviders: Record<string, StorageProvider> = {
  local: new LocalFileStorageProvider(),
  'google-drive': new GoogleDriveStorageProvider(),
};

export function getStorageProvider(id: string = 'local'): StorageProvider {
  return storageProviders[id] || storageProviders.local;
}

export * from './base';
export * from './local-file';
export * from './google-drive';
