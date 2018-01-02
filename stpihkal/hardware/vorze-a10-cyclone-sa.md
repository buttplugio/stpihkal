# Vorze A10 Cyclone SA

## Introduction

The Vorze A10 Cyclone SA is the bluetooth enabled version of the Rends
A10 Cyclone. The Cyclone comes with a rotating cylinder that can hold
an array of different sleeves, each having different textures.
Bluetooth control allows for rotation direction and speed to be set.

## Bluetooth Details

Vorze uses Bluetooth LE to communicate with other machines. 

### A10 Cyclone

The main service UUID for the A10 Cyclone is

```
40ee1111-63ec-4b7f-8ce7-712efd55b90e
```

To send data to the A10 Cyclone Unit, use the following characteristic

```
40ee2222-63ec-4b7f-8ce7-712efd55b90e
```

### USB Dongle

Vorze toys are distributed with a USB dongle that will cause the BTLE
connection to emulate a serial port on windows. This allows the toy to
be easily used on all operating systems that do not have BTLE
capabilities, such a Windows XP/7/8/10 (though Windows 10 will have
BTLE capabilities sometime in 2017), OS X < 10.6, or Linux with Bluez
< 5.28.

Unlike Bluetooth 2 SPP, serial settings seem to matter for this
dongle. Serial port communication will need to run at 19200 baud,
8/N/1, no flow control. Any other baud rate will cause errors
resulting in the machine needing to be power cycled.

## Protocol

To communicate with the A10 Cyclone, a simple one-way protocol is used.

Each packet consists of 3 bytes in the following format:

```
0x01 0x01 0xZZ
```

### Reserved Bytes

The first and second byte have been observed (by tapping A10 Cyclone
communication) to always be 0x01, but this may not always be the case.
It is assumed these bytes are reserved for future use. The third byte,
denoted 0xZZ, sets the speed and direction of the toy.

### Direction

Direction is specified by most signicant bit of the 3rd byte. 0
denotes clockwise movement, 1 denotes counterclockwise movement.

### Speed

Speed is specified by the 7 remaining bits of the 3rd byte. There are
100 steps of speeds available. All speeds > 100 are ignored.

### Examples

To set the A10 Cyclone spinning clockwise at 50% speed, use the following command:

```
0x01 0x01 0x32
```

To set the A10 Cyclone spinning counterclockwise at 100% speed, use the following command:

```
0x01 0x01 0xe4
```

A speed over 100 will be ignored, so if, after the previous command,
the following command were sent

```
0x01 0x01 0xef
```

The toy would just continue spinning at 100% speed.
