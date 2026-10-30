import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { Redis } from '@upstash/redis';
import { customAlphabet } from 'nanoid';
import type { SavedChannel, V2RayConfig } from '../../types/config.ts';

export interface SubscriptionRecord {
  id: string; // unique token e.g. "k8x2m9p1q4"
  channel: string;
  configs: V2RayConfig[];
  configsCount: number;
  createdAt: string;
  expiresAt: string;
}

interface AppData {
  channels: SavedChannel[];
  subscriptions: Record<string, SubscriptionRecord>;
  channelLatestSub: Record<string, string>; // channel -> unique sub ID
}

const generateSubId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10);
const TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds (604,800s)

export class DatabaseService {
  private static redisClient: Redis | null = null;
  private static checkedRedis = false;

  private static getRedis(): Redis | null {
    if (this.checkedRedis) return this.redisClient;
    this.checkedRedis = true;

    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    if (url && token) {
      try {
        this.redisClient = new Redis({ url, token });
      } catch (err) {
        console.warn('Failed to initialize Upstash Redis, falling back to local file storage', err);
      }
    }
    return this.redisClient;
  }

  // Local file storage directory (uses /tmp on Vercel serverless)
  private static getStoragePath(): { dir: string; file: string } {
    const isVercel = Boolean(process.env.VERCEL);
    const dir = isVercel
      ? path.join('/tmp', 'data')
      : path.join(process.cwd(), 'data');
    const file = path.join(dir, 'store.json');
    return { dir, file };
  }

  private static async getLocalData(): Promise<AppData> {
    const { dir, file } = this.getStoragePath();
    try {
      await fs.mkdir(dir, { recursive: true });
      const raw = await fs.readFile(file, 'utf-8');
      const data = JSON.parse(raw);
      if (!data.subscriptions) data.subscriptions = {};
      if (!data.channelLatestSub) data.channelLatestSub = {};
      if (!data.channels) data.channels = [];
      return data;
    } catch {
      const initial: AppData = {
        channels: [
          {
            id: 'ch-1',
            username: 'ConfigsHUB',
            title: 'ConfigsHUB',
            configsCount: 0,
          },
          {
            id: 'ch-2',
            username: 'v2ray_collector',
            title: 'V2Ray Collector',
            configsCount: 0,
          },
          {
            id: 'ch-3',
            username: 'v2ray_free_conf',
            title: 'V2Ray Free Configs',
            configsCount: 0,
          },
          {
            id: 'ch-4',
            username: 'v2ray_outlineir',
            title: 'Outline & V2Ray IR',
            configsCount: 0,
          },
          {
            id: 'ch-5',
            username: 'freev2rays',
            title: 'Free V2Rays',
            configsCount: 0,
          },
          {
            id: 'ch-6',
            username: 'v2rayng_daily',
            title: 'V2RayNG Daily',
            configsCount: 0,
          },
        ],
        subscriptions: {},
        channelLatestSub: {},
      };
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(file, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
  }

  private static async saveLocalData(data: AppData): Promise<void> {
    const { dir, file } = this.getStoragePath();
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Generates a new unique subscription record and saves it
   */
  public static async createSubscription(
    channel: string,
    configs: V2RayConfig[]
  ): Promise<SubscriptionRecord> {
    const cleanChannel = channel
      .trim()
      .replace(/^(https?:\/\/)?(t\.me|telegram\.me)\/(s\/)?/i, '')
      .replace(/^@+/, '')
      .split('/')[0]
      .split('?')[0]
      .trim();

    const uniqueId = generateSubId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + TTL_SECONDS * 1000).toISOString();

    const record: SubscriptionRecord = {
      id: uniqueId,
      channel: cleanChannel,
      configs,
      configsCount: configs.length,
      createdAt: now.toISOString(),
      expiresAt,
    };

    const redis = this.getRedis();

    if (redis) {
      // Save in Upstash Redis with native 7-day TTL
      await redis.set(`sub:${uniqueId}`, JSON.stringify(record), { ex: TTL_SECONDS });
      // Map channel to latest subscription ID with TTL
      await redis.set(`channel_sub:${cleanChannel.toLowerCase()}`, uniqueId, { ex: TTL_SECONDS });

      // Update channel stats if channel exists in channels list
      const channelsRaw = await redis.get<string>('channels');
      if (channelsRaw) {
        const channels: SavedChannel[] =
          typeof channelsRaw === 'string' ? JSON.parse(channelsRaw) : channelsRaw;
        const target = channels.find(
          (c) => c.username.toLowerCase() === cleanChannel.toLowerCase()
        );
        if (target) {
          target.lastScrapedAt = record.createdAt;
          target.configsCount = configs.length;
          await redis.set('channels', JSON.stringify(channels));
        }
      }
    } else {
      // Save locally
      const data = await this.getLocalData();

      // Clean up any expired local subscriptions to keep storage compact
      const currentTimestamp = Date.now();
      for (const [key, sub] of Object.entries(data.subscriptions)) {
        if (sub.expiresAt && currentTimestamp > new Date(sub.expiresAt).getTime()) {
          delete data.subscriptions[key];
        }
      }

      data.subscriptions[uniqueId] = record;
      data.channelLatestSub[cleanChannel.toLowerCase()] = uniqueId;

      const target = data.channels.find(
        (c) => c.username.toLowerCase() === cleanChannel.toLowerCase()
      );
      if (target) {
        target.lastScrapedAt = record.createdAt;
        target.configsCount = configs.length;
      }

      await this.saveLocalData(data);
    }

    return record;
  }

  /**
   * Retrieves subscription by unique ID (or fallback by channel username)
   */
  public static async getSubscription(
    idOrChannel: string
  ): Promise<SubscriptionRecord | null> {
    const clean = idOrChannel
      .trim()
      .replace(/^(https?:\/\/)?(t\.me|telegram\.me)\/(s\/)?/i, '')
      .replace(/^@+/, '')
      .split('/')[0]
      .split('?')[0]
      .trim();

    const redis = this.getRedis();

    if (redis) {
      // 1. Check direct sub ID in Redis
      const byId = await redis.get<string>(`sub:${clean}`);
      if (byId) {
        return typeof byId === 'string' ? JSON.parse(byId) : byId;
      }

      // 2. Check if clean is a channel name
      const latestSubId = await redis.get<string>(`channel_sub:${clean.toLowerCase()}`);
      if (latestSubId) {
        const byChannel = await redis.get<string>(`sub:${latestSubId}`);
        if (byChannel) {
          return typeof byChannel === 'string' ? JSON.parse(byChannel) : byChannel;
        }
      }

      return null;
    }

    // Local lookup
    const data = await this.getLocalData();
    const now = Date.now();

    const isRecordExpired = (record: SubscriptionRecord) => {
      return Boolean(record.expiresAt && now > new Date(record.expiresAt).getTime());
    };

    // 1. Check direct ID
    if (data.subscriptions[clean]) {
      const record = data.subscriptions[clean];
      return isRecordExpired(record) ? null : record;
    }

    // 2. Check channel latest mapping
    const mappedId = data.channelLatestSub[clean.toLowerCase()];
    if (mappedId && data.subscriptions[mappedId]) {
      const record = data.subscriptions[mappedId];
      return isRecordExpired(record) ? null : record;
    }

    // 3. Fallback search through subscriptions
    for (const sub of Object.values(data.subscriptions)) {
      if (sub.channel.toLowerCase() === clean.toLowerCase()) {
        return isRecordExpired(sub) ? null : sub;
      }
    }

    return null;
  }

  /**
   * Channel management
   */
  public static async getChannels(): Promise<SavedChannel[]> {
    const redis = this.getRedis();
    if (redis) {
      const raw = await redis.get<string>('channels');
      if (!raw) return [];
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    }
    const data = await this.getLocalData();
    return data.channels;
  }

  public static async saveChannel(username: string, title?: string): Promise<SavedChannel> {
    const clean = username
      .trim()
      .replace(/^(https?:\/\/)?(t\.me|telegram\.me)\/(s\/)?/i, '')
      .replace(/^@+/, '')
      .split('/')[0]
      .split('?')[0]
      .trim();

    const redis = this.getRedis();

    if (redis) {
      const channels = await this.getChannels();
      const existing = channels.find((c) => c.username.toLowerCase() === clean.toLowerCase());
      if (existing) return existing;

      const newChannel: SavedChannel = {
        id: crypto.randomUUID(),
        username: clean,
        title: title || clean,
        configsCount: 0,
      };

      channels.push(newChannel);
      await redis.set('channels', JSON.stringify(channels));
      return newChannel;
    }

    const data = await this.getLocalData();
    const existing = data.channels.find((c) => c.username.toLowerCase() === clean.toLowerCase());
    if (existing) return existing;

    const newChannel: SavedChannel = {
      id: crypto.randomUUID(),
      username: clean,
      title: title || clean,
      configsCount: 0,
    };

    data.channels.push(newChannel);
    await this.saveLocalData(data);
    return newChannel;
  }

  public static async deleteChannel(id: string): Promise<boolean> {
    const redis = this.getRedis();
    if (redis) {
      const channels = await this.getChannels();
      const filtered = channels.filter((c) => c.id !== id);
      if (filtered.length !== channels.length) {
        await redis.set('channels', JSON.stringify(filtered));
        return true;
      }
      return false;
    }

    const data = await this.getLocalData();
    const initialLen = data.channels.length;
    data.channels = data.channels.filter((c) => c.id !== id);
    if (data.channels.length !== initialLen) {
      await this.saveLocalData(data);
      return true;
    }
    return false;
  }
}
