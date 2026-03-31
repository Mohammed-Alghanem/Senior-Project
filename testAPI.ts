/**
 * Push test sensor readings to the API for visualization.
 *
 * Behavior:
 * - Total duration: ~10 seconds
 * - Number of pushes: 3
 * - Interval: 3.3333 seconds
 *
 * Usage:
 *   npx ts-node testAPI.ts
 *   npx ts-node testAPI.ts --base-url=http://localhost:3000 --location-id=4
 */

type Args = {
  baseUrl: string;
  locationId: string;
};

const TOTAL_SECONDS = 10.0;
const PUSH_COUNT = 3;
const INTERVAL_SECONDS = 3.3333;

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const out: Args = {
    baseUrl: 'http://localhost:3000',
    locationId: '4',
  };

  for (const arg of args) {
    if (arg.startsWith('--base-url=')) out.baseUrl = arg.replace('--base-url=', '');
    if (arg.startsWith('--location-id=')) out.locationId = arg.replace('--location-id=', '');
  }

  return out;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postJson(url: string, payload: unknown): Promise<{ status: number; body: string }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.text();
    return { status: res.status, body };
  } catch (error) {
    return { status: 0, body: String(error) };
  }
}

async function main() {
  const { baseUrl, locationId } = parseArgs();
  const endpoint = `${baseUrl.replace(/\/$/, '')}/api/sensors`;
  const start = Date.now();

  console.log(`Sending test data to: ${endpoint}`);
  console.log(`Schedule: ${PUSH_COUNT} pushes in ~${TOTAL_SECONDS}s (every ${INTERVAL_SECONDS}s)\n`);

  for (let i = 1; i <= PUSH_COUNT; i++) {
    const targetElapsedMs = INTERVAL_SECONDS * i * 1000;
    const nowElapsedMs = Date.now() - start;
    const waitMs = Math.max(0, targetElapsedMs - nowElapsedMs);
    await sleep(waitMs);

    const ultrasonicValue = 15.0 + i * 4.5;
    const rainValue = 10.0 + i * 8.0;
    const tempValue = 28.0 + i * 0.9;

    const packets = [
      { location_id: locationId, type: 'Ultrasonic', value: ultrasonicValue },
      { location_id: locationId, type: 'Rain Intensity', value: rainValue },
      { location_id: locationId, type: 'Temperature', value: tempValue },
    ];

    console.log(`Push ${i}/${PUSH_COUNT} at t=${((Date.now() - start) / 1000).toFixed(2)}s`);
    for (const packet of packets) {
      const { status, body } = await postJson(endpoint, packet);
      const ok = status >= 200 && status < 300;
      console.log(`  ${ok ? 'OK' : 'ERR'} ${status} -> ${JSON.stringify(packet)}`);
      console.log(`    response: ${body}`);
    }
    console.log('');
  }

  const total = (Date.now() - start) / 1000;
  console.log(`Finished in ${total.toFixed(2)}s`);
}

void main();

