import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isDbUnavailableError } from '@/lib/db-error';

const FALLBACK_AL_QATIF = [
  { location_id: 1, name: 'Al Qatif Central', city: 'Al Qatif', risk_class: 'low', coordinates: '26.5200,50.0089' },
];

/** Only return locations associated with Al Qatif so dashboard never shows other cities' data. */
export async function GET() {
  try {
    const all = await prisma.location.findMany({
      select: {
        location_id: true,
        name: true,
        city: true,
        risk_class: true,
        coordinates: true,
      },
      orderBy: { location_id: 'asc' },
    });
    const alQatifOnly = all.filter((loc) => {
      const city = (loc.city ?? '').toLowerCase();
      const name = (loc.name ?? '').toLowerCase();
      return city.includes('qatif') || name.includes('qatif') || city === 'al qatif' || name === 'al qatif';
    });
    const list = alQatifOnly.length > 0 ? alQatifOnly : FALLBACK_AL_QATIF;
    const locations = list.map((loc) => ({
      ...loc,
      location_id: typeof loc.location_id === 'bigint' ? String(loc.location_id) : loc.location_id,
    }));
    return NextResponse.json({ locations });
  } catch (error) {
    if (isDbUnavailableError(error)) {
      console.warn('Database unavailable while fetching locations.');
      return NextResponse.json({ locations: FALLBACK_AL_QATIF, dbUnavailable: true });
    }
    console.error('Error fetching locations', error);
    return NextResponse.json({ locations: FALLBACK_AL_QATIF });
  }
}

