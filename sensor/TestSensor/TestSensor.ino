#include <SPI.h>
#include <WiFiNINA.h>
#include "secrets.h"

#define HOSTNAME "Arduino Nano 33 IoT"


#define DEBUG

#if defined(DEBUG)
  #define PRINT_DEBUG(msg) Serial.println(msg);
#else
  #define PRINT_DEBUG ;
#endif


char ssid[] = SECRET_SSID;
char pass[] = SECRET_PASS;

int status = WL_IDLE_STATUS;
WiFiClient client;

IPAddress server_ip(192, 168, 0, 119);
int server_port = 3000;


// setup serial if in debug mode
void serial_setup() {
  #if defined(DEBUG)
    Serial.begin(9600);
//    while (!Serial) delay(1000);
  #endif
}


// setup wifi at startup. block on failure
void wifi_setup() {
  WiFi.setHostname(HOSTNAME);
  
  if (WiFi.status() == WL_NO_MODULE) {
    PRINT_DEBUG("WiFi module NOT found!");
    while (true) delay(1000);
  }
}


// block until connected to wifi
void wifi_connect() {
  while (status != WL_CONNECTED) {
    PRINT_DEBUG("Connecting to WPA SSID: ");
    PRINT_DEBUG(ssid);
    
    status = WiFi.begin(ssid, pass);

    delay(1000);
  }

  PRINT_DEBUG("Connected!\n");
}


// send data to server
bool beginSend(char *mode, char *location) {
  // check wifi status
  if(WiFi.status() != WL_CONNECTED) {
    wifi_connect();
  }

  // check server connection
  if(!client.connected()) {
    PRINT_DEBUG("Connecting to server...");
    client.stop();
    
    if(!client.connect(server_ip, server_port)) {
      PRINT_DEBUG("Connection to server failed!");   
      return false;  
    } else {
      PRINT_DEBUG("Connected!");
    }
  }

  client.print(mode);
  client.print(" ");
  client.println(location);
  
  return true;
}


void endSend() {
  client.print("\n#");
}


void setup() {
  serial_setup();
  wifi_setup();
  
  wifi_connect();
}



int num = 0;

void loop() {

  if(beginSend("P", "/report/aa")) {
    client.println("{\"temp\":\"23\"}");
    endSend();
  }

  
  delay(10000);
}
