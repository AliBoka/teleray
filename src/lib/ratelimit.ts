import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { headers } from 'next/headers';

// In-memory sliding window fallback for local development or when Redis is not available
const memoryStore = new Map<string, { count: number; expiresAt: number }>();

function checkMemoryRateLimit(
  key: string,
  limit = 15,
  windowMs = 60 * 1000
): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now > entry.expiresAt) {
    memoryStore.set(key, { count: 1, expiresAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 };
  }

  entry.count += 1;
  return { success: true, remaining: limit - entry.count };
}

let redisRatelimit: Ratelimit | null = null;
let isInitialized = false;

function getRedisRatelimit(): Ratelimit | null {
  if (isInitialized) return redisRatelimit;
  isInitialized = true;

  const url =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.STORAGE_REST_API_URL ||
    process.env.STORAGE_KV_REST_API_URL;
  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.STORAGE_REST_API_TOKEN ||
    process.env.STORAGE_KV_REST_API_TOKEN;

  if (url && token) {
    try {
      const redis = new Redis({ url, token });
      redisRatelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(15, '1 m'),
        analytics: false,
        prefix: 'teleray_rl',
      });
    } catch {
      redisRatelimit = null;
    }
  }

  return redisRatelimit;
}

export async function rateLimit(
  identifier: string,
  limit = 15
): Promise<{ success: boolean; remaining: number }> {
  const rl = getRedisRatelimit();
  if (rl) {
    try {
      const res = await rl.limit(identifier);
      return { success: res.success, remaining: res.remaining };
    } catch {
      return checkMemoryRateLimit(identifier, limit);
    }
  }
  return checkMemoryRateLimit(identifier, limit);
}

export async function getClientIp(): Promise<string> {
  try {
    const h = await headers();
    const forwardedFor = h.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    const realIp = h.get('x-real-ip');
    if (realIp) {
      return realIp.trim();
    }
  } catch {
    // fallback if headers() cannot be resolved
  }
  return '127.0.0.1';
}
