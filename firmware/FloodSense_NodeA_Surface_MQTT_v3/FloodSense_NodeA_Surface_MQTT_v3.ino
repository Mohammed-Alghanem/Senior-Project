#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClient.h>
#include <NewPing.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include "esp_system.h"

// =====================================================
// User controls
// =====================================================
static const uint32_t SAMPLE_PERIOD_MS   = 2000;   // sample every 2 seconds
static const uint32_t BUFFER_MINUTES     = 15;     // keep about 15 minutes of samples
static const uint32_t WIFI_RETRY_MS      = 5000;   // retry Wi-Fi every 5 seconds
static const uint32_t FLUSH_MAX_PER_LOOP = 4;      // send at most N backlog samples per loop
static const uint32_t TCP_TIMEOUT_MS     = 1500;   // TCP timeout

static const bool DEBUG_PRINT_EVERY_SAMPLE = true;

// =====================================================
// Wi-Fi
// =====================================================
const char* WIFI_SSID = "****";
const char* WIFI_PASS = "****";

IPAddress LAPTOP_IP(0,0,0,0);
static const uint16_t LAPTOP_TCP_PORT = 4444;

// =====================================================
// Ultrasonic
// =====================================================
static const int US_TRIG_PIN = 4;
static const int US_ECHO_PIN = 5;
static const unsigned int US_MAX_DISTANCE_CM = 400;
NewPing sonar(US_TRIG_PIN, US_ECHO_PIN, US_MAX_DISTANCE_CM);

// =====================================================
// Temperature sensor (DS18B20)
// =====================================================
static const int ONE_WIRE_BUS_PIN = 6;
OneWire oneWire(ONE_WIRE_BUS_PIN);
DallasTemperature tempSensor(&oneWire);

// =====================================================
// Buffered sample structure
// =====================================================
struct Sample {
  uint32_t boot_id;      // unique each restart
  uint32_t seq;          // increases every sample
  uint32_t uptime_ms;    // millis() at sample time
  float temp_c;          // -127 if invalid
  float us_cm;           // -1 if invalid
  bool sent;             // true after successful send
};

static const uint16_t BUF_CAPACITY =
  (uint16_t)((BUFFER_MINUTES * 60UL * 1000UL) / SAMPLE_PERIOD_MS);

static Sample buf[BUF_CAPACITY];
static uint16_t head = 0;          // next write
static uint16_t tail = 0;          // oldest item
static uint16_t count_buf = 0;     // total valid items in buffer
static uint16_t unsent_count = 0;  // not sent yet
static uint32_t dropped_count = 0; // overwritten unsent samples

static uint32_t boot_id = 0;
static uint32_t seqno = 0;

// =====================================================
// Wi-Fi reconnect handling
// =====================================================
static uint32_t last_wifi_attempt_ms = 0;

void ensureWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }

  uint32_t now = millis();
  if (now - last_wifi_attempt_ms < WIFI_RETRY_MS) {
    return;
  }

  last_wifi_attempt_ms = now;

  Serial.println("[WiFi] Reconnecting...");
  WiFi.disconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
}

void connectWiFiAtStart() {
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(false);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  Serial.print("Connecting to WiFi");
  int tries = 0;

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    tries++;

    if (tries > 60) {
      Serial.println("\nWiFi reconnect...");
      WiFi.disconnect(true);
      WiFi.begin(WIFI_SSID, WIFI_PASS);
      tries = 0;
    }
  }

  Serial.println("\nWiFi connected.");
  Serial.print("Node B IP: ");
  Serial.println(WiFi.localIP());

  last_wifi_attempt_ms = millis();
}

// =====================================================
// Sensor reads
// =====================================================
float readUltrasonicCm() {
  delay(50);
  unsigned int cm = sonar.ping_cm();

  if (cm == 0) {
    return -1.0f;
  }

  return (float)cm;
}

float readTemperatureC() {
  tempSensor.requestTemperatures();
  float t = tempSensor.getTempCByIndex(0);

  if (t == DEVICE_DISCONNECTED_C || t < -55.0f || t > 125.0f) {
    return -127.0f;
  }

  return t;
}

// =====================================================
// Buffer operations
// =====================================================
void buffer_push(const Sample& s_in) {
  if (count_buf == BUF_CAPACITY) {
    // buffer full: overwrite oldest
    if (!buf[head].sent) {
      if (unsent_count > 0) {
        unsent_count--;
      }
      dropped_count++;
    }
    tail = (uint16_t)((tail + 1) % BUF_CAPACITY);
  } else {
    count_buf++;
  }

  buf[head] = s_in;
  buf[head].sent = false;
  head = (uint16_t)((head + 1) % BUF_CAPACITY);
  unsent_count++;
}

int find_oldest_unsent_index() {
  if (count_buf == 0 || unsent_count == 0) {
    return -1;
  }

  uint16_t idx = tail;
  for (uint16_t i = 0; i < count_buf; i++) {
    if (!buf[idx].sent) {
      return (int)idx;
    }
    idx = (uint16_t)((idx + 1) % BUF_CAPACITY);
  }

  return -1;
}

// =====================================================
// TCP send
// =====================================================
bool sendSampleToLaptop(const Sample& s) {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }

  WiFiClient client;
  client.setTimeout(TCP_TIMEOUT_MS);

  if (!client.connect(LAPTOP_IP, LAPTOP_TCP_PORT)) {
    Serial.println("Laptop TCP connect failed");
    return false;
  }

  bool tempOk = (s.temp_c > -100.0f);
  bool usOk   = (s.us_cm >= 0.0f);

  char payload[400];
  snprintf(payload, sizeof(payload),
           "{"
             "\"source\":\"nodeB\","
             "\"boot_id\":%lu,"
             "\"seq\":%lu,"
             "\"ts_ms\":%lu,"

             "\"nodeA_rain_raw\":-1,"
             "\"nodeA_rain_mm\":-1.00,"
             "\"nodeA_us_cm\":-1.00,"

             "\"nodeB_ok\":%s,"
             "\"nodeB_temp_c\":%.2f,"
             "\"nodeB_us_cm\":%.2f,"

             "\"buf_count\":%u,"
             "\"buf_unsent\":%u,"
             "\"buf_capacity\":%u,"
             "\"buf_dropped\":%lu"
           "}\n",
           (unsigned long)s.boot_id,
           (unsigned long)s.seq,
           (unsigned long)s.uptime_ms,

           (tempOk || usOk) ? "true" : "false",
           s.temp_c,
           s.us_cm,

           (unsigned)count_buf,
           (unsigned)unsent_count,
           (unsigned)BUF_CAPACITY,
           (unsigned long)dropped_count);

  client.print(payload);
  client.flush();
  client.stop();

  Serial.print("[TCP] Sent: ");
  Serial.println(payload);

  return true;
}

void flushUnsentBacklog() {
  uint32_t sent_now = 0;

  while (sent_now < FLUSH_MAX_PER_LOOP && unsent_count > 0) {
    int idx = find_oldest_unsent_index();
    if (idx < 0) {
      break;
    }

    if (sendSampleToLaptop(buf[idx])) {
      buf[idx].sent = true;
      if (unsent_count > 0) {
        unsent_count--;
      }
      sent_now++;
    } else {
      break;
    }
  }
}

// =====================================================
// Setup
// =====================================================
void setup() {
  Serial.begin(115200);
  delay(800);

  Serial.println("\n=== Node B: Temp + Ultrasonic + Buffer + Resend ===");

  boot_id = esp_random();

  pinMode(US_TRIG_PIN, OUTPUT);
  pinMode(US_ECHO_PIN, INPUT);
  digitalWrite(US_TRIG_PIN, LOW);

  tempSensor.begin();

  connectWiFiAtStart();

  Serial.print("Sending to laptop TCP ");
  Serial.print(LAPTOP_IP);
  Serial.print(":");
  Serial.println(LAPTOP_TCP_PORT);

  Serial.print("Buffer capacity = ");
  Serial.print(BUF_CAPACITY);
  Serial.print(" samples (~");
  Serial.print((BUF_CAPACITY * SAMPLE_PERIOD_MS) / 60000.0f, 1);
  Serial.println(" minutes)");

  Serial.print("Boot ID = ");
  Serial.println(boot_id);
}

// =====================================================
// Loop
// =====================================================
void loop() {
  ensureWiFi();

  static uint32_t nextSampleMs = 0;
  uint32_t now = millis();

  if (nextSampleMs == 0) {
    nextSampleMs = now;
  }

  // If not time yet, still try sending backlog
  if ((int32_t)(now - nextSampleMs) < 0) {
    flushUnsentBacklog();
    delay(1);
    return;
  }

  // Schedule next sample exactly every 2 seconds
  nextSampleMs += SAMPLE_PERIOD_MS;
  while ((int32_t)(millis() - nextSampleMs) >= 0) {
    nextSampleMs += SAMPLE_PERIOD_MS;
  }

  // ---- Read sensors ----
  float tempC = readTemperatureC();
  float usCm  = readUltrasonicCm();

  // ---- Print current values ----
  Serial.println("----- Node B Parsed Values -----");

  if (tempC <= -100.0f) {
    Serial.println("Temperature = READ FAILED / DISCONNECTED");
  } else {
    Serial.print("Temperature = ");
    Serial.print(tempC, 2);
    Serial.println(" C");
  }

  if (usCm < 0) {
    Serial.println("Ultrasonic = No echo / timeout");
  } else {
    Serial.print("Ultrasonic distance = ");
    Serial.print(usCm, 2);
    Serial.println(" cm");
  }

  Serial.println("-------------------------------");
  Serial.println();

  // ---- Store sample in buffer ----
  Sample s{};
  s.boot_id   = boot_id;
  s.seq       = ++seqno;
  s.uptime_ms = millis();
  s.temp_c    = tempC;
  s.us_cm     = usCm;
  s.sent      = false;

  buffer_push(s);

  if (DEBUG_PRINT_EVERY_SAMPLE) {
    Serial.print("[SAMPLE] seq=");
    Serial.print(s.seq);
    Serial.print(" temp_c=");
    Serial.print(s.temp_c, 2);
    Serial.print(" us_cm=");
    Serial.print(s.us_cm, 2);
    Serial.print(" buf_unsent=");
    Serial.print(unsent_count);
    Serial.print(" buf=");
    Serial.print(count_buf);
    Serial.print("/");
    Serial.print(BUF_CAPACITY);
    Serial.print(" dropped=");
    Serial.println(dropped_count);
  }

  // ---- Send backlog / current sample ----
  flushUnsentBacklog();
}