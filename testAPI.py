#!/usr/bin/env python3
"""
Push test sensor readings to the API for visualization.

Behavior:
- Total duration: ~10 seconds
- Number of pushes: 3
- Interval: 3.3333 seconds

Usage:
    python testAPI.py
    python testAPI.py --base-url http://localhost:3000 --location-id 4
"""

from __future__ import annotations

import argparse
import json
import time
import urllib.error
import urllib.request
from typing import Any


TOTAL_SECONDS = 10.0
PUSH_COUNT = 3
INTERVAL_SECONDS = 3.3333


def post_json(url: str, payload: dict[str, Any], timeout: int = 10) -> tuple[int, str]:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url=url,
        data=data,
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            body = response.read().decode("utf-8")
            return response.status, body
    except urllib.error.HTTPError as err:
        return err.code, err.read().decode("utf-8", errors="replace")
    except Exception as err:
        return 0, str(err)


def main() -> int:
    parser = argparse.ArgumentParser(description="Push test readings to /api/sensors")
    parser.add_argument("--base-url", default="http://localhost:3000")
    parser.add_argument("--location-id", default="4")
    args = parser.parse_args()

    endpoint = f"{args.base_url.rstrip('/')}/api/sensors"
    start = time.time()

    print(f"Sending test data to: {endpoint}")
    print(f"Schedule: {PUSH_COUNT} pushes in ~{TOTAL_SECONDS}s (every {INTERVAL_SECONDS}s)\n")

    for i in range(1, PUSH_COUNT + 1):
        target_elapsed = INTERVAL_SECONDS * i
        now_elapsed = time.time() - start
        sleep_for = max(0.0, target_elapsed - now_elapsed)
        time.sleep(sleep_for)

        # Change values each push so graph/cards visibly update.
        ultrasonic_value = 15.0 + i * 4.5
        rain_value = 10.0 + i * 8.0
        temp_value = 28.0 + i * 0.9

        packets = [
            {"location_id": args.location_id, "type": "Ultrasonic", "value": ultrasonic_value},
            {"location_id": args.location_id, "type": "Rain Intensity", "value": rain_value},
            {"location_id": args.location_id, "type": "Temperature", "value": temp_value},
        ]

        print(f"Push {i}/{PUSH_COUNT} at t={time.time() - start:.2f}s")
        for packet in packets:
            status, body = post_json(endpoint, packet)
            ok = 200 <= status < 300
            marker = "OK" if ok else "ERR"
            print(f"  {marker} {status} -> {packet}")
            print(f"    response: {body}")
        print()

    total = time.time() - start
    print(f"Finished in {total:.2f}s")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

