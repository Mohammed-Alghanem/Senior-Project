# 🌊 FloodSense Hybrid — Urban Flash Flood Early Warning System

A multidisciplinary senior design project from **King Fahd University of Petroleum & Minerals (KFUPM)** that combines real-time IoT sensing, AI flood-risk prediction, and optimization-based sensor deployment into a unified urban flash-flood early warning system.

> **Team M060 · Senior Design Project II · Term 252 · Date: 11/05/2026**

---

## 🎯 What It Does

FloodSense Hybrid monitors flood-prone urban locations — underpasses, drainage outlets, and low-lying roads — using two types of distributed ESP32 sensing nodes:

- **Node A (Surface)** measures surface water level via ultrasonic sensor and rainfall intensity
- **Node B (Sewer/Underground)** monitors sewer/drain water level and temperature inside manholes

Data streams over Wi-Fi to a cloud backend, where an AI model predicts flood risk in real time and a web dashboard alerts authorities and civilians. An Operations Research (OR) model optimizes where sensors should be deployed to maximize flood-hotspot coverage within budget.

---

## 👥 Team

| Name | ID | Department | Role |
|---|---|---|---|
| Jalal Ali Zainaddin | 202154790 | COE | Sensor integration, ESP32 firmware, MQTT, hardware architecture |
| Ibrahim Mohammed Alzakari | 202172530 | COE | Sensor integration, ESP32 firmware, hardware infrastructure |
| Ali Osamah Al-Bugeaey | 202153970 | SWE | Backend (database, API), frontend dashboard |
| Mohammed Redha Alghanem | 202158990 | SWE | Backend (database, API), frontend dashboard |
| Ali Ibrahim Almatar | 202158190 | ICS/CS | AI flood-risk prediction model, database design |
| Yaser Khalid Alrasheed | 202171850 | ISE | OR sensor deployment optimization, SPC monitoring |

**Advisors:** Dr. Uthman Baroudi (Coach, COE) · Dr. Firas Al Hindawi (Reviewer, ISE) · Dr. Omar Hammad (Reviewer, ICS)

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    Flood-Prone Urban Site                        │
│                                                                  │
│  ┌─────────────────────┐      ┌──────────────────────────────┐   │
│  │   Node A (Surface)  │      │   Node B (Sewer/Underground) │   │
│  │                     │      │                              │   │
│  │  • Ultrasonic       │      │  • Ultrasonic (JSN-SR04T)   │   │
│  │    (HC-SR04)        │      │  • DS18B20 Temp probe       │   │
│  │  • Rain sensor      │      │  • ESP32-S3                 │   │
│  │    (RS485/optical)  │      │  • Offline buffer (15 min)  │   │
│  │  • AHT20+BMP280     │      │                              │   │
│  │  • ESP32-S3         │      └──────────────┬───────────────┘   │
│  │  • Offline buffer   │                     │                   │
│  └──────────┬──────────┘                     │                   │
│             │              Wi-Fi / MQTT       │                   │
└─────────────│─────────────────────────────────│──────────────────┘
              │                                 │
              └─────────────┬───────────────────┘
                            ▼
              ┌─────────────────────────────┐
              │     Cloud Backend           │
              │                             │
              │  • Next.js / Node.js API    │
              │  • Supabase / PostgreSQL    │
              │  • OpenWeather API          │
              │  • AI Flood Risk Model      │
              └──────────────┬──────────────┘
                             │
                             ▼
              ┌─────────────────────────────┐
              │   Web Dashboard             │
              │                             │
              │  • Live sensor readings     │
              │  • Flood risk countdown     │
              │  • 6-hour historical graphs │
              │  • Flood alert popup        │
              │  • Mobile + desktop         │
              └─────────────────────────────┘
```

---

## 📁 Repository Structure

```
Senior-Project/
│
├── README.md
│
├── firmware/
│   ├── NodeA_Surface/
│   │   └── FloodSense_NodeA_Surface_MQTT_v3.ino   ← Surface node firmware
│   └── NodeB_Sewer/
│       └── FloodSense_NodeB_Sewer_MQTT_v3.ino     ← Sewer/underground node firmware
│
├── backend/                  ← Next.js + Node.js backend + Supabase integration
│
├── frontend/                 ← Next.js dashboard (area selection, live readings, AI prediction)
│
├── ai-model/                 ← Python flood-risk prediction model (LSTM/ANN)
│
└── docs/
    └── FloodSense_Final_Report.pdf
```

---

## 🔌 Hardware

### Node A — Surface Level

| Component | Purpose | Interface |
|---|---|---|
| ESP32-S3-DevKitC-1 | Main MCU, Wi-Fi | — |
| HC-SR04 / JSN-SR04T | Surface water level (ultrasonic) | GPIO TRIG/ECHO |
| Optical Rain Sensor (RS485) | Rainfall intensity | RS485 via MAX3485 |
| AHT20 + BMP280 module | Humidity, temperature, pressure | I²C |
| DS18B20 waterproof probe | Ambient temperature | OneWire |
| LM2596 buck converter | 12V → 3.3V/5V regulation | — |
| AC/DC 12V adapter | Primary power (battery backup) | — |

**GPIO Assignments:**

| Signal | GPIO |
|---|---|
| Ultrasonic TRIG | 4 |
| Ultrasonic ECHO | 5 |
| DS18B20 OneWire | 6 |

---

### Node B — Sewer / Underground Level

| Component | Purpose | Interface |
|---|---|---|
| ESP32-S3-DevKitC-1 | Main MCU, Wi-Fi, camera | — |
| JSN-SR04T waterproof ultrasonic | Sewer water level | GPIO |
| DS18B20 waterproof temp probe | Sewer temperature | OneWire |
| ArduCam OV2640 | Optional visual stream | SPI + I²C |
| MAX3485 TTL→RS485 | Sensor communication | UART |
| LM2596 buck converter | Voltage regulation | — |

**GPIO Assignments:**

| Signal | GPIO |
|---|---|
| Camera CS | 9 |
| SPI MOSI | 10 |
| SPI MISO | 11 |
| SPI SCK | 12 |
| I²C SDA | 13 |
| I²C SCL | 14 |

---

## 🚀 Firmware Setup

### Prerequisites

- Arduino IDE 2.x with **ESP32** board support
- Install the following libraries via **Tools → Manage Libraries**:

| Library | Used in |
|---|---|
| `NewPing` | Node A — ultrasonic sensor |
| `OneWire` | Both nodes — DS18B20 temperature |
| `DallasTemperature` | Both nodes — DS18B20 |
| `PubSubClient` | Node B — MQTT client |
| `ArduCAM` | Node B — camera |
| `WiFi.h` / `WiFiClient.h` | Both nodes — built-in ESP32 core |

### Node A — Configure & Flash

Open `firmware/NodeA_Surface/FloodSense_NodeA_Surface_MQTT_v3.ino` and update:

```cpp
// Wi-Fi credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

// Backend server IP and port
IPAddress LAPTOP_IP(192, 168, x, x);       // your server IPv4
static const uint16_t LAPTOP_TCP_PORT = 4444;

// Tunable parameters
static const uint32_t SAMPLE_PERIOD_MS  = 2000;   // sample every 2 s
static const uint32_t BUFFER_MINUTES    = 15;      // offline buffer duration
```

Flash to ESP32-S3 and open Serial Monitor at **115200 baud** to verify sensor readings.

### Node B — Configure & Flash

Open `firmware/NodeB_Sewer/FloodSense_NodeB_Sewer_MQTT_v3.ino` and update:

```cpp
const char* WIFI_SSID   = "YOUR_WIFI_SSID";
const char* WIFI_PASS   = "YOUR_WIFI_PASSWORD";
const char* MQTT_BROKER = "YOUR_MQTT_BROKER_IP";
const int   MQTT_PORT   = 1883;
const char* FRAME_TOPIC = "esp32/cam/frame";   // camera stream topic
```

---

## 📡 Data Protocol

Nodes send **newline-terminated JSON** over TCP (Node A) or MQTT (Node B):

### Node A → Backend (TCP, port 4444)

```json
{
  "boot_id": 1234567890,
  "seq": 42,
  "uptime_ms": 84000,
  "temp_c": 31.5,
  "us_cm": 14.2,
  "sent": false
}
```

### Node B → MQTT broker

| Topic | Payload | Description |
|---|---|---|
| `esp32/cam/frame` | Raw JPEG bytes | Camera frame for dashboard |
| `floodsense/nodeB/state` | JSON | Sewer level + temperature + status |

---

## 🧠 Offline Buffering

Both nodes buffer readings locally when Wi-Fi is unavailable and upload them after reconnection — meeting **Specification 1** (≥10 minutes offline buffering):

- Node A buffers **15 minutes** of samples (configurable via `BUFFER_MINUTES`)
- Each sample is timestamped with `boot_id`, `seq`, and `uptime_ms`
- On reconnection, up to `FLUSH_MAX_PER_LOOP = 4` backlog samples are sent per loop iteration to prevent flooding the server

---

## 📊 System Specifications Met

| # | Specification | Target | Result |
|---|---|---|---|
| C2 / S7 | Sensor update frequency | ≤ 30 s | **~2 s** (configurable) |
| C3 | Node cost | ≤ 200 SAR | Surface: 178.99 SAR · Sewer: 71.12 SAR ✅ |
| S1 | Offline buffer | ≥ 10 min | **15 min** ✅ |
| S2 | False alarm rate | < 5% per year | SPC p-chart verified ✅ |
| S3 | System availability | ≥ 99% | Load tested ✅ |
| S4 | Water-level accuracy | ±1 cm | Max error ±1 cm (tested at 5 depths) ✅ |
| S5 | API query latency | < 5 s | B-Tree indexed, O(log n) retrieval ✅ |
| S6 / S10 | Concurrent users | ≥ 5000 | Load tested at 5000 users ✅ |
| IS1 | Flood-risk accuracy | ≥ 90% | AI model verified ✅ |
| IS2 | Scalable nodes | ≥ 100 nodes | 32 kbps total at 100 nodes ✅ |
| IS3 | Warning lead time | ≥ 6 hours | AI prediction window ✅ |

---

## 🌐 Web Dashboard

Built with **Next.js** (frontend) and **Supabase + PostgreSQL** (backend):

- **Area selection** — choose country and city to monitor
- **Live sensor readings** — surface water level, sewer level, rainfall, temperature
- **6-hour historical graphs** — readings plotted every 30 minutes
- **AI flood countdown** — time remaining before hazardous water level
- **Flood alert popup** — pushed when risk threshold is crossed
- **Responsive** — works on mobile, tablet, and desktop

External data: **OpenWeather API** for city-wide weather context alongside local sensor readings.

---

## 🤖 AI Flood Risk Model

Implemented in Python using LSTM/ANN with confusion-matrix evaluation:

| Metric | Value |
|---|---|
| Accuracy (IS1) | ≥ 90% |
| False Alarm Rate (S2) | < 5% |
| Training data | 8,610 predictions |
| Inputs | Sensor readings + OpenWeather forecast |
| Output | Flood risk score + estimated time to hazardous level |

---

## 📍 OR Sensor Deployment Optimization (ISE)

A **Binary Integer Programming (BIP)** model selects which candidate sites to deploy sensors at, maximizing risk-weighted flood-hotspot coverage under budget and accessibility constraints:

```
Maximize  Σ wⱼ · yⱼ   (risk-weighted hotspot coverage)
Subject to:
  yⱼ ≤ Σᵢ aᵢⱼ · xᵢ   (coverage linking)
  Σᵢ cᵢ · xᵢ ≤ B      (budget constraint)
  xᵢ, yⱼ ∈ {0, 1}     (binary)
```

All 5 constraints verified; 100% Tier-1 critical hotspot coverage achieved.

---

## 📚 Standards & Compliance

| Standard | Application |
|---|---|
| ISO/IEC 30141:2024 | IoT reference architecture |
| ISO/IEC 27001:2022 | Information security management |
| ISO 22328-2:2024 | Community-based disaster early warning |
| Saudi NCM / MEWA | National meteorology regulations compliance |

---

## 📄 Course

**EE 411 / Senior Design Project II**
King Fahd University of Petroleum & Minerals (KFUPM) · Team M060 · Term 252
