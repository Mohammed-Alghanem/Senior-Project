# Node A — Surface Level Firmware Setup

## Hardware
- ESP32-S3-DevKitC-1
- HC-SR04 ultrasonic sensor (TRIG → GPIO4, ECHO → GPIO5)
- DS18B20 waterproof temperature probe (OneWire → GPIO6)
- Rain sensor (optical RS485) via MAX3485 module

## Required Arduino Libraries
Install via **Tools → Manage Libraries**:
- `NewPing` by Tim Eckel
- `OneWire` by Jim Studt
- `DallasTemperature` by Miles Burton

## Configuration
Edit the top of `FloodSense_NodeA_Surface_MQTT_v3.ino`:

```cpp
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";
IPAddress LAPTOP_IP(192, 168, x, x);     // your backend server IP
static const uint16_t LAPTOP_TCP_PORT = 4444;
```

## Key Tunable Constants
| Constant | Default | Description |
|---|---|---|
| `SAMPLE_PERIOD_MS` | 2000 | Sensor reading interval (ms) |
| `BUFFER_MINUTES` | 15 | Offline buffer duration (min) |
| `WIFI_RETRY_MS` | 5000 | Wi-Fi retry interval (ms) |
| `FLUSH_MAX_PER_LOOP` | 4 | Max backlog samples sent per loop |
| `TCP_TIMEOUT_MS` | 1500 | TCP connection timeout (ms) |

## Data Output (JSON over TCP)
```json
{
  "boot_id": 1234567890,
  "seq": 42,
  "uptime_ms": 84000,
  "temp_c": 31.5,
  "us_cm": 14.2
}
```
