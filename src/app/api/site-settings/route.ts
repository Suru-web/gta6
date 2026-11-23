import { connection, NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/site-settings';

export async function GET() {
  await connection();
  try {
    return NextResponse.json({ success: true, settings: await getSiteSettings() }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error) {
    console.error('Could not load site settings:', error);
    return NextResponse.json({ success: false, error: 'Could not load site settings' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
