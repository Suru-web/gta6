import { NextRequest, NextResponse } from 'next/server';
import { getUpiConfig, saveUpiConfig } from '@/lib/config-db';
import { verifyAdmin } from '@/lib/auth';

export async function GET() {
  const config = await getUpiConfig();
  return NextResponse.json({ success: true, config });
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { upiId, payeeName, note, customQrUrl } = body;

    if (!upiId) {
      return NextResponse.json({ success: false, error: 'UPI ID is required' }, { status: 400 });
    }

    const updated = await saveUpiConfig({
      upiId: String(upiId).trim(),
      payeeName: String(payeeName || 'GTA 6 Recovery Fund').trim(),
      note: String(note || 'GTA6 Fund').trim(),
      customQrUrl: customQrUrl || undefined,
    });

    return NextResponse.json({ success: true, config: updated });
  } catch (error) {
    console.error('Save config error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update UPI settings' }, { status: 500 });
  }
}
