import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import { saveSiteSettings } from '@/lib/site-settings';

export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    if (typeof body?.sideQuestVisible !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Side Quest visibility must be true or false' }, { status: 400 });
    }
    const settings = await saveSiteSettings({ sideQuestVisible: body.sideQuestVisible });
    return NextResponse.json({ success: true, settings }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Could not save site settings:', error);
    return NextResponse.json({ success: false, error: 'Could not save visibility. Check shared storage and try again.' }, { status: 503 });
  }
}
