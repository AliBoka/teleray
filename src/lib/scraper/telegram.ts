import * as cheerio from 'cheerio';

export interface TelegramMessage {
  id: number;
  channel: string;
  text: string;
  date: string;
}

export class TelegramScraper {
  private static readonly BASE_URL = 'https://t.me/s';
  private static readonly USER_AGENTS = [
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  ];

  public static cleanChannelUsername(input: string): string {
    return input
      .trim()
      .replace(/^https?:\/\/(t\.me|telegram\.me)\/(s\/)?/i, '')
      .replace(/^@/, '')
      .split('/')[0]
      .split('?')[0];
  }

  public static validateUsername(username: string): void {
    if (!username) {
      throw new Error('لطفاً شناسه کانال تلگرام را وارد کنید.');
    }

    if (!/^[a-zA-Z0-9_]{3,32}$/.test(username)) {
      throw new Error(
        'شناسه کانال نامعتبر است. نام کاربری تلگرام باید فقط شامل حروف انگلیسی، اعداد یا خط زیر (_) باشد.'
      );
    }
  }

  public static async fetchMessages(
    channelInput: string,
    limit: number = 100
  ): Promise<TelegramMessage[]> {
    const channel = this.cleanChannelUsername(channelInput);
    this.validateUsername(channel);

    const messages: TelegramMessage[] = [];
    const seenIds = new Set<number>();
    let beforeId: number | null = null;
    let attempts = 0;
    const maxAttempts = Math.ceil(limit / 10) + 5;

    while (messages.length < limit && attempts < maxAttempts) {
      attempts++;
      const url = beforeId
        ? `${this.BASE_URL}/${channel}?before=${beforeId}`
        : `${this.BASE_URL}/${channel}`;

      const userAgent =
        this.USER_AGENTS[Math.floor(Math.random() * this.USER_AGENTS.length)];

      const response = await fetch(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept-Language': 'en-US,en;q=0.9,fa;q=0.8',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`کانال @${channel} در تلگرام یافت نشد یا یک کانال خصوصی است.`);
        }
        throw new Error(`خطا در ارتباط با پیش‌نمایش وب تلگرام (${response.status})`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const messageNodes = $('.tgme_widget_message_wrap');
      if (messageNodes.length === 0) {
        if (attempts === 1) {
          // If first attempt has no messages, check if page indicates contact or invalid channel
          const isUserOrBot =
            $('.tgme_page_extra').text().includes('contact') ||
            $('.tgme_action_button_new').text().includes('Send Message');
          if (isUserOrBot) {
            throw new Error(`شناسه @${channel} مربوط به حساب کاربری/ربات است و کانال عمومی تلگرام نیست.`);
          }
          const channelTitle = $('.tgme_channel_info_header_title').text();
          if (!channelTitle) {
            throw new Error(`کانال @${channel} یافت نشد، خصوصی است یا دسترسی عمومی ندارد.`);
          }
        }
        break;
      }

      const batch: TelegramMessage[] = [];
      let minBatchId = Infinity;

      messageNodes.each((_, el) => {
        const postData = $(el).find('.tgme_widget_message').attr('data-post');
        if (!postData) return;

        const parts = postData.split('/');
        const msgId = parseInt(parts[1], 10);
        if (isNaN(msgId) || seenIds.has(msgId)) return;

        if (msgId < minBatchId) {
          minBatchId = msgId;
        }

        const textEl = $(el).find('.tgme_widget_message_text');
        textEl.find('br').replaceWith('\n');
        const text = textEl.text().trim();

        const date = $(el).find('time').attr('datetime') || new Date().toISOString();

        if (text) {
          batch.push({
            id: msgId,
            channel,
            text,
            date,
          });
        }
        seenIds.add(msgId);
      });

      if (batch.length === 0) {
        break;
      }

      messages.push(...batch);

      if (minBatchId !== Infinity && minBatchId > 1) {
        beforeId = minBatchId;
      } else {
        break;
      }
    }

    messages.sort((a, b) => b.id - a.id);
    return messages.slice(0, limit);
  }
}
