import { NextRequest, NextResponse } from 'next/server';
import { AppStore } from '@/lib/storage/store';

export async function GET() {
  try {
    const channels = await AppStore.getChannels();
    return NextResponse.json({ success: true, channels });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'خطای سرور';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { username, title } = await req.json();
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'نام کاربری کانال معتبر نیست.' },
        { status: 400 }
      );
    }

    const channel = await AppStore.saveChannel(username, title);
    return NextResponse.json({ success: true, channel });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'خطای سرور';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'شناسه کانال الزامی است.' }, { status: 400 });
    }

    const deleted = await AppStore.removeChannel(id);
    return NextResponse.json({ success: deleted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'خطای سرور';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
