import { NextRequest, NextResponse } from 'next/server';
import { getDonations, addDonation, computeStats, deleteDonation } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth';
import { getBadgeForAmount } from '@/config/site';
import { sendDonationAlert } from '@/lib/notifications';

export async function GET() {
  try {
    const donations = await getDonations();
    const stats = computeStats(donations);
    
    return NextResponse.json(
      {
        success: true,
        donations,
        stats,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('API GET /api/donations error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve donations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, amount, message, badge, utrNumber, screenshotUrl } = body;

    const parsedAmount = Math.max(1, Math.min(100000, Number(amount) || 1));

    const cleanRef = utrNumber ? String(utrNumber).trim() : '';
    if (cleanRef && !/^\d{12}$/.test(cleanRef) && !/^[A-Za-z0-9\-_#]{3,35}$/.test(cleanRef)) {
      return NextResponse.json(
        { success: false, error: 'Transaction Reference must be a 12-digit UPI UTR or valid payment reference ID.' },
        { status: 400 }
      );
    }
    
    const newDonation = await addDonation({
      name: typeof name === 'string' ? name.slice(0, 50) : '',
      amount: parsedAmount,
      message: typeof message === 'string' ? message.slice(0, 200) : '',
      badge: typeof badge === 'string' && badge ? badge : getBadgeForAmount(parsedAmount),
      utrNumber: typeof utrNumber === 'string' ? utrNumber.trim() : undefined,
      screenshotUrl: typeof screenshotUrl === 'string' && screenshotUrl.startsWith('data:image') ? screenshotUrl : undefined,
    });

    const allDonations = await getDonations();
    const stats = computeStats(allDonations);

    // Asynchronously dispatch instant webhook alerts (Telegram/Discord)
    sendDonationAlert({ donation: newDonation, stats }).catch((err) => {
      console.error('[Notification] Background alert error:', err);
    });

    return NextResponse.json({
      success: true,
      donation: newDonation,
      stats,
    });
  } catch (error: unknown) {
    console.error('API POST /api/donations error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to record donation';
    return NextResponse.json(
      { success: false, error: msg },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing donation id' }, { status: 400 });
    }

    await deleteDonation(id);
    const donations = await getDonations();
    const stats = computeStats(donations);

    return NextResponse.json({ success: true, donations, stats });
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest?.startsWith('NEXT_')) {
      throw error;
    }
    console.error('API DELETE /api/donations error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete donation' }, { status: 500 });
  }
}
