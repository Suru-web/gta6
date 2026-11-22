import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const country = (
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    ''
  ).toUpperCase();

  const isIndia = country === 'IN';

  return NextResponse.json(
    {
      success: true,
      country: country || 'UNKNOWN',
      isIndia,
      recommendedRegion: !country ? 'india' : (isIndia ? 'india' : 'worldwide'),
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
