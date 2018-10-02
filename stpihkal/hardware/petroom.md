# PetRoom Shock Collar

## Introduction

This document describes a way to control the
[PetRoom Dog Training Collar](https://www.ebay.co.uk/itm/323301551683)
over 433Mhz-Band Radio Control.???

Credit to [MiscReader](???) for the reversing work and code.

## Communication via RF

The PetRoom listens to OOK on a carrier wave of 433~825Mhz, depending on the devices serial no.???

The RC-transmitted commands are bitwise encoded as

bit | pwm
--- | ---
0 | 1000
1 | 1110

Each message send is preceded by a 6 pwm-bit long pulse (Likely to allow the receiver to set its gain) and 3 pwm-bit long low.  
Each message is repeated 4 times.

The provided code runs on an Arduino with a serial pin connected to an RF-Module.

## Commands

All the functionality of the device has been documented.

Command | Description | Parameter
--- | --- | ---
Shock | Issues a static shock of specified strength| 0-100, high is strong
Vibration | Vibrates the collar | 0-100 ???
Audio | Beeps | 0 ???
Light | ??? | 0 ???

## Protocol

The Commands looks like

```
10000001 11001010 00011010 00000000 01111110 0
0        8       16       24       32       40
```

Bits | Purpose
--- | ---
0~3 | Channel
4 | Light
5 | Audio
6 | Vibration
7 | Shock
8~23 | Remote Serial no.
24~31 | Level, starting with most significant bit
32~39 | Checksum, bits o~7 in reverse order and flipped
40 | Always zero, unimplemented control bit?

## Arduino sketch

The C++ Arduino Sketch provided my MiscReader
```c++
== Sketch.ino ==================================================================

#include <Arduino.h>
#include "TrainingCollar.h"

#define RADIO_OUTPUT_PIN 10

const TrainingCollar t(RADIO_OUTPUT_PIN);

void setup() {
  //Initialise random
  randomSeed(analogRead(0));

  //Set pin modes
  pinMode(RADIO_OUTPUT_PIN, OUTPUT);
  pinMode(LED_BUILTIN, OUTPUT);

  //Start serial
  Serial.begin(9600);
  Serial.println("Starting TrainingCollar demo");

  /*
   * The channel (A or B on the remote, but it seems we can use the 4 bits / 16 values)
   */
  byte channel = 0b0000;

  /*
   * The serial no. of the remote (So your remote won't interfere with someone elses)
   */
  unsigned int serial = 0b1100101000011010;

  //-- AUDIO -----------------------------------------------------------------------

  Serial.println("Beep!");
  TrainingCollar::TCMessageWithTimings tcmAudio = t.build(channel, serial, TC_MODE_AUDIO, 0);
  t.transmit(&tcmAudio);

  delay(100);

  //-- VIBRATION -------------------------------------------------------------------

  Serial.println("Wrrr!");
  TrainingCollar::TCMessageWithTimings tcmVibrate = t.build(channel, serial, TC_MODE_VIBRATION, 55);
  t.transmit(&tcmVibrate);

  delay(100);

  //-- SHOCK -----------------------------------------------------------------------

  int maxLevel = 50; // 100 if you're feeling mean
  int level = random(0, maxLevel + 1); // + 1 because random(...) is exclusive

  TrainingCollar::TCMessageWithTimings tcMessageWithTimings = t.build(channel, serial, TC_MODE_SHOCK, level);
  //t.printTCMessage(&tcMessageWithTimings.message);
  //t.printTCMessageTimings(&tcMessageWithTimings.messageTimings);

  String serialMessage = "You're about to get shocked at level ";
  serialMessage += + level;
  Serial.println(serialMessage);

  for (int i = 5; i > 0; --i) {
    Serial.println(i);
    delay(1000);
  }

  t.transmit(&tcMessageWithTimings);

  //--------------------------------------------------------------------------------
}

void loop() {
  // put your main code here, to run repeatedly:
}


== TrainingCollar.cpp ==========================================================


#include "Arduino.h"
#include "TrainingCollar.h"

//#define TC_DEBUG

TrainingCollar::TrainingCollar(int radioPin) {
  pinMode(radioPin, OUTPUT);
  _radioPin = radioPin;
}

TrainingCollar::TCMessageWithTimings TrainingCollar::build(byte channel, unsigned int serial, byte mode, byte level) {
  TrainingCollar::TCMessageWithTimings xy = {0};
  build(&xy, channel, serial, mode, level);
  return xy;
}

void TrainingCollar::build(const TCMessageWithTimings *xy, byte channel, unsigned int serial, byte mode, byte level) {
  buildStart(&xy->message);
  buildChannel(&xy->message, channel);
  buildMode(&xy->message, mode);
  buildSerial(&xy->message, serial);
  buildLevel(&xy->message, level);
  buildChecksum(&xy->message);
  buildEnd(&xy->message);

#ifdef TC_DEBUG
  Serial.println("build(...) calling printTCMessage(...)");
  printTCMessage(&xy->message);
#endif

  calculateTimings(xy);


#ifdef TC_DEBUG
  Serial.println("build(...) calling printTCMessage(...)");
  printTCMessageTimings(&xy->messageTimings);
#endif
}

void TrainingCollar::printTCMessage(TCMessage *x) {
  Serial.println();
  Serial.println("-- DEBUG START --");
  Serial.print("Start="); Serial.println(x->start & 0b1);
  Serial.print("Channel="); Serial.println(x->channel);
  Serial.print("Mode="); Serial.println(x->mode);
  Serial.print("Serial="); Serial.println(x->serial);
  Serial.print("Level="); Serial.println(x->level);
  Serial.print("Checksum="); Serial.println(x->checksum);
  Serial.print("End="); Serial.println(x->end & 0b1);
  Serial.println("-- DEBUG END --");
}

void TrainingCollar::printTCMessageTimings(TCMessageTimings *y) {

  Serial.println("-- DEBUG START --");
  Serial.print("Printing timings of size "); Serial.print(TC_MESSAGE_BITS_TOTAL * TC_TIMINGS_PER_BIT);
  Serial.print(" (would be on pin "); Serial.print(_radioPin);
  Serial.println(")");

  for (int i = 0; i < (TC_MESSAGE_BITS_TOTAL * TC_TIMINGS_PER_BIT); ++i) {
    Serial.print(y->timings[i]); Serial.print(", ");
  }
  Serial.println();
  Serial.println("-- DEBUG END --");
}

void TrainingCollar::buildStart(TCMessage *x) {
  x->start = 0b0;
}

void TrainingCollar::buildChannel(TCMessage *x, byte channel) {
  x->channel = min(channel, 0b1111); //AKA range 0-15
}

void TrainingCollar::buildMode(TCMessage *x, byte mode) {
  if (mode >= TC_MODES)
    mode = TC_MODE_DEFAULT;

  x->mode = TC_MODE_LOOKUP[mode];
}

void TrainingCollar::buildSerial(TCMessage *x, unsigned int serial) {
  x->serial = serial;
}

void TrainingCollar::buildLevel(TCMessage *x, byte level) {
  x->level = min(level, 100);  // Receiver seems to cap this at 100
}

void TrainingCollar::buildChecksum(TCMessage *x) {
  //The checksum is the channel and mode, reversed and inverted
  byte combo = x->channel << 4 | x->mode;
  byte checksum = 0;

  /*
     https://stackoverflow.com/a/14565568
     Shift it from the source position
     Mask it with AND to get only that bit
     Shift it back to the destination posititon
     Set that bit using EQUALS OR
  */
  for (int k = 0; k < 8; ++k) {
    checksum |= ((combo >> k) & 0b1) << (7 - k);
  }

#ifdef TC_DEBUG
  Serial.print("channel="); _printByte(x->channel);
  Serial.print("mode="); _printByte(x->mode);
  Serial.print("combo="); _printByte(combo);
  Serial.print("reversed="); _printByte(checksum);
#endif

  checksum = ~checksum; // Bitwise NOT

#ifdef TC_DEBUG
  Serial.print("checksum="); _printByte(checksum);
#endif

  x->checksum = checksum;
}

void TrainingCollar::buildEnd(TCMessage *x) {
  x->end = 0b0;
}

void TrainingCollar::_printByte(byte input) {
  Serial.print("0b");
  for (int i = 0; i < 8; i++)
    Serial.print(input >> (7 - i) & 0b1);
  Serial.println();
}

void TrainingCollar::calculateTimings(TCMessageWithTimings *xy) {
  TCMessage *x = &xy->message;
  TCMessageTimings *y = &xy->messageTimings;
  int currentTimingIndex = 0;

  /*
    x->start = 0; x->channel = 0; x->mode = 0; x->serial = 0; x->level = 0; x->checksum = 0; x->end = 0;
  */

  void *ptr[TC_MESSAGE_PARTS] = {&x->start, &x->channel, &x->mode, &x->serial, &x->level, &x->checksum, &x->end};

  for (int i = 0; i < TC_MESSAGE_PARTS; ++i)
  {
    unsigned int yTemp = *(unsigned int *)ptr[i];
    int bitsToRead = TC_LENGTHS[i];

#ifdef TC_DEBUG
    Serial.print("currentTimingIndex="); Serial.println(currentTimingIndex);
    Serial.print("currentTimingIndex/2="); Serial.println(currentTimingIndex / 2);
#endif

    for (int k = 0; k < bitsToRead; ++k) {
      bool bitValue = bitRead(yTemp, (bitsToRead - 1) - k) & 0b1;

#ifdef TC_DEBUG
      Serial.print(bitValue);
#endif

      if (i == 0) {
        y->timings[currentTimingIndex++] = _timingsStart[0];
        y->timings[currentTimingIndex++] = _timingsStart[1];
      } else if (i == TC_MESSAGE_PARTS - 1) {
        y->timings[currentTimingIndex++] = _timingsEnd[0];
        y->timings[currentTimingIndex++] = _timingsEnd[1];
      } else {
        y->timings[currentTimingIndex++] = (bitValue ? _timingsBitOn[0] : _timingsBitOff[0]);
        y->timings[currentTimingIndex++] = (bitValue ? _timingsBitOn[1] : _timingsBitOff[1]);
      }
#ifdef TC_DEBUG
      Serial.print(" {"); Serial.print(y->timings[currentTimingIndex - 2]);
      Serial.print(", "); Serial.print(y->timings[currentTimingIndex - 1]); Serial.print("} ");
#endif
    }
#ifdef TC_DEBUG
    //Serial.println();
#endif
  }

#ifdef TC_DEBUG
  Serial.print("end currentTimingIndex="); Serial.println(currentTimingIndex);
  Serial.print("end currentTimingIndex/2="); Serial.println(currentTimingIndex / 2);
  printTCMessageTimings(y);
#endif

  return y;
}

void TrainingCollar::transmit(TCMessageWithTimings *xy) {
  bool flipFlop;

  for (int repeats = 0; repeats < 3; ++repeats) {
    flipFlop = true;

    for (int i = 0; i < (TC_MESSAGE_BITS_TOTAL * TC_TIMINGS_PER_BIT); ++i) {
      digitalWrite(_radioPin, flipFlop);
      delayMicroseconds(xy->messageTimings.timings[i]);
      flipFlop = !flipFlop;
    }
  }
}



== TrainingCollar.h ============================================================


/*
   TrainingCollar.h - Library for controlling a generic Pet Training Collar
*/
#ifndef TrainingCollar_h
#define TrainingCollar_h

#include "Arduino.h"

#define TC_SIGNAL_CHANNEL_LENGTH    4
#define TC_SIGNAL_MODE_LENGTH       4
#define TC_TIMINGS_PER_BIT          2

#define TC_MESSAGE_PARTS            7
#define TC_MESSAGE_START_LENGTH     1
#define TC_MESSAGE_START_START      0
#define TC_MESSAGE_START_END        1
#define TC_MESSAGE_CHANNEL_LENGTH   4
#define TC_MESSAGE_CHANNEL_START    1
#define TC_MESSAGE_CHANNEL_END      5
#define TC_MESSAGE_MODE_LENGTH      4
#define TC_MESSAGE_MODE_START       5
#define TC_MESSAGE_MODE_END         9
#define TC_MESSAGE_SERIAL_LENGTH    16
#define TC_MESSAGE_SERIAL_START     9
#define TC_MESSAGE_SERIAL_END       25
#define TC_MESSAGE_LEVEL_LENGTH     8
#define TC_MESSAGE_LEVEL_START      25
#define TC_MESSAGE_LEVEL_END        33
#define TC_MESSAGE_CHECKSUM_LENGTH  8
#define TC_MESSAGE_CHECKSUM_START   33
#define TC_MESSAGE_CHECKSUM_END     41
#define TC_MESSAGE_END_LENGTH       1
#define TC_MESSAGE_END_START        41
#define TC_MESSAGE_END_END          42
#define TC_MESSAGE_BITS_TOTAL       42

#define TC_MODES                    4
#define TC_MODE_LIGHT               0
#define TC_MODE_LIGHT_VALUE         0b1000
#define TC_MODE_AUDIO               1
#define TC_MODE_AUDIO_VALUE         0b0100
#define TC_MODE_VIBRATION           2
#define TC_MODE_VIBRATION_VALUE     0b0010
#define TC_MODE_SHOCK               3
#define TC_MODE_SHOCK_VALUE         0b0001
#define TC_MODE_DEFAULT             TC_MODE_LIGHT

const byte TC_START_POS[TC_MESSAGE_PARTS] = {TC_MESSAGE_START_START, TC_MESSAGE_CHANNEL_START, TC_MESSAGE_MODE_START, TC_MESSAGE_SERIAL_START, TC_MESSAGE_LEVEL_START, TC_MESSAGE_CHECKSUM_START, TC_MESSAGE_END_START};
const byte TC_LENGTHS[TC_MESSAGE_PARTS] = {TC_MESSAGE_START_LENGTH, TC_MESSAGE_CHANNEL_LENGTH, TC_MESSAGE_MODE_LENGTH, TC_MESSAGE_SERIAL_LENGTH, TC_MESSAGE_LEVEL_LENGTH, TC_MESSAGE_CHECKSUM_LENGTH, TC_MESSAGE_END_LENGTH};
const byte TC_MODE_LOOKUP[TC_MODES] = {TC_MODE_LIGHT_VALUE, TC_MODE_AUDIO_VALUE, TC_MODE_VIBRATION_VALUE, TC_MODE_SHOCK_VALUE};

/*
 *          Bits  Description
 * START    1     Start
 * CHANNEL  4     The channel (A or B on the remote, but reciever seems to accept all values 0-15).
 * MODE     4     4 bits, 1 for each mode. You can't mix modes, it will just pick the leftmost bit to use. 
 * SERIAL   16    Remote serial number. Unique to each remote, presumably to stop you interering with other users.
 * LEVEL    8     Max 100, anything over 100 seems to be at the same strength as 100.
 *                Light / Audio - No change, Vibration / Shock - Controls intensity.
 * CHECKSUM 8     Channel (4 bits) and Mode (4 bits) to make 8 bits, which are then reverse ordered and inverted.
 * END      1     End
 * --------------------
 *          42
 */

class TrainingCollar {
  public:

    typedef struct {
      byte start;// : 1; //1
      byte channel;// : 4; //5
      byte mode;// : 4; //9
      unsigned int serial;// : 16; //25
      byte level;// : 8; //33
      byte checksum;// : 8; //41
      byte end;// : 1; //42
    } TCMessage;

    typedef struct {
      int timings[TC_MESSAGE_BITS_TOTAL * TC_TIMINGS_PER_BIT];
    } TCMessageTimings;

    typedef struct {
      TCMessage message;
      TCMessageTimings messageTimings;
    } TCMessageWithTimings;

    TrainingCollar(int radioPin);
    TrainingCollar::TCMessageWithTimings TrainingCollar::build(byte channel, unsigned int serial, byte mode, byte level);
    void build(const TCMessageWithTimings *x, byte channel, unsigned int serial, byte mode, byte level);
    void printTCMessage(TCMessage *x);
    void printTCMessageTimings(TCMessageTimings *y);
    void calculateTimings(TCMessageWithTimings *xy);
    void transmit(TCMessageWithTimings *y);
  private:
    const int _timingsStart[2] = {1456, 780};
    const int _timingsEnd[2] = {208, 10428};
    const int _timingsBitOn[TC_TIMINGS_PER_BIT] = {741, 247}; //{708, 280};
    const int _timingsBitOff[TC_TIMINGS_PER_BIT] = {247, 741}; // {208, 780};

    int _radioPin;

    //void insertBits(bool input_array[], int output_array[], int _inputSize, int offset);
    //void insertRawTimings(bool bits[], int timings[], int _size, int offset);
    
    void buildStart(TCMessage*);
    void buildChannel(TCMessage*, byte channel);
    void buildMode(TCMessage*, byte mode);
    void buildSerial(TCMessage*, unsigned int serial);
    void buildLevel(TCMessage*, byte level);
    void buildChecksum(TCMessage*);
    void buildEnd(TCMessage*);

    void _printByte(byte);
};

#endif
```
