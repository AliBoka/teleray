import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/storage/db';
import { TelegramScraper } from '@/lib/scraper/telegram';
import { ConfigParser } from '@/lib/parser/config-parser';
import { ConfigNormalizer } from '@/lib/parser/config-normalizer';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'base64';

    // 1. Try finding unique subscription record in database
    let subRecord = await DatabaseService.getSubscription(id);

    // 2. If not found, check if ID matches a channel username directly
    if (!subRecord) {
      const cleanChannel = TelegramScraper.cleanChannelUsername(id);
      try {
        const messages = await TelegramScraper.fetchMessages(cleanChannel, 50);
        const rawConfigs: { raw: string; messageId?: number }[] = [];
        for (const msg of messages) {
          const extracted = ConfigParser.extractRawConfigs(msg.text);
          for (const raw of extracted) {
            rawConfigs.push({ raw, messageId: msg.id });
          }
        }
        const configs = ConfigNormalizer.processConfigs(rawConfigs, {
          channel: cleanChannel,
          limit: 50,
          deduplicate: true,
        });
        subRecord = await DatabaseService.createSubscription(cleanChannel, configs);
      } catch {
        return new NextResponse('اشتراک یا کانال یافت نشد.', { status: 404 });
      }
    }

    if (!subRecord || subRecord.configs.length === 0) {
      return new NextResponse('هیچ کانفیگی برای این اشتراک وجود ندارد.', {
        status: 404,
      });
    }

    const rawLines = subRecord.configs.map((c) => c.raw).join('\n');

    let bodyContent: string;
    if (format === 'raw') {
      bodyContent = rawLines;
    } else {
      // Standard base64 subscription format
      bodyContent = Buffer.from(rawLines, 'utf-8').toString('base64');
    }

    return new NextResponse(bodyContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Profile-Update-Interval': '6',
        'Subscription-Userinfo': 'upload=0; download=0; total=107374182400; expire=0',
        'Cache-Control': 'public, max-age=60',
        'Access-Control-Allow-Origin': '*',
        'Content-Disposition': `inline; filename="${subRecord.channel}-subscription.txt"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'خطای سرور';
    return new NextResponse(message, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}
