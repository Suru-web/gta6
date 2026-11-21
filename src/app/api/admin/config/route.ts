import { NextRequest, NextResponse } from 'next/server';
import { getUpiConfig, saveUpiConfig } from '@/lib/config-db';

const AUTH_SECRET = 'gta6_admin_secret_token_99999';

export async function GET() {
  const config = await getUpiConfig();
  return NextResponse.json({ success: true, config });
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('admin_token')?.value;

    if (authHeader !== `Bearer ${AUTH_SECRET}` && cookieToken !== AUTH_SECRET) {
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
