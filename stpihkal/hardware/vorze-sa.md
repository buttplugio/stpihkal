# Vorze SA Series (Cyclone A10 SA, UFO SA)

## Introduction

The Vorze SA series are the bluetooth enabled (Standalone, or SA)
versions of Rends Vorze series sex toys. 

The A10 Cyclone SA is designed for penile stimulation. It consists of
a rotating cylinder that can hold an array of different onahole style
sleeves, with each sleeve having different textures.

The UFO SA is designed for nipple stimulation. It has two breast cups
with rotating elements that can hold modular nipple stimulators,
representing tongues as well as other types of textures.

Bluetooth control allows for rotation direction and speed to be set on
the hardware.

## Device Identification

As the devices share similar BLE GATT Service IDs, their BLE device
names can be used for identification.

- For the Cyclone SA, the bluetooth name is **CycSA**
- For the UFO SA, the bluetooth name is **UFOSA**

## Bluetooth Details

Vorze toys uses Bluetooth LE to communicate with other machines. The
main service UUID for the hardware is

```
40ee1111-63ec-4b7f-8ce7-712efd55b90e
```

To send data to a unit, use the following characteristic ID

```
40ee2222-63ec-4b7f-8ce7-712efd55b90e
```

While 2 characteristics with read properties are also part of the
service, their usage is currently unknown.

### USB Dongle

Vorze toys are distributed with a USB dongle that will cause the BTLE
connection to emulate a serial port on windows. This allows the toy to
be easily used on all operating systems that do not have BTLE
capabilities, such a Windows XP/7/8, OS X < 10.6, or Linux with Bluez
< 5.28.

Unlike Bluetooth 2 SPP, serial settings seem to matter for this
dongle. Serial port communication will need to run at 19200 baud,
8/N/1, no flow control. Any other baud rate will cause errors
resulting in the machine needing to be power cycled.

## Protocol

To communicate with Vorze hardware, a simple one-way protocol is used.

Each packet consists of 3 bytes in the following format:

```
0x0X 0x01 0xZZ
```

### Identifier Byte

Byte 0, denoted 0x0X in the above example, is a device identifier. It
needs to be set as follows:

- Cyclone SA: 0x01
- UFO SA: 0x02

### Reserved Byte

Byte 1 has been observed to always be 0x01 for all Vorze toys. It is
assumed this byte is reserved for future use.

### Direction and Speed Byte

Byte 2, denoted 0xZZ in the above example, sets the speed and
direction of the hardware.

Direction is specified by most signicant bit of the 3rd byte. 0
denotes clockwise movement, 1 denotes counterclockwise movement.

Speed is specified by the 7 remaining bits of the 3rd byte. There are
100 steps of speeds available. *All speeds > 100 are ignored.*

### Examples

To set the A10 Cyclone (byte 0: 0x01) spinning clockwise at 50% speed
(byte 2: (0x00 << 7) | 0x32 = 0x32), use the following command:

```
0x01 0x01 0x32
```

To set the UFO SA (byte 0: 0x02) spinning counterclockwise at 100%
speed (byte 2: (0x01 << 7) | 0x64 = 0xe4), use the following command:

```
0x02 0x01 0xe4
```

A speed over 100 will be ignored, so if, after the previous command,
the following command were sent

```
0x02 0x01 0xef
```

The toy would continue spinning at 100% speed as if no command had
been sent.
