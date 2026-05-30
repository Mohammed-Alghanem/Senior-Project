# Node B — Sewer / Underground Level Firmware Setup

## Hardware
- ESP32-S3-DevKitC-1
- JSN-SR04T waterproof ultrasonic sensor
- DS18B20 waterproof temperature probe
- ArduCam OV2640 camera module (optional visual stream)
- MAX3485 TTL→RS485 transceiver

## GPIO Pinout
| Signal | GPIO |
|---|---|
| Camera CS | 9 |
| SPI MOSI | 10 |
| SPI MISO | 11 |
| SPI SCK | 12 |
| I²C SDA | 13 |
| I²C SCL | 14 |

## Required Arduino Libraries
- `PubSubClient` by Nick O'Leary (MQTT)
- `ArduCAM` by ArduCAM (camera)
- `Wire.h` / `SPI.h` — built-in ESP32 core

## Configuration
Edit the top of `FloodSense_NodeB_Sewer_MQTT_v3.ino`:

```cpp
const char* WIFI_SSID   = "YOUR_WIFI_SSID";
const char* WIFI_PASS   = "YOUR_WIFI_PASSWORD";
const char* MQTT_BROKER = "YOUR_MQTT_BROKER_IP";
const int   MQTT_PORT   = 1883;
```

## MQTT Topics
| Topic | Payload | Description |
|---|---|---|
| `esp32/cam/frame` | Raw JPEG bytes | Camera frame stream |
| `floodsense/nodeB/state` | JSON | Sewer level + temperature |

## Frame Rate
Default: 1 FPS (`FRAME_INTERVAL_MS = 1000`). Increase to 2 FPS for faster visual updates.
