import { NextRequest, NextResponse } from 'next/server';
import { TelegramScraper } from '@/lib/scraper/telegram';
import { ConfigParser } from '@/lib/parser/config-parser';
import { ConfigNormalizer } from '@/lib/parser/config-normalizer';
import { AppStore } from '@/lib/storage/store';
import { ScrapeOptions, ScrapeResult } from '@/types/config';

export async function POST(req: NextRequest) {
  try {
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

    // 4. Save to store snapshot for live subscription URL
    const snapshot = await AppStore.saveSnapshot(cleanChannel, processedConfigs);

    const result: ScrapeResult = {
      channel: cleanChannel,
      totalMessagesScanned: messages.length,
      configsFound: processedConfigs.length,
      configs: processedConfigs,
    };

    return NextResponse.json({
      success: true,
      snapshotId: snapshot.id,
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
