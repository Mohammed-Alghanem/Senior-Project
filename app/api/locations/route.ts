import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const FALLBACK_AL_QATIF = [
  { location_id: 1, name: 'Al Qatif Central', city: 'Al Qatif', risk_class: 'low', coordinates: '26.5200,50.0089' },
];

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      select: {
        location_id: true,
        name: true,
        city: true,
        risk_class: true,
        coordinates: true,
      },
      take: 100,
      orderBy: {
        location_id: 'asc',
      },
    });
    return NextResponse.json({ locations: locations.length > 0 ? locations : FALLBACK_AL_QATIF });
  } catch (error) {
    console.error('Error fetching locations', error);
    return NextResponse.json({ locations: FALLBACK_AL_QATIF });
  }
}

