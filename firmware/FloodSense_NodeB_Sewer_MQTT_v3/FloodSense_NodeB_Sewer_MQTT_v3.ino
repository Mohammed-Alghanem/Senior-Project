#include <WiFi.h>
#include <Wire.h>
#include <SPI.h>
#include <PubSubClient.h>
#include <ArduCAM.h>
#include "memorysaver.h"

// =========================
// WIFI
// =========================

const char* WIFI_SSID = "****";
const char* WIFI_PASS = "****";

// =========================
// MQTT
// =========================

const char* MQTT_BROKER = "****";
const int MQTT_PORT = 1883;

const char* FRAME_TOPIC = "esp32/cam/frame";

// =========================
// PINS
// Based on your MicroPython setup
// =========================

#define PIN_CS    9
#define PIN_MOSI  10
#define PIN_MISO  11
#define PIN_SCK   12

#define PIN_SDA   13
#define PIN_SCL   14

// =========================
// CAMERA / MQTT OBJECTS
// =========================

ArduCAM myCAM(OV2640, PIN_CS);

WiFiClient espClient;
PubSubClient mqttClient(espClient);

// Start slow for testing
unsigned long lastFrameTime = 0;
const unsigned long FRAME_INTERVAL_MS = 1000; // 1 FPS

// =========================
// WIFI CONNECT
// =========================

void connectWiFi() {
  Serial.print("Connecting to WiFi");

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi connected");
  Serial.print("ESP32 IP: ");
  Serial.println(WiFi.localIP());
}

// =========================
// MQTT CONNECT
// =========================

void connectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Connecting to MQTT...");

    String clientId = "ESP32S3-CAM-";
    clientId += String((uint32_t)ESP.getEfuseMac(), HEX);

    if (mqttClient.connect(clientId.c_str())) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.println(mqttClient.state());
      delay(2000);
    }
  }
}

// =========================
// CAMERA INIT
// =========================

void initCamera() {
  Serial.println("Initializing camera...");

  pinMode(PIN_CS, OUTPUT);
  digitalWrite(PIN_CS, HIGH);

  Wire.begin(PIN_SDA, PIN_SCL);
  SPI.begin(PIN_SCK, PIN_MISO, PIN_MOSI, PIN_CS);

  myCAM.write_reg(0x07, 0x80);
  delay(100);
  myCAM.write_reg(0x07, 0x00);
  delay(100);

  myCAM.write_reg(ARDUCHIP_TEST1, 0x55);
  uint8_t temp = myCAM.read_reg(ARDUCHIP_TEST1);

  if (temp != 0x55) {
    Serial.println("SPI interface error");
    while (1);
  }

  Serial.println("SPI OK");

  uint8_t vid, pid;

  myCAM.wrSensorReg8_8(0xff, 0x01);
  myCAM.rdSensorReg8_8(OV2640_CHIPID_HIGH, &vid);
  myCAM.rdSensorReg8_8(OV2640_CHIPID_LOW, &pid);

  Serial.print("Camera ID: ");
  Serial.print(vid, HEX);
  Serial.print(" ");
  Serial.println(pid, HEX);

  if (vid != 0x26) {
    Serial.println("OV2640 not detected");
    while (1);
  }

  myCAM.set_format(JPEG);
  myCAM.InitCAM();

  // Use low resolution for MQTT
  myCAM.OV2640_set_JPEG_size(OV2640_320x240);

  delay(1000);

  myCAM.clear_fifo_flag();

  Serial.println("Camera initialized");
}

// =========================
// CAPTURE + MQTT PUBLISH
// =========================

bool captureAndPublishFrame() {
  myCAM.flush_fifo();
  myCAM.clear_fifo_flag();

  myCAM.start_capture();

  unsigned long startWait = millis();

  while (!myCAM.get_bit(ARDUCHIP_TRIG, CAP_DONE_MASK)) {
    if (millis() - startWait > 3000) {
      Serial.println("Capture timeout");
      return false;
    }

    delay(5);
  }

  uint32_t length = myCAM.read_fifo_length();

  if (length == 0 || length >= 600000) {
    Serial.print("Invalid JPEG length: ");
    Serial.println(length);
    myCAM.clear_fifo_flag();
    return false;
  }

  Serial.print("JPEG length: ");
  Serial.println(length);

  if (!mqttClient.beginPublish(FRAME_TOPIC, length, false)) {
    Serial.println("MQTT beginPublish failed");
    myCAM.clear_fifo_flag();
    return false;
  }

  myCAM.CS_LOW();
  myCAM.set_fifo_burst();

  const int CHUNK_SIZE = 512;
  uint8_t buffer[CHUNK_SIZE];

  uint32_t remaining = length;

  while (remaining > 0) {
    int toRead = remaining > CHUNK_SIZE ? CHUNK_SIZE : remaining;

    for (int i = 0; i < toRead; i++) {
      buffer[i] = SPI.transfer(0x00);
    }

    mqttClient.write(buffer, toRead);
    remaining -= toRead;

    mqttClient.loop();
  }

  myCAM.CS_HIGH();

  bool ok = mqttClient.endPublish();

  myCAM.clear_fifo_flag();

  if (ok) {
    Serial.println("Frame published");
  } else {
    Serial.println("Publish failed");
  }

  return ok;
}

// =========================
// SETUP
// =========================

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("ESP32-S3 CAM MQTT Frame Publisher");

  connectWiFi();

  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);

  connectMQTT();

  initCamera();
}

// =========================
// LOOP
// =========================

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  if (!mqttClient.connected()) {
    connectMQTT();
  }

  mqttClient.loop();

  unsigned long now = millis();

  if (now - lastFrameTime >= FRAME_INTERVAL_MS) {
    lastFrameTime = now;
    captureAndPublishFrame();
  }
}