import { NextRequest, NextResponse } from 'next/server';
import { TelegramScraper } from '@/lib/scraper/telegram';
import { ConfigParser } from '@/lib/parser/config-parser';
import { ConfigNormalizer } from '@/lib/parser/config-normalizer';
import { DatabaseService } from '@/lib/storage/db';
import { ScrapeOptions, ScrapeResult } from '@/types/config';
import { getClientIp, rateLimit } from '@/lib/ratelimit';

export async function POST(req: NextRequest) {
  try {
    const ip = await getClientIp();
    const rl = await rateLimit(`scrape_${ip}`, 15);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'تعداد درخواست‌ها بیش از حد مجاز است (حداکثر ۱۵ درخواست در دقیقه). لطفاً یک دقیقه دیگر تلاش کنید.' },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': '15',
            'X-RateLimit-Remaining': String(rl.remaining),
          },
        }
      );
    }

    const body: ScrapeOptions = await req.json();
    const {
      channel,
      limit = 100,
      protocols,
      deduplicate = true,
      remarkTemplate = '',
    } = body;

    if (!channel || channel.trim() === '') {
      return NextResponse.json(
        { error: 'نام کانال الزامی است.' },
        { status: 400 }
      );
    }

    const cleanChannel = TelegramScraper.cleanChannelUsername(channel);

    // 1. Fetch messages from Telegram channel
    const messages = await TelegramScraper.fetchMessages(cleanChannel, limit);

    // 2. Extract raw configs from each message
    const rawConfigsWithMeta: { raw: string; messageId?: number }[] = [];

    for (const msg of messages) {
      const extracted = ConfigParser.extractRawConfigs(msg.text);
      for (const raw of extracted) {
        rawConfigsWithMeta.push({
          raw,
          messageId: msg.id,
        });
      }
    }

    // 3. Normalize, filter and deduplicate
    const processedConfigs = ConfigNormalizer.processConfigs(rawConfigsWithMeta, {
      channel: cleanChannel,
      limit,
      protocols,
      deduplicate,
      remarkTemplate,
    });

    // 4. Save unique subscription record to database
    const subRecord = await DatabaseService.createSubscription(cleanChannel, processedConfigs);

    const result: ScrapeResult = {
      channel: cleanChannel,
      totalMessagesScanned: messages.length,
      configsFound: processedConfigs.length,
      configs: processedConfigs,
    };

    return NextResponse.json({
      success: true,
      snapshotId: subRecord.id,
      result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'خطای ناشناخته رخ داده است.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
