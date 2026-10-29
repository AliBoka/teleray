import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { configs, filename = 'v2ray-configs', format = 'txt' } = await req.json();

    if (!Array.isArray(configs) || configs.length === 0) {
      return NextResponse.json(
        { error: 'لیست کانفیگ‌ها خالی است.' },
        { status: 400 }
      );
    }

    const rawContent = configs.join('\n');
    let outputContent = rawContent;
    let ext = 'txt';

    if (format === 'base64') {
      outputContent = Buffer.from(rawContent, 'utf-8').toString('base64');
      ext = 'sub';
    }

    const safeFilename = filename.replace(/[^a-zA-Z0-9_-]/g, '_');

    return new NextResponse(outputContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${safeFilename}.${ext}"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'خطای سرور';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
