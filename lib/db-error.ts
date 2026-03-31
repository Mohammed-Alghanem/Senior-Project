/**
 * Detect Prisma "database server unreachable" errors (e.g. Supabase paused, network down).
 * Use this to return graceful 200 + empty data instead of 500 so the UI can show "Database unavailable".
 */
export function isDbUnavailableError(error: unknown): boolean {
  if (error instanceof Error) {
    if (error.message.includes("Can't reach database server")) return true;
    if (error.message.includes('MaxClientsInSessionMode')) return true; // Supabase connection pool exhausted
    if (error.message.includes('max clients')) return true; // Generic pool exhaustion
    if (error.name === 'PrismaClientInitializationError') return true;
  }
  const code = (error as { code?: string })?.code;
  if (code === 'P1001' || code === 'P1017') return true; // P1001 = unreachable, P1017 = connection closed
  return false;
}
