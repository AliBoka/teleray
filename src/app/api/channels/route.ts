import { NextResponse } from 'next/server';
import { FEATURED_CHANNELS } from '@/config/featured-channels';

export async function GET() {
  return NextResponse.json({ success: true, channels: FEATURED_CHANNELS });
}
