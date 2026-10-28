import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import type { SavedChannel, V2RayConfig } from '../../types/config.ts';

export interface SubscriptionSnapshot {
  id: string;
  channel: string;
  configs: V2RayConfig[];
  updatedAt: string;
}

interface AppData {
  channels: SavedChannel[];
  snapshots: Record<string, SubscriptionSnapshot>;
}

export class AppStore {
  private static readonly DATA_DIR = path.join(process.cwd(), 'data');
  private static readonly FILE_PATH = path.join(process.cwd(), 'data', 'store.json');

  private static async ensureInitialized(): Promise<AppData> {
    try {
      await fs.mkdir(this.DATA_DIR, { recursive: true });
      const raw = await fs.readFile(this.FILE_PATH, 'utf-8');
      return JSON.parse(raw);
    } catch {
      const initial: AppData = {
        channels: [
          {
            id: 'sample-1',
            username: 'v2rayng_org',
            title: 'V2RayNG Official Channel',
            lastScrapedAt: undefined,
            configsCount: 0,
          },
        ],
        snapshots: {},
      };
      await fs.mkdir(this.DATA_DIR, { recursive: true });
      await fs.writeFile(this.FILE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
  }

  private static async writeData(data: AppData): Promise<void> {
    await fs.mkdir(this.DATA_DIR, { recursive: true });
    await fs.writeFile(this.FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  }

  public static async getChannels(): Promise<SavedChannel[]> {
    const data = await this.ensureInitialized();
    return data.channels;
  }

  public static async saveChannel(username: string, title?: string): Promise<SavedChannel> {
    const data = await this.ensureInitialized();
    const cleanUsername = username.trim().replace(/^@/, '');

    const existing = data.channels.find(
      (c) => c.username.toLowerCase() === cleanUsername.toLowerCase()
    );
    if (existing) {
      return existing;
    }

    const newChannel: SavedChannel = {
      id: crypto.randomUUID(),
      username: cleanUsername,
      title: title || cleanUsername,
      configsCount: 0,
    };

    data.channels.push(newChannel);
    await this.writeData(data);
    return newChannel;
  }

  public static async removeChannel(id: string): Promise<boolean> {
    const data = await this.ensureInitialized();
    const initialLen = data.channels.length;
    data.channels = data.channels.filter((c) => c.id !== id);

    if (data.channels.length !== initialLen) {
      await this.writeData(data);
      return true;
    }
    return false;
  }

  public static async saveSnapshot(
    channel: string,
    configs: V2RayConfig[]
  ): Promise<SubscriptionSnapshot> {
    const data = await this.ensureInitialized();
    const cleanChannel = channel.trim().replace(/^@/, '');
    const id = crypto.createHash('md5').update(cleanChannel.toLowerCase()).digest('hex').slice(0, 12);

    const snapshot: SubscriptionSnapshot = {
      id,
      channel: cleanChannel,
      configs,
      updatedAt: new Date().toISOString(),
    };

    data.snapshots[id] = snapshot;

    // Update channel stats if exists
    const ch = data.channels.find(
      (c) => c.username.toLowerCase() === cleanChannel.toLowerCase()
    );
    if (ch) {
      ch.lastScrapedAt = snapshot.updatedAt;
      ch.configsCount = configs.length;
    }

    await this.writeData(data);
    return snapshot;
  }

  public static async getSnapshot(id: string): Promise<SubscriptionSnapshot | null> {
    const data = await this.ensureInitialized();
    return data.snapshots[id] || null;
  }
}
