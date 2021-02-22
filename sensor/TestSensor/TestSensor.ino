#include <SPI.h>
#include <WiFiNINA.h>
#include <ctype.h>
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
    while (!Serial) delay(1000);
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


// ============== HELPERS ==============

char* skip_spaces(char *str) {
  char *cursor = str;
  while(*cursor != '\0' && isspace(*cursor)) cursor++;
  return cursor;
}


char* move_to_space(char *str) {
  char *cursor = str;
  while(*cursor != '\0' && !isspace(*cursor)) cursor++;
  return cursor;
}



// =========== SEND =============

// send data to server
bool send_begin(char *mode, char *location) {
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


void send_end() {
  client.print("\n#");
}


// ============= RECEIVE ==============

#define RECEIVE_BUFF_SIZE 1000
char receive_buff[RECEIVE_BUFF_SIZE];
int receive_index;
char r;
bool again;

void receive() {
  receive_index = 0;
  again = true;
  
  while(client.available() && again) {
    r = client.read();

    if(receive_index >= RECEIVE_BUFF_SIZE) {
      PRINT_DEBUG("Receive buffer overflow");
      return;
    }
    
    if(r != '#') {
      receive_buff[receive_index] = r;
    } else {
      receive_buff[receive_index] = '\0';
      on_data();
      again = false;
    }

    receive_index++;
  }
}


char *mode;
char *location;

void on_data() {
  mode = NULL;
  location = NULL;

  // skip inital spaces
  char *cursor = skip_spaces(receive_buff);
  if(*cursor == '\0') return; // invalid request (only spaces)
  
  mode = cursor;

  // move to mode end
  cursor = move_to_space(cursor);
  if(*cursor == '\0') return; // invalid request (no location)

  // terminate mode
  *cursor = '\0';
  cursor++;

  cursor = skip_spaces(cursor);
  location = cursor;

  // move to location end and terminate it
  cursor = move_to_space(cursor);
  *cursor = '\0';
  
  PRINT_DEBUG(mode);
  PRINT_DEBUG(location);
}



// =========== SETUP-LOOP ============


void setup() {
  serial_setup();
  wifi_setup();
  
  wifi_connect();
}


void loop() {
  if(send_begin("P", "/report/aa")) {
    client.println("{\"temp\":\"23\"}");
    send_end();
  }

  delay(1000);
  receive();
  delay(9000);
}
