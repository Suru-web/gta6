import { NextRequest, NextResponse } from 'next/server';
import { getDonations, addDonation, computeStats, deleteDonation } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth';

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
          'Cache-Control': 'no-store, max-age=0',
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
    const { name, amount, message, badge } = body;

    const parsedAmount = Math.max(1, Math.min(100000, Number(amount) || 1));
    
    const newDonation = await addDonation({
      name: typeof name === 'string' ? name.slice(0, 50) : '',
      amount: parsedAmount,
      message: typeof message === 'string' ? message.slice(0, 200) : '',
      badge: typeof badge === 'string' ? badge : '👑 Gigachad',
    });

    const allDonations = await getDonations();
    const stats = computeStats(allDonations);

    return NextResponse.json({
      success: true,
      donation: newDonation,
      stats,
    });
  } catch (error) {
    console.error('API POST /api/donations error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record donation' },
      { status: 500 }
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
