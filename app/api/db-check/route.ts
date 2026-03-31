import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/db-check
 * Quick check: can the app read from the database?
 * Returns the first Al Qatif location and sensor count if connected.
 */
export async function GET() {
  try {
    const location = await prisma.location.findFirst({
      where: {
        OR: [
          { city: { contains: 'Qatif', mode: 'insensitive' } },
          { name: { contains: 'Qatif', mode: 'insensitive' } },
        ],
      },
      select: {
        location_id: true,
        name: true,
        city: true,
        country: true,
        coordinates: true,
      },
    });

    if (!location) {
      return NextResponse.json({
        ok: true,
        message: 'Connected to DB. No Al Qatif location yet – run the seed (SQL or npm run db:seed).',
        data: null,
      });
    }

    const sensorCount = await prisma.sensor.count({
      where: {
        node: { location_id: location.location_id },
      },
    });

    const readingCount = await prisma.sensor_reading.count({
      where: {
        sensor: {
          node: { location_id: location.location_id },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      message: 'Reading from DB successfully.',
      data: {
        location: {
          location_id: String(location.location_id),
          name: location.name,
          city: location.city,
          country: location.country,
          coordinates: location.coordinates,
        },
        sensors_at_location: sensorCount,
        readings_at_location: readingCount,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const code = (error as { code?: string })?.code;

    let reason = 'Database error';
    const checklist: string[] = [];

    if (message.includes("Can't reach database server") || code === 'P1001') {
      reason = 'Cannot reach the database server (connection failed).';
      checklist.push('Supabase project may be paused → Dashboard: supabase.com/dashboard → your project → Settings → General → Restore project.');
      checklist.push('DATABASE_URL in .env must use direct connection: postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres OR the direct host db.[ref].supabase.co:5432 (not pooler port 6543 for serverless).');
      checklist.push('Password in the URL must match the database password (Settings → Database in Supabase).');
      checklist.push('Network: try without VPN; ensure outbound TCP port 5432 is allowed.');
    } else if (message.includes('authentication') || message.includes('password') || code === 'P1017') {
      reason = 'Authentication failed.';
      checklist.push('Check the password in DATABASE_URL matches Supabase → Settings → Database → Database password.');
      checklist.push('If you reset the DB password, update .env and restart the app.');
    } else if (message.includes('ECONNREFUSED') || message.includes('Connection refused')) {
      reason = 'Connection refused (host/port unreachable).';
      checklist.push('Supabase project may be paused → Restore it from the dashboard.');
      checklist.push('Use the correct host and port (direct: db.xxx.supabase.co:5432).');
    } else if (message.includes('ENOTFOUND') || message.includes('getaddrinfo')) {
      reason = 'Could not resolve database hostname.';
      checklist.push('Check DATABASE_URL: host should be db.[project-ref].supabase.co or aws-0-[region].pooler.supabase.com.');
    }

    return NextResponse.json(
      {
        ok: false,
        reason,
        checklist,
        raw_error: message,
      },
      { status: 503 }
    );
  }
}
