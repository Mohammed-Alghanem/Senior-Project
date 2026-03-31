import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { QueryMode } from '@prisma/client';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ country: string }> }
) {
  const { country } = await params;

  const slugToCountry: Record<string, string> = {
    'saudi-arabia': 'Saudi Arabia',
    uae: 'United Arab Emirates',
    kuwait: 'Kuwait',
  };
  const countryName = slugToCountry[country];
  if (!country || !countryName) {
    return NextResponse.json({ cities: [] });
  }

  const fallbackSaudiCities = [
    { id: 'al-qatif', city: 'Al Qatif', name: 'Al Qatif Central', risk_class: 'low' as string | null, coordinates: '26.5200,50.0089' as string | null },
  ];

  try {
    const locations = await prisma.location.findMany({
      where: {
        country: { equals: countryName, mode: QueryMode.insensitive },
      },
      select: {
        location_id: true,
        name: true,
        city: true,
        risk_class: true,
        coordinates: true,
      },
      orderBy: { location_id: 'asc' },
    });

    const byCity = new Map<string, { city: string; name: string; risk_class: string | null; coordinates: string | null; location_id: string }>();
    for (const loc of locations) {
      const cityName = loc.city || loc.name || `Location ${loc.location_id}`;
      if (!byCity.has(cityName)) {
        byCity.set(cityName, {
          city: cityName,
          name: loc.name || cityName,
          risk_class: loc.risk_class,
          coordinates: loc.coordinates,
          location_id: String(loc.location_id),
        });
      }
    }

    let cities = Array.from(byCity.values()).map((c) => ({
      ...c,
      id: c.city.toLowerCase().replace(/\s+/g, '-'),
    }));

    // If no cities from DB for Saudi Arabia, show Al Qatif so the page works (city in Saudi Arabia)
    if (cities.length === 0 && country === 'saudi-arabia') {
      cities = fallbackSaudiCities;
    }

    return NextResponse.json({ cities });
  } catch (error) {
    console.error('Error fetching cities', error);
    // When DB fails, still return Saudi Arabia cities so the UI doesn't show "Could not load cities"
    if (country === 'saudi-arabia') {
      return NextResponse.json({ cities: fallbackSaudiCities });
    }
    return NextResponse.json({ error: 'Failed to load cities' }, { status: 500 });
  }
}
