import { StorageProvider } from './base';
import { LocalFileStorageProvider } from './local-file';

export const storageProviders: Record<string, StorageProvider> = {
  local: new LocalFileStorageProvider(),
};

export function getStorageProvider(id: string = 'local'): StorageProvider {
  return storageProviders[id] || storageProviders.local;
}

export * from './base';
export * from './local-file';
