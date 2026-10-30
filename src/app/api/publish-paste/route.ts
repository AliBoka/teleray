import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { configs, format = 'raw' } = await req.json();

    if (!Array.isArray(configs) || configs.length === 0) {
      return NextResponse.json(
        { error: 'لیست کانفیگ‌ها خالی است.' },
        { status: 400 }
      );
    }

    const plainText = configs.join('\n');
    const content =
      format === 'base64'
        ? Buffer.from(plainText, 'utf-8').toString('base64')
        : plainText;

    // Publish to dpaste.org (Zero API key, 100% anonymous, public raw URL)
    const form = new URLSearchParams();
    form.append('content', content);
    form.append('syntax', 'text');
    form.append('expiry_days', '30');

    const dpasteRes = await fetch('https://dpaste.org/api/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (TG-V2Ray-Exporter)',
      },
      body: form.toString(),
    });

    if (!dpasteRes.ok) {
      throw new Error(`خطا در ارتباط با سرویس Pastebin (${dpasteRes.status})`);
    }

    const responseUrl = (await dpasteRes.text()).trim().replace(/["']/g, '');
    const rawUrl = `${responseUrl}/raw`;

    return NextResponse.json({
      success: true,
      url: responseUrl,
      rawUrl,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'خطای سرور در انتشار لینک ناشناس';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
